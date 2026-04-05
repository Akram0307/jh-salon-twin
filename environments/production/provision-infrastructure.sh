#!/usr/bin/env bash
# =============================================================================
# SalonOS Production Infrastructure Provisioning Script
# GCP Project: salon-saas-487508 | Region: us-central1
# Production-grade: HA, backups, standard tier, higher min instances
# =============================================================================
# PREREQUISITES:
#   - gcloud CLI installed and authenticated
#   - Project set: gcloud config set project salon-saas-487508
#   - Roles needed: Compute Admin, Cloud SQL Admin, Redis Admin,
#     Secret Manager Admin, IAM Admin
# =============================================================================
set -euo pipefail

PROJECT_ID="salon-saas-487508"
REGION="us-central1"
VPC_CONNECTOR="salonos-prod-vpc"
VPC_RANGE="10.9.0.0/28"
NETWORK="default"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Provision VPC Access Connector for Production
# =============================================================================
# Production: e2-micro machines, min=2 max=10 for higher throughput capacity.
# Estimated cost: ~$17/month (2 min instances * $8.50/mo each)
# =============================================================================
provision_vpc_connector() {
    log_info "=== Provisioning VPC Access Connector ==="

    if gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR" \
        --region="$REGION" --project="$PROJECT_ID" 2>/dev/null; then
        log_warn "VPC connector '$VPC_CONNECTOR' already exists. Skipping creation."
    else
        log_info "Creating VPC connector: $VPC_CONNECTOR (range: $VPC_RANGE, e2-micro)"
        gcloud compute networks vpc-access connectors create "$VPC_CONNECTOR" \
            --region="$REGION" \
            --range="$VPC_RANGE" \
            --network="$NETWORK" \
            --min-instances=2 \
            --max-instances=10 \
            --machine-type=e2-micro \
            --project="$PROJECT_ID"
        log_info "VPC connector created. Estimated cost: ~\$17/month"
    fi

    gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR" \
        --region="$REGION" --project="$PROJECT_ID" --format="value(state)"
    log_info "=== VPC Connector: COMPLETE ==="
}

# =============================================================================
# Provision Production Cloud SQL Instance (HA)
# =============================================================================
# Production upgrades over staging:
#   - db-custom-2-4096 (2 vCPU, 4GB RAM) vs db-f1-micro
#   - High Availability (regional) enabled
#   - Point-in-time recovery enabled
#   - 7-day backup retention
#   - Auto-resize enabled with 50GB initial storage
#   - Deletion protection ENABLED (safety net for production)
# =============================================================================
provision_cloud_sql() {
    log_info "=== Provisioning Cloud SQL Instance (HA) ==="

    local DB_INSTANCE="salonos-prod-db"
    local DB_NAME="salonos_production"
    local DB_USER="prod-user"
    local DB_PASS
    DB_PASS="$(openssl rand -base64 48 | tr -d '=/+' | head -c 40)"

    if gcloud sql instances describe "$DB_INSTANCE" \
        --project="$PROJECT_ID" 2>/dev/null; then
        log_warn "Cloud SQL instance '$DB_INSTANCE' already exists. Skipping creation."
    else
        log_info "Creating Cloud SQL HA instance: $DB_INSTANCE (POSTGRES_15, db-custom-2-4096)"
        gcloud sql instances create "$DB_INSTANCE" \
            --database-version=POSTGRES_15 \
            --tier=db-custom-2-4096 \
            --region="$REGION" \
            --no-assign-ip \
            --network="$NETWORK" \
            --availability-type=REGIONAL \
            --storage-auto-resize \
            --storage-auto-resize-limit=100GB \
            --storage-size=50GB \
            --storage-type=SSD \
            --backup-start-time=02:00 \
            --backup \
            --retained-backups-count=7 \
            --enable-point-in-time-recovery \
            --deletion-protection=true \
            --project="$PROJECT_ID"
        log_info "Waiting for Cloud SQL HA instance to become ready..."
        gcloud sql instances wait "$DB_INSTANCE" \
            --timeout=900 --project="$PROJECT_ID"
    fi

    # Get instance connection name
    local INSTANCE_CONN_NAME
    INSTANCE_CONN_NAME="$(gcloud sql instances describe "$DB_INSTANCE" \
        --project="$PROJECT_ID" --format='value(connectionName)')"
    log_info "Instance connection name: $INSTANCE_CONN_NAME"

    # Create database
    if gcloud sql databases describe "$DB_NAME" \
        --instance="$DB_INSTANCE" --project="$PROJECT_ID" 2>/dev/null; then
        log_warn "Database '$DB_NAME' already exists."
    else
        log_info "Creating database: $DB_NAME"
        gcloud sql databases create "$DB_NAME" \
            --instance="$DB_INSTANCE" --project="$PROJECT_ID"
    fi

    # Create user
    if gcloud sql users list --instance="$DB_INSTANCE" --project="$PROJECT_ID" \
        --filter="name=$DB_USER" --format="value(name)" | grep -q "$DB_USER"; then
        log_warn "User '$DB_USER' already exists. Skipping user creation."
        log_warn "IMPORTANT: Update DB_PASSWORD secret manually if needed."
    else
        log_info "Creating database user: $DB_USER"
        gcloud sql users create "$DB_USER" \
            --instance="$DB_INSTANCE" \
            --password="$DB_PASS" \
            --project="$PROJECT_ID"
        log_info "DB_USER=$DB_USER"
        log_info "DB_PASSWORD=$DB_PASS (SAVE THIS - displayed once)"
    fi

    # Get private IP
    local DB_HOST
    DB_HOST="$(gcloud sql instances describe "$DB_INSTANCE" \
        --project="$PROJECT_ID" --format='value(ipAddresses[0].ipAddress)')"
    log_info "DB_HOST (private IP): $DB_HOST"
    log_info "INSTANCE_CONNECTION_NAME: $INSTANCE_CONN_NAME"
    log_info "=== Cloud SQL: COMPLETE ==="
}

# =============================================================================
# Provision Production Memorystore Redis (Standard Tier)
# =============================================================================
# Production upgrade: STANDARD tier provides automatic failover,
# read replicas, and higher availability vs BASIC tier in staging.
# =============================================================================
provision_redis() {
    log_info "=== Provisioning Memorystore Redis (Standard Tier) ==="

    local REDIS_INSTANCE="salonos-prod-redis"

    if gcloud redis instances describe "$REDIS_INSTANCE" \
        --region="$REGION" --project="$PROJECT_ID" 2>/dev/null; then
        log_warn "Redis instance '$REDIS_INSTANCE' already exists. Skipping creation."
    else
        log_info "Creating Redis instance: $REDIS_INSTANCE (Standard, 1GB, private)"
        gcloud redis instances create "$REDIS_INSTANCE" \
            --size=1 \
            --region="$REGION" \
            --network="$NETWORK" \
            --tier=STANDARD \
            --redis-version=redis_7_0 \
            --replica-count=1 \
            --project="$PROJECT_ID"
        log_info "Waiting for Redis instance to become ready..."
        sleep 10
        gcloud redis instances describe "$REDIS_INSTANCE" \
            --region="$REGION" --project="$PROJECT_ID" \
            --format='value(state)' | grep -q "READY" || {
                log_warn "Redis still provisioning. Check status with:"
                log_warn "  gcloud redis instances describe $REDIS_INSTANCE --region=$REGION"
            }
    fi

    local REDIS_HOST
    REDIS_HOST="$(gcloud redis instances describe "$REDIS_INSTANCE" \
        --region="$REGION" --project="$PROJECT_ID" \
        --format='value(host)')"
    local REDIS_PORT
    REDIS_PORT="$(gcloud redis instances describe "$REDIS_INSTANCE" \
        --region="$REGION" --project="$PROJECT_ID" \
        --format='value(port)')"

    log_info "REDIS_HOST: $REDIS_HOST"
    log_info "REDIS_PORT: $REDIS_PORT"
    log_info "=== Redis: COMPLETE ==="
}

# =============================================================================
# Create Secret Manager Secrets for Production
# =============================================================================
# Production secrets: JWT_SECRET, DB_PASSWORD, REDIS_URL,
# TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
# SMTP_PASSWORD, ENCRYPTION_KEY
# All accessed via secretManagerRef in Cloud Run — never plaintext.
# =============================================================================
provision_secrets() {
    log_info "=== Creating Secret Manager Secrets ==="

    generate_secret() { openssl rand -base64 48 | tr -d '=/+' | head -c 40; }

    declare -A SECRETS
    SECRETS[JWT_SECRET]="$(generate_secret)"
    SECRETS[REFRESH_TOKEN_SECRET]="$(generate_secret)"
    SECRETS[ENCRYPTION_KEY]="$(openssl rand -hex 32)"
    SECRETS[DB_USER]="prod-user"
    SECRETS[DB_PASSWORD]="$(generate_secret)"
    SECRETS[DB_PORT]="5432"
    SECRETS[DB_NAME]="salonos_production"
    SECRETS[REDIS_PORT]="6379"

    for SECRET_NAME in "${!SECRETS[@]}"; do
        local FULL_NAME="salonos-prod-${SECRET_NAME}"
        if gcloud secrets describe "$FULL_NAME" \
            --project="$PROJECT_ID" 2>/dev/null; then
            log_warn "Secret '$FULL_NAME' exists. Adding new version."
            echo -n "${SECRETS[$SECRET_NAME]}" | \
                gcloud secrets versions add "$FULL_NAME" \
                --data-file=- --project="$PROJECT_ID"
        else
            log_info "Creating secret: $FULL_NAME"
            echo -n "${SECRETS[$SECRET_NAME]}" | \
                gcloud secrets create "$FULL_NAME" \
                --data-file=- --project="$PROJECT_ID"
        fi
    done

    # Infrastructure-dependent secrets
    log_warn ""
    log_warn "IMPORTANT: Run these commands AFTER Cloud SQL and Redis are READY:"
    log_warn ""

    local DB_HOST
    DB_HOST="$(gcloud sql instances describe salonos-prod-db \
        --project="$PROJECT_ID" --format='value(ipAddresses[0].ipAddress)' 2>/dev/null || echo 'PENDING')"
    local REDIS_HOST
    REDIS_HOST="$(gcloud redis instances describe salonos-prod-redis \
        --region="$REGION" --project="$PROJECT_ID" --format='value(host)' 2>/dev/null || echo 'PENDING')"
    local INSTANCE_CONN_NAME
    INSTANCE_CONN_NAME="$(gcloud sql instances describe salonos-prod-db \
        --project="$PROJECT_ID" --format='value(connectionName)' 2>/dev/null || echo 'PENDING')"

    for INFRA_SECRET in DB_HOST REDIS_HOST INSTANCE_CONNECTION_NAME; do
        local VAL
        case "$INFRA_SECRET" in
            DB_HOST) VAL="$DB_HOST" ;;
            REDIS_HOST) VAL="$REDIS_HOST" ;;
            INSTANCE_CONNECTION_NAME) VAL="$INSTANCE_CONN_NAME" ;;
        esac
        local FULL_NAME="salonos-prod-${INFRA_SECRET}"
        if [[ "$VAL" != "PENDING" ]]; then
            if gcloud secrets describe "$FULL_NAME" --project="$PROJECT_ID" 2>/dev/null; then
                echo -n "$VAL" | gcloud secrets versions add "$FULL_NAME" \
                    --data-file=- --project="$PROJECT_ID"
            else
                echo -n "$VAL" | gcloud secrets create "$FULL_NAME" \
                    --data-file=- --project="$PROJECT_ID"
            fi
            log_info "Set $FULL_NAME = $VAL"
        else
            log_warn "SKIP $FULL_NAME (infrastructure not ready yet)"
        fi
    done

    # Placeholder secrets for external services (MUST be set manually before deploy)
    for PLACEHOLDER in TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_PHONE_NUMBER \
        OPENROUTER_API_KEY SMTP_HOST SMTP_USER SMTP_PASSWORD; do
        local FULL_NAME="salonos-prod-${PLACEHOLDER}"
        if ! gcloud secrets describe "$FULL_NAME" --project="$PROJECT_ID" 2>/dev/null; then
            echo -n "SET_ME_MANUALLY" | gcloud secrets create "$FULL_NAME" \
                --data-file=- --project="$PROJECT_ID"
            log_warn "Created placeholder: $FULL_NAME (SET MANUALLY BEFORE DEPLOY)"
        else
            log_warn "Secret $FULL_NAME already exists"
        fi
    done

    log_info "=== Secrets: COMPLETE ==="
}

# =============================================================================
# Create Production Service Account with Minimal IAM
# =============================================================================
# Production SA: salonos-prod-sa with Cloud SQL Client,
# Secret Manager Secret Accessor, Cloud Run Invoker roles.
# =============================================================================
provision_service_account() {
    log_info "=== Creating Production Service Account ==="

    local SA_EMAIL="salonos-prod-sa@${PROJECT_ID}.iam.gserviceaccount.com"
    local SA_DISPLAY="SalonOS Production Service Account"

    if gcloud iam service-accounts describe "$SA_EMAIL" \
        --project="$PROJECT_ID" 2>/dev/null; then
        log_warn "Service account '$SA_EMAIL' already exists. Skipping creation."
    else
        log_info "Creating service account: $SA_EMAIL"
        gcloud iam service-accounts create "salonos-prod-sa" \
            --display-name="$SA_DISPLAY" \
            --project="$PROJECT_ID"
    fi

    log_info "Binding minimal IAM roles..."

    # cloudsql.client - Connect to Cloud SQL via private IP
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/cloudsql.client" \
        --condition=None 2>/dev/null || true

    # secretmanager.secretAccessor - Read secrets from Secret Manager
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/secretmanager.secretAccessor" \
        --condition=None 2>/dev/null || true

    # run.invoker - Invoke Cloud Run services (for inter-service calls)
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/run.invoker" \
        --condition=None 2>/dev/null || true

    # logging.logWriter - Write logs to Cloud Logging
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/logging.logWriter" \
        --condition=None 2>/dev/null || true

    # monitoring.metricWriter - Write metrics to Cloud Monitoring
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/monitoring.metricWriter" \
        --condition=None 2>/dev/null || true

    log_info "Service account roles bound:"
    log_info "  - roles/cloudsql.client"
    log_info "  - roles/secretmanager.secretAccessor"
    log_info "  - roles/run.invoker"
    log_info "  - roles/logging.logWriter"
    log_info "  - roles/monitoring.metricWriter"

    log_info "=== Service Account: COMPLETE ==="
}

# =============================================================================
# Main Execution
# =============================================================================
main() {
    log_info "SalonOS PRODUCTION Infrastructure Provisioning"
    log_info "Project: $PROJECT_ID | Region: $REGION"
    log_info "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo ""

    provision_vpc_connector
    echo ""
    provision_cloud_sql
    echo ""
    provision_redis
    echo ""
    provision_secrets
    echo ""
    provision_service_account
    echo ""

    log_info "========================================"
    log_info "ALL PRODUCTION PROVISIONING COMPLETE"
    log_info "========================================"
    log_info ""
    log_info "POST-PROVISIONING STEPS:"
    log_info "1. SET ALL PLACEHOLDER SECRETS MANUALLY (TWILIO_*, SMTP_*, etc.)"
    log_info "2. Verify Cloud SQL HA: gcloud sql instances describe salonos-prod-db"
    log_info "3. Verify Redis standard tier: gcloud redis instances describe salonos-prod-redis --region=us-central1"
    log_info "4. Verify VPC connector: gcloud compute networks vpc-access connectors describe salonos-prod-vpc --region=us-central1"
    log_info "5. Run deploy-production.sh when all secrets are set"
}

main "$@"
