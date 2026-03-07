#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
SMOKE_SCRIPT="$BACKEND_DIR/scripts/schedule_crud_smoke.js"
REPORT_PATH="$BACKEND_DIR/scripts/schedule_crud_smoke_report.json"
PROJECT_ID="${PROJECT_ID:-salon-saas-487508}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-salonos-backend}"
IMAGE="${IMAGE:-}"
DEPLOY="${DEPLOY:-0}"
EXTRA_DEPLOY_ARGS="${EXTRA_DEPLOY_ARGS:-}"

usage() {
  cat <<USAGE
Usage:
  ./gatekeeper.sh --image gcr.io/<project>/<service>:<tag> [--deploy]

Behavior:
  1. Runs the schedule CRUD smoke suite against the live backend.
  2. Aborts immediately if the smoke suite fails.
  3. If --deploy is provided, deploys the provided image to Cloud Run only after smoke passes.

Options:
  --image <image>   Required for deploy mode. Exact image reference to deploy.
  --deploy          Run gcloud deploy after smoke passes.
  -h, --help        Show this help.

Environment overrides:
  PROJECT_ID, REGION, SERVICE, IMAGE, EXTRA_DEPLOY_ARGS
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      IMAGE="$2"
      shift 2
      ;;
    --deploy)
      DEPLOY=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

echo "[gatekeeper] Root: $ROOT_DIR"
echo "[gatekeeper] Running source-of-truth smoke suite: $SMOKE_SCRIPT"
node "$SMOKE_SCRIPT"

echo "[gatekeeper] Smoke suite passed ✅"
echo "[gatekeeper] Report: $REPORT_PATH"

if [[ "$DEPLOY" != "1" ]]; then
  echo "[gatekeeper] Dry run only. No deploy requested."
  exit 0
fi

if [[ -z "$IMAGE" ]]; then
  echo "[gatekeeper] ERROR: --image is required in deploy mode." >&2
  exit 3
fi

echo "[gatekeeper] Deploy enabled."
echo "[gatekeeper] Project: $PROJECT_ID"
echo "[gatekeeper] Region:  $REGION"
echo "[gatekeeper] Service: $SERVICE"
echo "[gatekeeper] Image:   $IMAGE"

gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  ${EXTRA_DEPLOY_ARGS}

echo "[gatekeeper] Deploy completed successfully ✅"
