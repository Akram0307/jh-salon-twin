#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

MSG="${1:-chore: sync successful GCP deployment}"
BRANCH="${2:-main}"

if [ ! -d .git ]; then
  echo "Not a git repository: $ROOT_DIR" >&2
  exit 1
fi

git add .
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "$MSG"
fi

git push origin "$BRANCH"
echo "GitHub sync complete."
