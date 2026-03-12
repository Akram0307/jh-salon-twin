#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend-next"
PROJECT_ID="salon-saas-487508"
REGION="us-central1"
SERVICE="salonos-owner-frontend"
TAG="${1:-next-$(date -u +%Y%m%dT%H%M%SZ)}"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}:${TAG}"
cd "$ROOT_DIR"
echo "[frontend-next-deploy] image=${IMAGE}"
API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-https://salonos-backend-rgvcleapsa-uc.a.run.app}"
gcloud builds submit "$FRONTEND_DIR" --project "$PROJECT_ID" --config "$FRONTEND_DIR/cloudbuild.yaml" --substitutions="_IMAGE=${IMAGE},_NEXT_PUBLIC_API_BASE_URL=${API_BASE_URL}"
gcloud run deploy "$SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --image "$IMAGE" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
URL=$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')
REV=$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.latestReadyRevisionName)')
echo "[frontend-next-deploy] url=${URL}"
echo "[frontend-next-deploy] revision=${REV}"
