#!/usr/bin/env bash
# =============================================================================
# SalonOS Production Deployment Script
# Blue-green deployment with pre-flight checks and automatic rollback.
# GCP Project: salon-saas-487508 | Region: us-central1
# =============================================================================
set -euo pipefail

PROJECT_ID="salon-saas-487508"
REGION="us-central1"
BACKEND_SERVICE="salonos-backend-prod"
FRONTEND_SERVICE="salonos-owner-frontend-prod"
SA_EMAIL="salonos-prod-sa@${PROJECT_ID}.iam.gserviceaccount.com"
ARTIFACT_REPO="us-central1-docker.pkg.dev/${PROJECT_ID}/salonos-repo"
HEALTH_TIMEOUT=120
TRAFFIC_SHIFT_WAIT=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $(date -u '+%H:%M:%S') $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $(date -u '+%H:%M:%S') $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date -u '+%H:%M:%S') $1"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $(date -u '+%H:%M:%S') $1"; }

# Track previous revision for rollback
PREV_BACKEND_REVISION=""
PREV_FRONTEND_REVISION=""
DEPLOY_FAILED=0

# =============================================================================
# Pre-flight Checks
# =============================================================================
check_prerequisites() {
    log_step "Checking prerequisites..."

    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI not installed."
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        log_error "Docker not installed."
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        log_error "curl not installed."
        exit 1
    fi

    log_info "All prerequisites met."
}

authenticate_gcp() {
    log_step "Authenticating with GCP..."

    if [ -n "${GCP_SA_KEY:-}" ]; then
        echo "$GCP_SA_KEY" > /tmp/gcp-key-prod.json
        gcloud auth activate-service-account --key-file=/tmp/gcp-key-prod.json
        rm -f /tmp/gcp-key-prod.json
    else
        gcloud auth login --update-adc 2>/dev/null || true
    fi

    gcloud config set project "$PROJECT_ID"
    gcloud config set run/region "$REGION"
    log_info "Authenticated. Project: $PROJECT_ID"
}

check_secrets_exist() {
    log_step "Verifying all production secrets exist in Secret Manager..."

    local REQUIRED_SECRETS=(
        "salonos-prod-JWT_SECRET"
        "salonos-prod-REFRESH_TOKEN_SECRET"
        "salonos-prod-ENCRYPTION_KEY"
        "salonos-prod-DB_USER"
        "salonos-prod-DB_PASSWORD"
        "salonos-prod-DB_HOST"
        "salonos-prod-DB_PORT"
        "salonos-prod-DB_NAME"
        "salonos-prod-REDIS_HOST"
        "salonos-prod-REDIS_PORT"
        "salonos-prod-INSTANCE_CONNECTION_NAME"
        "salonos-prod-TWILIO_ACCOUNT_SID"
        "salonos-prod-TWILIO_AUTH_TOKEN"
        "salonos-prod-TWILIO_PHONE_NUMBER"
        "salonos-prod-SMTP_PASSWORD"
    )

    local missing=0
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if ! gcloud secrets describe "$secret" --project="$PROJECT_ID" &>/dev/null; then
            log_error "Missing secret: $secret"
            missing=$((missing + 1))
        else
            # Check it's not still a placeholder
            local payload
            payload="$(gcloud secrets versions access latest --secret="$secret" --project="$PROJECT_ID" 2>/dev/null || echo '')"
            if [[ "$payload" == "SET_ME_MANUALLY" ]]; then
                log_error "Secret $secret is still a placeholder!"
                missing=$((missing + 1))
            fi
        fi
    done

    if [[ $missing -gt 0 ]]; then
        log_error "$missing secret(s) missing or still placeholders. Aborting."
        exit 1
    fi

    log_info "All $(( ${#REQUIRED_SECRETS[@]} )) required secrets verified."
}

check_db_reachable() {
    log_step "Verifying Cloud SQL is reachable..."

    local db_host
    db_host="$(gcloud secrets versions access latest \
        --secret=salonos-prod-DB_HOST --project="$PROJECT_ID" 2>/dev/null)"

    if [[ -z "$db_host" ]]; then
        log_error "Could not retrieve DB_HOST from Secret Manager."
        exit 1
    fi

    # Check Cloud SQL instance state
    local db_state
    db_state="$(gcloud sql instances describe salonos-prod-db \
        --project="$PROJECT_ID" --format='value(state)' 2>/dev/null)"

    if [[ "$db_state" != "RUNNABLE" ]]; then
        log_error "Cloud SQL instance state: $db_state (expected RUNNABLE)"
        exit 1
    fi

    log_info "Cloud SQL is RUNNABLE. Host: $db_host"
}

check_staging_healthy() {
    log_step "Verifying staging environment is healthy..."

    local staging_url
    staging_url="$(gcloud run services describe salonos-backend-staging \
        --region="$REGION" --project="$PROJECT_ID" \
        --format='value(status.url)' 2>/dev/null || echo '')"

    if [[ -z "$staging_url" ]]; then
        log_warn "Staging backend not found. Skipping staging health check."
        return 0
    fi

    local http_code
    http_code="$(curl -s -o /dev/null -w '%{http_code}' \
        --max-time 15 "${staging_url}/health" 2>/dev/null || echo '000')"

    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        log_info "Staging is healthy (HTTP $http_code)."
    else
        log_warn "Staging returned HTTP $http_code. Proceeding with caution."
    fi
}

run_preflight() {
    log_info "========================================"
    log_info "  PRE-FLIGHT CHECKS"
    log_info "========================================"
    check_prerequisites
    authenticate_gcp
    check_secrets_exist
    check_db_reachable
    check_staging_healthy
    log_info "========================================"
    log_info "  ALL PRE-FLIGHT CHECKS PASSED"
    log_info "========================================"
    echo ""
}

# =============================================================================
# Blue-Green Deployment
# =============================================================================
capture_previous_revisions() {
    log_step "Capturing current revisions for rollback..."

    PREV_BACKEND_REVISION="$(gcloud run revisions list \
        --service="$BACKEND_SERVICE" --region="$REGION" \
        --project="$PROJECT_ID" --limit=1 \
        --format='value(metadata.name)' 2>/dev/null || echo '')"

    PREV_FRONTEND_REVISION="$(gcloud run revisions list \
        --service="$FRONTEND_SERVICE" --region="$REGION" \
        --project="$PROJECT_ID" --limit=1 \
        --format='value(metadata.name)' 2>/dev/null || echo '')"

    log_info "Previous backend revision: ${PREV_BACKEND_REVISION:-NONE}"
    log_info "Previous frontend revision: ${PREV_FRONTEND_REVISION:-NONE}"
}

build_and_push() {
    local service_name=$1
    local dockerfile_path=$2
    local git_sha
    git_sha="$(git rev-parse --short HEAD 2>/dev/null || echo 'manual')"
    local image_tag="${ARTIFACT_REPO}/${service_name}:${git_sha}"

    log_step "Building $service_name ($git_sha)..."
    docker build -t "$image_tag" -f "$dockerfile_path" ../../

    log_step "Pushing $service_name to Artifact Registry..."
    docker push "$image_tag"

    echo "$image_tag"
}

deploy_service_blue_green() {
    local service_name=$1
    local image_tag=$2
    local is_backend=$3

    log_step "Deploying $service_name (blue-green: 0% traffic initially)..."

    # Build secret args
    local secret_args=(
        "--set-secrets=JWT_SECRET=salonos-prod-JWT_SECRET:latest"
        "--set-secrets=REFRESH_TOKEN_SECRET=salonos-prod-REFRESH_TOKEN_SECRET:latest"
        "--set-secrets=ENCRYPTION_KEY=salonos-prod-ENCRYPTION_KEY:latest"
        "--set-secrets=DB_USER=salonos-prod-DB_USER:latest"
        "--set-secrets=DB_PASSWORD=salonos-prod-DB_PASSWORD:latest"
        "--set-secrets=DB_HOST=salonos-prod-DB_HOST:latest"
        "--set-secrets=DB_PORT=salonos-prod-DB_PORT:latest"
        "--set-secrets=DB_NAME=salonos-prod-DB_NAME:latest"
        "--set-secrets=REDIS_HOST=salonos-prod-REDIS_HOST:latest"
        "--set-secrets=REDIS_PORT=salonos-prod-REDIS_PORT:latest"
        "--set-secrets=INSTANCE_CONNECTION_NAME=salonos-prod-INSTANCE_CONNECTION_NAME:latest"
        "--set-secrets=TWILIO_ACCOUNT_SID=salonos-prod-TWILIO_ACCOUNT_SID:latest"
        "--set-secrets=TWILIO_AUTH_TOKEN=salonos-prod-TWILIO_AUTH_TOKEN:latest"
        "--set-secrets=TWILIO_PHONE_NUMBER=salonos-prod-TWILIO_PHONE_NUMBER:latest"
        "--set-secrets=OPENROUTER_API_KEY=salonos-prod-OPENROUTER_API_KEY:latest"
        "--set-secrets=SMTP_HOST=salonos-prod-SMTP_HOST:latest"
        "--set-secrets=SMTP_USER=salonos-prod-SMTP_USER:latest"
        "--set-secrets=SMTP_PASSWORD=salonos-prod-SMTP_PASSWORD:latest"
    )

    if [[ "$is_backend" == "true" ]]; then
        secret_args+=("--set-secrets=REDIS_URL=salonos-prod-REDIS_URL:latest")
    fi

    # Deploy with NO traffic initially (blue-green)
    gcloud run deploy "$service_name" \
        --image="$image_tag" \
        --platform managed \
        --region="$REGION" \
        --service-account="$SA_EMAIL" \
        --vpc-connector=salonos-prod-vpc \
        --vpc-egress=private-ranges-only \
        --no-traffic \
        "${secret_args[@]}" \
        --project="$PROJECT_ID" \
        || {
            log_error "Deployment of $service_name failed!"
            DEPLOY_FAILED=1
            return 1
        }

    # Get the new revision name
    local new_revision
    new_revision="$(gcloud run revisions list \
        --service="$service_name" --region="$REGION" \
        --project="$PROJECT_ID" --limit=1 \
        --format='value(metadata.name)')"

    log_info "New revision: $new_revision"

    # Health check the new revision directly
    log_step "Running health check on new revision (timeout: ${HEALTH_TIMEOUT}s)..."
    local healthy=0
    local elapsed=0
    local health_path="/health"

    if [[ "$is_backend" == "false" ]]; then
        health_path="/api/health"
    fi

    while [[ $elapsed -lt $HEALTH_TIMEOUT ]]; do
        local rev_url
        rev_url="$(gcloud run revisions describe "$new_revision" \
            --region="$REGION" --project="$PROJECT_ID" \
            --format='value(status.url)' 2>/dev/null || echo '')"

        if [[ -n "$rev_url" ]]; then
            local http_code
            http_code="$(curl -s -o /dev/null -w '%{http_code}' \
                --max-time 10 "${rev_url}${health_path}" 2>/dev/null || echo '000')"

            if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
                healthy=1
                log_info "Health check passed (HTTP $http_code) after ${elapsed}s"
                break
            fi
        fi

        sleep 5
        elapsed=$((elapsed + 5))
        log_info "Waiting for healthy response... (${elapsed}/${HEALTH_TIMEOUT}s)"
    done

    if [[ $healthy -ne 1 ]]; then
        log_error "Health check FAILED after ${HEALTH_TIMEOUT}s for $service_name"
        DEPLOY_FAILED=1
        return 1
    fi

    # Shift traffic to new revision (green → live)
    log_step "Shifting 100% traffic to $new_revision..."
    gcloud run services update-traffic "$service_name" \
        --region="$REGION" \
        --to-revisions="${new_revision}=100" \
        --project="$PROJECT_ID" \
        || {
            log_error "Traffic shift failed for $service_name!"
            DEPLOY_FAILED=1
            return 1
        }

    # Wait for traffic propagation
    log_info "Waiting ${TRAFFIC_SHIFT_WAIT}s for traffic propagation..."
    sleep "$TRAFFIC_SHIFT_WAIT"

    # Final verification via service URL
    local service_url
    service_url="$(gcloud run services describe "$service_name" \
        --region="$REGION" --project="$PROJECT_ID" \
        --format='value(status.url)')"

    local final_code
    final_code="$(curl -s -o /dev/null -w '%{http_code}' \
        --max-time 15 "${service_url}${health_path}" 2>/dev/null || echo '000')"

    if [[ "$final_code" -ge 200 && "$final_code" -lt 300 ]]; then
        log_info "Service $service_name is LIVE and healthy (HTTP $final_code)"
        log_info "URL: $service_url"
    else
        log_error "Post-traffic-shift health check failed (HTTP $final_code)"
        DEPLOY_FAILED=1
        return 1
    fi
}

rollback_service() {
    local service_name=$1
    local prev_revision=$2

    if [[ -z "$prev_revision" ]]; then
        log_error "No previous revision to rollback to for $service_name"
        return 1
    fi

    log_warn "ROLLING BACK $service_name to $prev_revision"
    gcloud run services update-traffic "$service_name" \
        --region="$REGION" \
        --to-revisions="${prev_revision}=100" \
        --project="$PROJECT_ID" \
        || log_error "Rollback failed for $service_name!"

    log_info "Rollback traffic shifted. Waiting for propagation..."
    sleep "$TRAFFIC_SHIFT_WAIT"
}

# =============================================================================
# Release Tag Generation
# =============================================================================
generate_release_tag() {
    local git_sha
    git_sha="$(git rev-parse --short HEAD 2>/dev/null || echo 'manual')"
    local timestamp
    timestamp="$(date -u '+%Y%m%d-%H%M%S')"
    local tag="prod-${timestamp}-${git_sha}"

    echo "$tag"
}

create_release_tag() {
    local tag=$1

    if git rev-parse --git-dir &>/dev/null; then
        git tag -a "$tag" -m "Production release: $tag" 2>/dev/null || true
        log_info "Git tag created: $tag"
    else
        log_warn "Not in a git repo. Skipping tag creation."
    fi
}

# =============================================================================
# Main Deployment
# =============================================================================
deploy_backend() {
    log_info "========================================"
    log_info "  DEPLOYING BACKEND"
    log_info "========================================"

    local image_tag
    image_tag="$(build_and_push "$BACKEND_SERVICE" "../../backend/Dockerfile")"

    deploy_service_blue_green "$BACKEND_SERVICE" "$image_tag" "true"
}

deploy_frontend() {
    log_info "========================================"
    log_info "  DEPLOYING FRONTEND"
    log_info "========================================"

    local image_tag
    image_tag="$(build_and_push "$FRONTEND_SERVICE" "../../frontend-next/Dockerfile")"

    deploy_service_blue_green "$FRONTEND_SERVICE" "$image_tag" "false"
}

deploy_all() {
    run_preflight
    capture_previous_revisions

    # Deploy backend first (frontend depends on it)
    deploy_backend
    if [[ $DEPLOY_FAILED -eq 1 ]]; then
        log_error "Backend deployment failed. Rolling back..."
        rollback_service "$BACKEND_SERVICE" "$PREV_BACKEND_REVISION"
        exit 1
    fi

    deploy_frontend
    if [[ $DEPLOY_FAILED -eq 1 ]]; then
        log_error "Frontend deployment failed. Rolling back frontend..."
        rollback_service "$FRONTEND_SERVICE" "$PREV_FRONTEND_REVISION"
        log_warn "Backend remains on new revision (it passed health checks)."
        exit 1
    fi

    # Generate release tag
    local release_tag
    release_tag="$(generate_release_tag)"
    create_release_tag "$release_tag"

    # Summary
    local backend_url
    backend_url="$(gcloud run services describe "$BACKEND_SERVICE" \
        --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
    local frontend_url
    frontend_url="$(gcloud run services describe "$FRONTEND_SERVICE" \
        --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"

    echo ""
    log_info "========================================"
    log_info "  PRODUCTION DEPLOYMENT SUCCESSFUL"
    log_info "========================================"
    log_info "Release tag: $release_tag"
    log_info "Backend:  $backend_url"
    log_info "Frontend: $frontend_url"
    log_info "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    log_info "========================================"
}

# =============================================================================
# CLI Interface
# =============================================================================
usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  (none)       Full deployment (preflight + backend + frontend)"
    echo "  --backend    Deploy backend only"
    echo "  --frontend   Deploy frontend only"
    echo "  --preflight  Run pre-flight checks only"
    echo "  --help       Show this help"
    echo ""
    echo "Environment variables:"
    echo "  GCP_SA_KEY    Service account key JSON (optional, uses ADC if unset)"
}

case "${1:-}" in
    --help|-h)
        usage
        exit 0
        ;;
    --preflight)
        run_preflight
        ;;
    --backend)
        run_preflight
        capture_previous_revisions
        deploy_backend
        if [[ $DEPLOY_FAILED -eq 1 ]]; then
            rollback_service "$BACKEND_SERVICE" "$PREV_BACKEND_REVISION"
            exit 1
        fi
        ;;
    --frontend)
        run_preflight
        capture_previous_revisions
        deploy_frontend
        if [[ $DEPLOY_FAILED -eq 1 ]]; then
            rollback_service "$FRONTEND_SERVICE" "$PREV_FRONTEND_REVISION"
            exit 1
        fi
        ;;
    "")
        deploy_all
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
