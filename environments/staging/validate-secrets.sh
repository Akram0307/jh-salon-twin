#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SalonOS Staging - CI Secret Validation Wrapper
# ==============================================================================
# Thin wrapper for use in CI pipelines.
# Runs seed-secrets.sh --validate and forwards the exit code.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec "${SCRIPT_DIR}/seed-secrets.sh" --validate
