#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
SCHEDULE_SMOKE_SCRIPT="$BACKEND_DIR/scripts/schedule_crud_smoke.js"
SCHEDULE_REPORT_PATH="$BACKEND_DIR/scripts/schedule_crud_smoke_report.json"
CHAT_SMOKE_SCRIPT="$BACKEND_DIR/scripts/chat_contract_smoke.sh"
CHAT_REPORT_PATH="$BACKEND_DIR/scripts/chat_heartbeat_report.json"
FRONTEND_BRANDING_SCRIPT="$FRONTEND_DIR/scripts/verify_dist_branding.sh"
OWNER_DASHBOARD_SCRIPT="$FRONTEND_DIR/scripts/run_owner_dashboard_regression.sh"

DEPLOY=false
IMAGE=""
SERVICE="${SERVICE:-salonos-backend}"
REGION="${REGION:-us-central1}"
PROJECT_ID="${PROJECT_ID:-salon-saas-487508}"

usage() {
  cat <<USAGE
Usage:
  ./gatekeeper.sh [--image <image>] [--deploy]

What it does:
  1. Verifies the frontend build artifact is present and free of default Vite branding.
  2. Runs the chat contract smoke suite against the live backend.
  3. Runs the owner dashboard Playwright regression against the live frontend.
  4. Runs the schedule CRUD smoke suite against the live backend.
  5. Aborts immediately if any verification or smoke suite fails.
  6. If --deploy is provided, deploys the provided image to Cloud Run only after all checks pass.

Options:
  --image <image>   Required for deploy mode. Exact image reference to deploy.
  --deploy          If present, performs the Cloud Run deployment after checks pass.
  -h, --help        Show this help.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      IMAGE="${2:-}"
      shift 2
      ;;
    --deploy)
      DEPLOY=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[gatekeeper] Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$DEPLOY" == true && -z "$IMAGE" ]]; then
  echo "[gatekeeper] ERROR: --image is required in deploy mode." >&2
  exit 1
fi

echo "[gatekeeper] Root: $ROOT_DIR"
echo "[gatekeeper] Running frontend branding gate: $FRONTEND_BRANDING_SCRIPT"
bash "$FRONTEND_BRANDING_SCRIPT"
echo "[gatekeeper] Frontend branding gate passed ✅"

echo "[gatekeeper] Running chat contract smoke suite: $CHAT_SMOKE_SCRIPT"
bash "$CHAT_SMOKE_SCRIPT"
echo "[gatekeeper] Chat contract smoke passed ✅"
echo "[gatekeeper] Chat report: $CHAT_REPORT_PATH"

echo "[gatekeeper] Running owner dashboard regression: $OWNER_DASHBOARD_SCRIPT"
bash "$OWNER_DASHBOARD_SCRIPT"
echo "[gatekeeper] Owner dashboard regression passed ✅"

echo "[gatekeeper] Running schedule CRUD smoke suite: $SCHEDULE_SMOKE_SCRIPT"
node "$SCHEDULE_SMOKE_SCRIPT"
echo "[gatekeeper] Schedule CRUD smoke passed ✅"
echo "[gatekeeper] Schedule report: $SCHEDULE_REPORT_PATH"

if [[ "$DEPLOY" != true ]]; then
  echo "[gatekeeper] Validation-only mode complete. No deployment executed."
  exit 0
fi

echo "[gatekeeper] Deploying image to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --platform managed \
  --allow-unauthenticated

echo "[gatekeeper] Deployment complete ✅"
