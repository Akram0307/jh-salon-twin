#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ENVIRONMENT="${1:-production}"
SERVICE_SCOPE="${2:-owner-backend-frontend}"
SUMMARY="${3:-successful GCP deployment}"
BRANCH="${4:-main}"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
TAG="release/${ENVIRONMENT}/$(date -u +%Y.%m.%d-%H%M%S)"
COMMIT_MSG="release(${ENVIRONMENT}): ${SUMMARY} [${STAMP}]"

./scripts/git_sync_after_gcp_success.sh "$COMMIT_MSG" "$BRANCH"

LAST_COMMIT="$(git rev-parse --short HEAD)"
ANNOTATION=$(cat <<TXT
SalonOS deployment release

Environment: ${ENVIRONMENT}
Scope: ${SERVICE_SCOPE}
Summary: ${SUMMARY}
Timestamp: ${STAMP}
Commit: ${LAST_COMMIT}
TXT
)

git tag -a "$TAG" -m "$ANNOTATION"
git push origin "$TAG"

echo "Created and pushed release tag: $TAG"
