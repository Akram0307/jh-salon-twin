#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Example wrapper only.
# Replace the placeholder deploy commands below with the exact backend/frontend Cloud Run deploy commands used in production.

# ./scripts/deploy_backend_to_gcp.sh
# ./scripts/deploy_frontend_to_gcp.sh

# Only run release sync if deployment commands completed successfully.
./scripts/release_after_gcp_success.sh production owner-backend-frontend "successful GCP deployment"
