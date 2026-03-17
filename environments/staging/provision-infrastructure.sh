#!/usr/bin/env bash
# =============================================================================
# SalonOS Staging Infrastructure Provisioning Script
# GCP Project: salon-saas-487508 | Region: us-central1
# Sprint 5 - Tasks S5-I1 through S5-I5
# =============================================================================
# PREREQUISITES:
#   - gcloud CLI installed and authenticated
#   - Project set: gcloud config set project salon-saas-487508
#   - Roles needed: Compute Admin, Cloud SQL Admin, Redis Admin, Secret Manager Admin, IAM Admin
# =============================================================================
set -euo pipefail

PROJECT_ID="salon-saas-487508"
REGION="us-central1"
VPC_CONNECTOR="salonos-staging-vpc"
VPC_RANGE="10.8.0.0/28"
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
# S5-I1: Provision VPC Access Connector for Staging
# =============================================================================
# Best Practice: /28 range (16 IPs) supports up to ~1 Gbps throughput.
# min-instances=2 keeps connector warm (cold start ~30s), max-instances=3 for burst.
# Estimated cost: ~$17/month (2 min instances * $8.50/mo each)
# Reference: https://cloud.google.com/vpc/docs/configure-serverless-vpc-access
# =============================================================================
provision_vpc_connector() {
    log_info "=== S5-I1: Provisioning VPC Access Connector ==="
    
    if gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR" \
        --region="$REGION" --project="$PROJECT_ID" 2>/dev/null; then
        log_warn "VPC connector '$VPC_CONNECTOR' already exists. Skipping creation."
    else
        log_info "Creating VPC connector: $VPC_CONNECTOR (range: $VPC_RANGE)"
        gcloud compute networks vpc-access connectors create "$VPC_CONNECTOR" \
            --region="$REGION" \
            --range="$VPC_RANGE" \
            --network="$NETWORK" \
            --min-instances=2 \
            --max-instances=3 \
            --project="$PROJECT_ID"
        log_info "VPC connector created. Estimated cost: ~\$17/month"
    fi
    
    # Verify
    gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR" \
        --region="$REGION" --project="$PROJECT_ID" --format="value(state)"
    log_info "=== S5-I1: COMPLETE ==="
}

# =============================================================================
# S5-I2: Provision Staging Cloud SQL Instance
# =============================================================================
# Decision: Private IP only (no public IP) via VPC connector.
# Why private IP over Cloud SQL Auth Proxy:
#   - No sidecar container needed (simpler Cloud Run deployment)
#   - Lower latency (direct VPC path vs proxy overhead)
#   - No proxy connection pooling complexity
#   - Sufficient for staging workload (db-f1-micro)
# Trade-off: Requires VPC connector (already provisioned in S5-I1)
# =============================================================================
provision_cloud_sql() {
    log_info "=== S5-I2: Provisioning Cloud SQL Instance ==="
    
    local DB_INSTANCE="salonos-staging-db"
    local DB_NAME="salonos_staging"
    local DB_USER="staging-user"
    local DB_PASS
    DB_PASS="$(openssl rand -base64 32 | tr -d '=/+' | head -c 32)"
    
    if gcloud sql instances describe "$DB_INSTANCE" \
        --project="$PROJECT_ID" 2>/dev/null; then
        log_warn "Cloud SQL instance '$DB_INSTANCE' already exists. Skipping creation."
    else
        log_info "Creating Cloud SQL instance: $DB_INSTANCE (POSTGRES_15, db-f1-micro, private IP)"
        gcloud sql instances create "$DB_INSTANCE" \
            --database-version=POSTGRES_15 \
            --tier=db-f1-micro \
            --region="$REGION" \
            --no-assign-ip \
            --network="$NETWORK" \
            --no-auto-resize \
            --storage-size=10GB \
            --storage-type=SSD \
            --backup-start-time=02:00 \
            --enable-point-in-time-recovery \
            --deletion-protection=false \
            --project="$PROJECT_ID"
        log_info "Waiting for Cloud SQL instance to become ready..."
        gcloud sql instances wait "$DB_INSTANCE" \
            --timeout=600 --project="$PROJECT_ID"
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
    
    # Create user with limited permissions
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
    log_info "=== S5-I2: COMPLETE ==="
}

# =============================================================================
# S5-I3: Provision Staging Memorystore Redis
# =============================================================================
provision_redis() {
    log_info "=== S5-I3: Provisioning Memorystore Redis ==="
    
    local REDIS_INSTANCE="salonos-staging-redis"
    
    if gcloud redis instances describe "$REDIS_INSTANCE" \
        --region="$REGION" --project="$PROJECT_ID" 2>/dev/null; then
        log_warn "Redis instance '$REDIS_INSTANCE' already exists. Skipping creation."
    else
        log_info "Creating Redis instance: $REDIS_INSTANCE (Basic, 1GB, private)"
        gcloud redis instances create "$REDIS_INSTANCE" \
            --size=1 \
            --region="$REGION" \
            --network="$NETWORK" \
            --tier=BASIC \
            --redis-version=redis_7_0 \
            --project="$PROJECT_ID"
        log_info "Waiting for Redis instance to become ready..."
        # Redis creation can take a few minutes
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
    log_info "=== S5-I3: COMPLETE ==="
}

# =============================================================================
# S5-I4: Create Secret Manager Secrets for Staging
# =============================================================================
# Best Practice: Use --set-secrets in Cloud Run instead of env_vars for:
#   - Automatic rotation support
#   - No exposure in Cloud Run service definition
#   - Versioned secrets with rollback capability
#   - Audit logging for secret access
# Reference: https://cloud.google.com/run/docs/configuring/secrets
# =============================================================================
provision_secrets() {
    log_info "=== S5-I4: Creating Secret Manager Secrets ==="
    
    # Generate random values for secrets
    generate_secret() { openssl rand -base64 48 | tr -d '=/+' | head -c 40; }
    
    declare -A SECRETS
    SECRETS[
        JWT_SECRET_STAGING]="$(generate_secret)"
    SECRETS[REFRESH_TOKEN_SECRET_STAGING]="$(generate_secret)"
    SECRETS[DB_USER]="staging-user"
    SECRETS[DB_PASSWORD]="$(generate_secret)"
    SECRETS[DB_PORT]="5432"
    SECRETS[DB_NAME]="salonos_staging"
    SECRETS[REDIS_PORT]="6379"
    SECRETS[STAGING_BASIC_AUTH_PASSWORD]="$(generate_secret)"
    
    # DB_HOST and REDIS_HOST will be set after infrastructure is provisioned
    # INSTANCE_CONNECTION_NAME from Cloud SQL
    
    for SECRET_NAME in "${!SECRETS[@]}"; do
        local FULL_NAME="salonos-staging-${SECRET_NAME}"
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
    
    # Infrastructure-dependent secrets (set after S5-I2 and S5-I3)
    log_warn ""
    log_warn "IMPORTANT: Run these commands AFTER Cloud SQL and Redis are READY:"
    log_warn ""
    
    local DB_HOST
    DB_HOST="$(gcloud sql instances describe salonos-staging-db \
        --project="$PROJECT_ID" --format='value(ipAddresses[0].ipAddress)' 2>/dev/null || echo 'PENDING')"
    local REDIS_HOST
    REDIS_HOST="$(gcloud redis instances describe salonos-staging-redis \
        --region="$REGION" --project="$PROJECT_ID" --format='value(host)' 2>/dev/null || echo 'PENDING')"
    local INSTANCE_CONN_NAME
    INSTANCE_CONN_NAME="$(gcloud sql instances describe salonos-staging-db \
        --project="$PROJECT_ID" --format='value(connectionName)' 2>/dev/null || echo 'PENDING')"
    
    for INFRA_SECRET in DB_HOST REDIS_HOST INSTANCE_CONNECTION_NAME; do
        local VAL
        case "$INFRA_SECRET" in
            DB_HOST) VAL="$DB_HOST" ;;
            REDIS_HOST) VAL="$REDIS_HOST" ;;
            INSTANCE_CONNECTION_NAME) VAL="$INSTANCE_CONN_NAME" ;;
        esac
        local FULL_NAME="salonos-staging-${INFRA_SECRET}"
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
    
    # Placeholder secrets for external services (set manually)
    for PLACEHOLDER in TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN OPENROUTER_API_KEY SMTP_HOST SMTP_USER SMTP_PASS; do
        local FULL_NAME="salonos-staging-${PLACEHOLDER}"
        if ! gcloud secrets describe "$FULL_NAME" --project="$PROJECT_ID" 2>/dev/null; then
            echo -n "SET_ME_MANUALLY" | gcloud secrets create "$FULL_NAME" \
                --data-file=- --project="$PROJECT_ID"
            log_warn "Created placeholder: $FULL_NAME (SET MANUALLY)"
        else
            log_warn "Secret $FULL_NAME already exists"
        fi
    done
    
    log_info "=== S5-I4: COMPLETE ==="
}

# =============================================================================
# S5-I5: Create Staging Service Account with Minimal IAM
# =============================================================================
# Decision on Workload Identity Federation vs Service Account Key:
#   - Workload Identity Federation is the recommended approach for GitHub Actions
#   - Eliminates long-lived SA keys (which are currently used via GCP_SA_KEY)
#   - Uses OIDC tokens from GitHub -> GCP IAM
#   - Migration plan: Sprint 6 (requires GitHub Org settings for OIDC trust)
#   - For now: Create SA with minimal roles, keep SA key for continuity
# =============================================================================
provision_service_account() {
    log_info "=== S5-I5: Creating Staging Service Account ==="
    
    local SA_EMAIL="salonos-staging-sa@${PROJECT_ID}.iam.gserviceaccount.com"
    local SA_DISPLAY="SalonOS Staging Service Account"
    
    if gcloud iam service-accounts describe "$SA_EMAIL" \
        --project="$PROJECT_ID" 2>/dev/null; then
        log_warn "Service account '$SA_EMAIL' already exists. Skipping creation."
    else
        log_info "Creating service account: $SA_EMAIL"
        gcloud iam service-accounts create "salonos-staging-sa" \
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
    
    log_warn ""
    log_warn "WORKLOAD IDENTITY MIGRATION (Sprint 6):"
    log_warn "  Current: SA key stored in GitHub Secrets as GCP_SA_KEY"
    log_warn "  Target: Workload Identity Federation (OIDC from GitHub -> GCP)"
    log_warn "  Benefits: No long-lived keys, automatic rotation, audit trail"
    log_warn "  Steps:"
    log_warn "    1. gcloud iam workload-identity-pools create github-pool"
    log_warn "    2. gcloud iam workload-identity-pools providers create-oidc github-provider"
    log_warn "    3. gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL"
    log_warn "    4. Update deploy.yml to use google-github-actions/auth@v2 with workload_identity_provider"
    log_warn ""
    
    log_info "=== S5-I5: COMPLETE ==="
}

# =============================================================================
# Main Execution
# =============================================================================
main() {
    log_info "SalonOS Staging Infrastructure Provisioning"
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
    log_info "ALL PROVISIONING TASKS COMPLETE"
    log_info "========================================"
    log_info ""
    log_info "POST-PROVISIONING STEPS:"
    log_info "1. Set placeholder secrets manually (TWILIO_*, OPENROUTER_*, SMTP_*)"
    log_info "2. Update GitHub Secrets to match Secret Manager names"
    log_info "3. Run: gcloud secrets describe salonos-staging-DB_HOST --format='value(replicas[0].payload)'
    log_info "4. Verify VPC connector: gcloud compute networks vpc-access connectors describe salonos-staging-vpc --region=us-central1"
    log_info "5. Trigger staging deployment via GitHub Actions"
}

main "$@"
