#!/usr/bin/env bash
# =============================================================================
# SalonOS Production Rollback Script
# Lists last 5 revisions, rolls back to specified revision, verifies health.
# GCP Project: salon-saas-487508 | Region: us-central1
# =============================================================================
set -euo pipefail

PROJECT_ID="salon-saas-487508"
REGION="us-central1"
BACKEND_SERVICE="salonos-backend-prod"
FRONTEND_SERVICE="salonos-owner-frontend-prod"
HEALTH_TIMEOUT=90
TRAFFIC_WAIT=30

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

# =============================================================================
# Authenticate
# =============================================================================
authenticate() {
    if [ -n "${GCP_SA_KEY:-}" ]; then
        echo "$GCP_SA_KEY" > /tmp/gcp-key-rollback.json
        gcloud auth activate-service-account --key-file=/tmp/gcp-key-rollback.json
        rm -f /tmp/gcp-key-rollback.json
    else
        gcloud auth login --update-adc 2>/dev/null || true
    fi
    gcloud config set project "$PROJECT_ID"
    gcloud config set run/region "$REGION"
}

# =============================================================================
# List Revisions
# =============================================================================
list_revisions() {
    local service_name=$1
    local label=$2

    echo ""
    echo -e "${BLUE}=== $label — Last 5 Revisions ===${NC}"
    echo ""

    gcloud run revisions list \
        --service="$service_name" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --limit=5 \
        --format="table(
            metadata.name,
            status.traffic,
            metadata.creationTimestamp,
            status.imageDigest
        )"

    # Show which revision currently has traffic
    local active_revision
    active_revision="$(gcloud run services describe "$service_name" \
        --region="$REGION" --project="$PROJECT_ID" \
        --format='value(status.traffic[0].revisionName)' 2>/dev/null || echo '')"

    if [[ -n "$active_revision" ]]; then
        echo -e "${GREEN}Active (receiving traffic): $active_revision${NC}"
    fi
    echo ""
}

# =============================================================================
# Rollback
# =============================================================================
rollback_service() {
    local service_name=$1
    local revision_name=$2
    local health_path=$3

    log_step "Rolling back $service_name to $revision_name"

    # Verify revision exists
    if ! gcloud run revisions describe "$revision_name" \
        --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
        log_error "Revision '$revision_name' does not exist for $service_name"
        return 1
    fi

    # Shift traffic
    gcloud run services update-traffic "$service_name" \
        --region="$REGION" \
        --to-revisions="${revision_name}=100" \
        --project="$PROJECT_ID"

    log_info "Traffic shifted to $revision_name. Waiting ${TRAFFIC_WAIT}s for propagation..."
    sleep "$TRAFFIC_WAIT"

    # Health verification
    log_step "Verifying health after rollback (timeout: ${HEALTH_TIMEOUT}s)..."
    local healthy=0
    local elapsed=0

    while [[ $elapsed -lt $HEALTH_TIMEOUT ]]; do
        local service_url
        service_url="$(gcloud run services describe "$service_name" \
            --region="$REGION" --project="$PROJECT_ID" \
            --format='value(status.url)')"

        local http_code
        http_code="$(curl -s -o /dev/null -w '%{http_code}' \
            --max-time 10 "${service_url}${health_path}" 2>/dev/null || echo '000')"

        if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
            healthy=1
            log_info "Health check PASSED (HTTP $http_code) after ${elapsed}s"
            break
        fi

        sleep 5
        elapsed=$((elapsed + 5))
        log_info "Waiting for healthy response... (${elapsed}/${HEALTH_TIMEOUT}s)"
    done

    if [[ $healthy -ne 1 ]]; then
        log_error "Health check FAILED after ${HEALTH_TIMEOUT}s!"
        log_error "Manual intervention required. Check Cloud Console immediately."
        return 1
    fi

    log_info "Rollback of $service_name verified successfully."
}

# =============================================================================
# Interactive Menu
# =============================================================================
interactive_rollback() {
    authenticate

    # Show current state
    list_revisions "$BACKEND_SERVICE" "BACKEND"
    list_revisions "$FRONTEND_SERVICE" "FRONTEND"

    echo -e "${YELLOW}Which service to rollback?${NC}"
    echo "  1) Backend ($BACKEND_SERVICE)"
    echo "  2) Frontend ($FRONTEND_SERVICE)"
    echo "  3) Both"
    echo "  0) Cancel"
    echo -n "Choice [0-3]: "
    read -r choice

    case "$choice" in
        1)
            echo -n "Enter backend revision name: "
            read -r rev
            rollback_service "$BACKEND_SERVICE" "$rev" "/health"
            ;;
        2)
            echo -n "Enter frontend revision name: "
            read -r rev
            rollback_service "$FRONTEND_SERVICE" "$rev" "/api/health"
            ;;
        3)
            echo -n "Enter backend revision name: "
            read -r backend_rev
            echo -n "Enter frontend revision name: "
            read -r frontend_rev
            rollback_service "$BACKEND_SERVICE" "$backend_rev" "/health"
            rollback_service "$FRONTEND_SERVICE" "$frontend_rev" "/api/health"
            ;;
        *)
            log_info "Cancelled."
            exit 0
            ;;
    esac

    echo ""
    log_info "========================================"
    log_info "  ROLLBACK COMPLETE"
    log_info "========================================"
}

# =============================================================================
# CLI Interface
# =============================================================================
usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  (none)           Interactive rollback menu"
    echo "  --list           List last 5 revisions for both services"
    echo "  --backend REV    Rollback backend to specific revision"
    echo "  --frontend REV   Rollback frontend to specific revision"
    echo "  --help           Show this help"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 --list"
    echo "  $0 --backend salonos-backend-prod-00001-xyz"
    echo "  $0 --frontend salonos-owner-frontend-prod-00005-abc"
}

case "${1:-}" in
    --help|-h)
        usage
        exit 0
        ;;
    --list)
        authenticate
        list_revisions "$BACKEND_SERVICE" "BACKEND"
        list_revisions "$FRONTEND_SERVICE" "FRONTEND"
        ;;
    --backend)
        if [[ -z "${2:-}" ]]; then
            log_error "Missing revision name. Usage: $0 --backend REVISION_NAME"
            exit 1
        fi
        authenticate
        rollback_service "$BACKEND_SERVICE" "$2" "/health"
        ;;
    --frontend)
        if [[ -z "${2:-}" ]]; then
            log_error "Missing revision name. Usage: $0 --frontend REVISION_NAME"
            exit 1
        fi
        authenticate
        rollback_service "$FRONTEND_SERVICE" "$2" "/api/health"
        ;;
    "")
        interactive_rollback
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
