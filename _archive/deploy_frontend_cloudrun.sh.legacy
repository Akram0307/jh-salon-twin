#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
PROJECT_ID="salon-saas-487508"
REGION="us-central1"
SERVICE="salonos-owner-frontend"
TAG="${1:-owner-frontend-$(date -u +%Y%m%dT%H%M%SZ)}"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}:${TAG}"
cd "$ROOT_DIR"
echo "[frontend-deploy] image=${IMAGE}"
gcloud builds submit "$FRONTEND_DIR" --project "$PROJECT_ID" --config "$FRONTEND_DIR/cloudbuild.frontend.yaml" --substitutions="_IMAGE=${IMAGE}"
gcloud run deploy "$SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --image "$IMAGE" \
  --platform managed \
  --allow-unauthenticated
URL=$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')
REV=$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.latestReadyRevisionName)')
echo "[frontend-deploy] url=${URL}"
echo "[frontend-deploy] revision=${REV}"
