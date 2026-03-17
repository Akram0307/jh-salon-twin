#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SalonOS Staging - Secret Manager Seed & Validation Script
# ==============================================================================
# Manages GCP Secret Manager secrets for the staging environment.
# All secrets use the prefix 'salonos-staging-' matching deploy.yml references.
# Project: salon-saas-487508
# ==============================================================================

PROJECT_ID="salon-saas-487508"
PREFIX="salonos-staging"
DRY_RUN=false
VALIDATE=false
SEED=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ------------------------------------------------------------------------------
# Secret definitions: name|validation_type|validation_param|default_seed_value
# validation_type: min_length, non_empty, numeric, starts_with
# ------------------------------------------------------------------------------
SECRETS=(
  "JWT_SECRET_STAGING|min_length|32|"
  "REFRESH_TOKEN_SECRET_STAGING|min_length|32|"
  "DB_USER|non_empty||staging-user"
  "DB_PASSWORD|min_length|16|"
  "DB_HOST|non_empty||10.8.0.0"
  "DB_PORT|numeric||5432"
  "DB_NAME|non_empty||salonos_staging"
  "REDIS_HOST|non_empty||10.8.0.0"
  "REDIS_PORT|numeric||6379"
  "INSTANCE_CONNECTION_NAME|non_empty||salon-saas-487508:us-central1:salonos-staging-db"
  "STAGING_BASIC_AUTH_PASSWORD|min_length|16|"
  "TWILIO_ACCOUNT_SID|starts_with|AC|"
  "TWILIO_AUTH_TOKEN|min_length|32|"
  "TWILIO_WHATSAPP_NUMBER|starts_with|whatsapp:|whatsapp:+1234567890"
  "SMTP_HOST|non_empty||smtp.example.com"
  "SMTP_USER|non_empty||staging@salonos.app"
  "SMTP_PASS|min_length|16|"
  "OPENROUTER_API_KEY|starts_with|sk-|"
)

# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------
generate_secret() {
  openssl rand -base64 48 | tr -d '=' | tr -d '\n'
}

validate_secret() {
  local value="$1"
  local vtype="$2"
  local vparam="$3"

  case "$vtype" in
    min_length)
      [[ ${#value} -ge "$vparam" ]]
      ;;
    non_empty)
      [[ -n "$value" ]]
      ;;
    numeric)
      [[ "$value" =~ ^[0-9]+$ ]]
      ;;
    starts_with)
      [[ "$value" == "$vparam"* ]]
      ;;
    *)
      return 1
      ;;
  esac
}

get_secret_value() {
  local secret_name="$1"
  gcloud secrets versions access latest --secret="$secret_name" --project="$PROJECT_ID" 2>/dev/null || true
}

secret_exists() {
  local secret_name="$1"
  gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null
}

# ------------------------------------------------------------------------------
# Usage
# ------------------------------------------------------------------------------
usage() {
  cat <<EOF
${BOLD}Usage:${NC} $(basename "$0") [FLAG]

${BOLD}Flags:${NC}
  --dry-run    Validate configuration and show what would be done (no GCP calls)
  --validate   Check all required secrets exist and pass validation rules
  --seed       Create missing secrets with generated values

${BOLD}Project:${NC} $PROJECT_ID
${BOLD}Prefix:${NC}  $PREFIX-

${BOLD}Examples:${NC}
  $(basename "$0") --dry-run          # Preview without GCP calls
  $(basename "$0") --validate         # Check all secrets exist & are valid
  $(basename "$0") --seed             # Create missing secrets
EOF
  exit 0
}

# ------------------------------------------------------------------------------
# Parse args
# ------------------------------------------------------------------------------
if [[ $# -ne 1 ]]; then
  usage
fi

case "$1" in
  --dry-run)  DRY_RUN=true ;;
  --validate) VALIDATE=true ;;
  --seed)     SEED=true ;;
  -h|--help)  usage ;;
  *)
    echo -e "${RED}Error: Unknown flag '$1'${NC}"
    usage
    ;;
esac

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}  SalonOS Staging - Secret Manager${NC}"
echo -e "${BOLD}${CYAN}  Project: $PROJECT_ID${NC}"
echo -e "${BOLD}${CYAN}  Mode:   $(if $DRY_RUN; then echo 'DRY RUN'; elif $VALIDATE; then echo 'VALIDATE'; else echo 'SEED'; fi)${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if $DRY_RUN; then
  echo -e "${YELLOW}DRY RUN: No GCP API calls will be made.${NC}"
  echo -e "${YELLOW}Showing expected secret definitions and validation rules.${NC}"
  echo ""
fi

# Tracking arrays for summary
declare -a SUMMARY_NAMES
declare -a SUMMARY_STATUSES
declare -a SUMMARY_MESSAGES
FAIL_COUNT=0
PASS_COUNT=0
WARN_COUNT=0
TOTAL=${#SECRETS[@]}

for entry in "${SECRETS[@]}"; do
  IFS='|' read -r short_name vtype vparam default_val <<< "$entry"
  full_name="${PREFIX}-${short_name}"

  if $DRY_RUN; then
    # Dry run: just show the definition
    case "$vtype" in
      min_length)   rule_desc="min ${vparam} chars" ;;
      non_empty)    rule_desc="non-empty" ;;
      numeric)      rule_desc="numeric" ;;
      starts_with)  rule_desc="starts with '${vparam}'" ;;
    esac
    has_default="no"
    [[ -n "$default_val" ]] && has_default="yes (${default_val})"
    echo -e "  ${CYAN}${full_name}${NC}  →  ${rule_desc}  |  default: ${has_default}"
    SUMMARY_NAMES+=("$full_name")
    SUMMARY_STATUSES+=("DRY")
    SUMMARY_MESSAGES+=("$rule_desc")
    WARN_COUNT=$((WARN_COUNT + 1))
    continue
  fi

  # Check if secret exists
  if ! secret_exists "$full_name"; then
    if $SEED; then
      # Generate value
      if [[ -n "$default_val" ]]; then
        new_value="$default_val"
      else
        case "$vtype" in
          starts_with)
            new_value="${vparam}$(generate_secret)"
            ;;
          numeric)
            new_value="$vparam"
            ;;
          *)
            new_value="$(generate_secret)"
            ;;
        esac
      fi

      # Create secret
      echo -n "$new_value" | gcloud secrets create "$full_name" \
        --project="$PROJECT_ID" \
        --data-file=- \
        --replication-policy="automatic" 2>/dev/null

      if secret_exists "$full_name"; then
        echo -e "  ${GREEN}✓ CREATED${NC}  ${full_name}"
        SUMMARY_NAMES+=("$full_name")
        SUMMARY_STATUSES+=("CREATED")
        SUMMARY_MESSAGES+=("Seeded with generated value")
        PASS_COUNT=$((PASS_COUNT + 1))
      else
        echo -e "  ${RED}✗ FAILED${NC}   ${full_name} (gcloud create failed)"
        SUMMARY_NAMES+=("$full_name")
        SUMMARY_STATUSES+=("FAILED")
        SUMMARY_MESSAGES+=("gcloud secrets create failed")
        FAIL_COUNT=$((FAIL_COUNT + 1))
      fi
    else
      # Validate mode: missing secret
      echo -e "  ${RED}✗ MISSING${NC}  ${full_name}"
      SUMMARY_NAMES+=("$full_name")
      SUMMARY_STATUSES+=("MISSING")
      SUMMARY_MESSAGES+=("Secret does not exist")
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    continue
  fi

  # Secret exists — fetch and validate
  value=$(get_secret_value "$full_name")

  if [[ -z "$value" ]]; then
    echo -e "  ${RED}✗ EMPTY${NC}    ${full_name} (no versions)"
    SUMMARY_NAMES+=("$full_name")
    SUMMARY_STATUSES+=("EMPTY")
    SUMMARY_MESSAGES+=("Secret has no versions")
    FAIL_COUNT=$((FAIL_COUNT + 1))
    continue
  fi

  if validate_secret "$value" "$vtype" "$vparam"; then
    echo -e "  ${GREEN}✓ OK${NC}       ${full_name} (len=${#value})"
    SUMMARY_NAMES+=("$full_name")
    SUMMARY_STATUSES+=("OK")
    SUMMARY_MESSAGES+=("len=${#value}")
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    case "$vtype" in
      min_length)   fail_reason="length ${#value} < required $vparam" ;;
      non_empty)    fail_reason="empty value" ;;
      numeric)      fail_reason="'${value}' is not numeric" ;;
      starts_with)  fail_reason="does not start with '${vparam}'" ;;
    esac
    echo -e "  ${RED}✗ INVALID${NC}  ${full_name} (${fail_reason})"
    SUMMARY_NAMES+=("$full_name")
    SUMMARY_STATUSES+=("INVALID")
    SUMMARY_MESSAGES+=("$fail_reason")
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# ------------------------------------------------------------------------------
# Summary Table
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  SUMMARY${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
printf "  ${BOLD}%-55s %-10s %s${NC}\n" "SECRET" "STATUS" "DETAILS"
printf "  %-55s %-10s %s\n" "-------------------------------------------------------" "----------" "--------------------"

for i in "${!SUMMARY_NAMES[@]}"; do
  status="${SUMMARY_STATUSES[$i]}"
  case "$status" in
    OK|CREATED) color="$GREEN" ;;
    DRY)        color="$YELLOW" ;;
    *)          color="$RED" ;;
  esac
  printf "  ${color}%-55s %-10s %s${NC}\n" "${SUMMARY_NAMES[$i]}" "$status" "${SUMMARY_MESSAGES[$i]}"
done

echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  Total: ${BOLD}$TOTAL${NC}  |  ${GREEN}Pass: $PASS_COUNT${NC}  |  ${YELLOW}Warn: $WARN_COUNT${NC}  |  ${RED}Fail: $FAIL_COUNT${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [[ $FAIL_COUNT -gt 0 ]]; then
  echo -e "${RED}✗ $FAIL_COUNT secret(s) failed validation.${NC}"
  exit 1
else
  echo -e "${GREEN}✓ All secrets pass validation.${NC}"
  exit 0
fi
