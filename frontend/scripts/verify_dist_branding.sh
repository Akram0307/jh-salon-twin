#!/bin/sh
set -eu
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DIST_INDEX="$ROOT_DIR/dist/index.html"
if [ ! -f "$DIST_INDEX" ]; then
  echo "[verify-dist-branding] ERROR: missing $DIST_INDEX" >&2
  exit 1
fi
if grep -Eq 'Vite \+ React \+ TS|vite\.svg' "$DIST_INDEX"; then
  echo "[verify-dist-branding] ERROR: default Vite branding detected in $DIST_INDEX" >&2
  grep -En 'Vite \+ React \+ TS|vite\.svg' "$DIST_INDEX" >&2 || true
  exit 1
fi
echo "[verify-dist-branding] PASS: no default Vite branding found in $DIST_INDEX"
