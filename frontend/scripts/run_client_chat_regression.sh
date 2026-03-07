#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npx playwright test playwright_checks/tests/client-chat.spec.ts --reporter=line
