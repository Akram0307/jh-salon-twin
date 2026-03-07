#!/usr/bin/env bash
set -euo pipefail
BACKEND_URL="${BACKEND_URL:-https://salonos-backend-687369167038.us-central1.run.app}"
ENDPOINT="${ENDPOINT:-/api/chat/message}"
PAYLOAD='{"message":"I want to book a haircut tomorrow","sender":"regression-smoke","sessionId":"regression-smoke"}'
TMP_BODY="$(mktemp)"
HTTP_CODE="$({ curl -sS -o "$TMP_BODY" -w '%{http_code}' -X POST "${BACKEND_URL}${ENDPOINT}" -H 'Content-Type: application/json' --data "$PAYLOAD"; } || true)"
BODY="$(cat "$TMP_BODY")"
rm -f "$TMP_BODY"
echo "URL: ${BACKEND_URL}${ENDPOINT}"
echo "HTTP: ${HTTP_CODE}"
echo "BODY: ${BODY}"
[[ "$HTTP_CODE" == "200" ]] || { echo 'FAIL: expected HTTP 200' >&2; exit 1; }
printf '%s' "$BODY" | grep -q '"success"' || { echo 'FAIL: missing success field' >&2; exit 1; }
printf '%s' "$BODY" | grep -q '"message"' || { echo 'FAIL: missing message field' >&2; exit 1; }
echo 'PASS: chat contract smoke check passed'
