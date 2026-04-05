#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
export OWNER_URL="${OWNER_URL:-https://salonos-owner-frontend-687369167038.us-central1.run.app/owner}"
mkdir -p playwright_checks test-results
npx playwright test playwright_checks/tests/owner-dashboard.spec.mjs --reporter=line
