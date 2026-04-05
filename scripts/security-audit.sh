#!/bin/bash
# SalonOS Security Audit Script
# Created by Security Architect for Sprint 4 Dogfooding Phase
# Purpose: Comprehensive security scanning for production readiness

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend-next"
REPORT_DIR="${PROJECT_ROOT}/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${REPORT_DIR}/security-audit-${TIMESTAMP}.json"

# Create report directory
mkdir -p "${REPORT_DIR}"

# Initialize report
echo '{"timestamp": "'$(date -Iseconds)'", "project": "SalonOS", "findings": []}' > "${REPORT_FILE}"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

add_finding() {
    local severity="$1"
    local category="$2"
    local message="$3"
    local file="${4:-null}"
    
    local finding=$(cat <<FIN
{"severity": "${severity}", "category": "${category}", "message": "${message}", "file": ${file}}
FIN
)
    
    # Update report using jq if available, otherwise append
    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq ".findings += [${finding}]" "${REPORT_FILE}" > "${temp_file}" && mv "${temp_file}" "${REPORT_FILE}"
    fi
}

# ============================================
# SECTION 1: DEPENDENCY VULNERABILITY SCANNING
# ============================================

log_info "=== Dependency Vulnerability Scanning ==="

# Backend npm audit
if [ -d "${BACKEND_DIR}" ]; then
    log_info "Scanning backend dependencies..."
    cd "${BACKEND_DIR}"
    
    if [ -f "package-lock.json" ]; then
        # Run npm audit
        if npm audit --json 2>/dev/null | jq -e '.vulnerabilities | length > 0' &>/dev/null; then
            vuln_count=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities | to_entries | map(.value) | add // 0')
            log_warning "Backend has ${vuln_count} known vulnerabilities"
            add_finding "medium" "dependencies" "Backend has ${vuln_count} known vulnerabilities" '"backend/package-lock.json"'
        else
            log_success "Backend dependencies: No known vulnerabilities"
        fi
    else
        log_warning "Backend: package-lock.json not found"
    fi
fi

# Frontend npm audit
if [ -d "${FRONTEND_DIR}" ]; then
    log_info "Scanning frontend dependencies..."
    cd "${FRONTEND_DIR}"
    
    if [ -f "package-lock.json" ]; then
        if npm audit --json 2>/dev/null | jq -e '.vulnerabilities | length > 0' &>/dev/null; then
            vuln_count=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities | to_entries | map(.value) | add // 0')
            log_warning "Frontend has ${vuln_count} known vulnerabilities"
            add_finding "medium" "dependencies" "Frontend has ${vuln_count} known vulnerabilities" '"frontend-next/package-lock.json"'
        else
            log_success "Frontend dependencies: No known vulnerabilities"
        fi
    else
        log_warning "Frontend: package-lock.json not found"
    fi
fi

# ============================================
# SECTION 2: CODE PATTERN ANALYSIS
# ============================================

log_info "=== Code Pattern Analysis ==="

cd "${PROJECT_ROOT}"

# Check for hardcoded secrets
log_info "Checking for hardcoded secrets..."
secret_patterns=(
    'password\s*=\s*["\x27][^"\x27]{3,}'
    'api[_-]?key\s*=\s*["\x27][^"\x27]{10,}'
    'secret\s*=\s*["\x27][^"\x27]{10,}'
    'token\s*=\s*["\x27][^"\x27]{20,}'
    'AKIA[0-9A-Z]{16}'  # AWS Access Key
    'sk_live_[0-9a-zA-Z]{24,}'  # Stripe live key
)

for pattern in "${secret_patterns[@]}"; do
    if grep -r -E -l "${pattern}" backend/src frontend-next/src 2>/dev/null | grep -v node_modules | grep -v '.env.example' | head -5; then
        log_error "Potential hardcoded secret detected matching pattern: ${pattern}"
        add_finding "critical" "secrets" "Potential hardcoded secret detected" '"'"$(grep -r -E -l "${pattern}" backend/src frontend-next/src 2>/dev/null | grep -v node_modules | head -1)"'"'
    fi
done

# Check for SQL injection vulnerabilities
log_info "Checking for SQL injection patterns..."
if grep -r -E 'query\s*\(.*\$\{.*\}' backend/src 2>/dev/null | grep -v node_modules | head -5; then
    log_error "Potential SQL injection: String interpolation in queries"
    add_finding "critical" "injection" "Potential SQL injection via string interpolation" '"backend/src"'
else
    log_success "No obvious SQL injection patterns found"
fi

# Check for XSS vulnerabilities
log_info "Checking for XSS patterns..."
if grep -r -E 'dangerouslySetInnerHTML|innerHTML\s*=' frontend-next/src 2>/dev/null | grep -v node_modules | head -5; then
    log_warning "Potential XSS: dangerouslySetInnerHTML or innerHTML usage found"
    add_finding "medium" "xss" "Potential XSS via dangerouslySetInnerHTML or innerHTML" '"frontend-next/src"'
else
    log_success "No obvious XSS patterns found"
fi

# Check for eval() usage
log_info "Checking for eval() usage..."
if grep -r -E 'eval\s*\(' backend/src frontend-next/src 2>/dev/null | grep -v node_modules | head -5; then
    log_error "eval() usage detected - potential code injection risk"
    add_finding "high" "injection" "eval() usage detected" '"src"'
else
    log_success "No eval() usage found"
fi

# ============================================
# SECTION 3: CONFIGURATION VALIDATION
# ============================================

log_info "=== Configuration Validation ==="

# Check for .env files in repo
log_info "Checking for exposed .env files..."
if find . -name '.env' -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null | grep -v '.env.example' | grep -v '.env.local.example'; then
    log_warning ".env files found in repository - ensure they are in .gitignore"
    add_finding "medium" "configuration" ".env files present in repository" '".env"'
fi

# Check .gitignore for security
log_info "Checking .gitignore for security entries..."
if [ -f ".gitignore" ]; then
    security_entries=(".env" "credentials" "*.key" "*.pem" "node_modules")
    for entry in "${security_entries[@]}"; do
        if grep -q "${entry}" .gitignore; then
            log_success ".gitignore contains: ${entry}"
        else
            log_warning ".gitignore missing: ${entry}"
            add_finding "low" "configuration" ".gitignore missing entry: ${entry}" '".gitignore"'
        fi
    done
fi

# Check for debug mode in production configs
log_info "Checking for debug mode settings..."
if grep -r -E 'DEBUG\s*=\s*true|debug:\s*true' backend/src 2>/dev/null | grep -v node_modules | head -3; then
    log_warning "Debug mode may be enabled in source code"
    add_finding "low" "configuration" "Debug mode settings found in source" '"backend/src"'
fi

# Check CORS configuration
log_info "Checking CORS configuration..."
if grep -r -E "origin.*\*|Access-Control-Allow-Origin.*\*" backend/src 2>/dev/null | grep -v node_modules | head -3; then
    log_warning "Wildcard CORS origin detected - may be too permissive"
    add_finding "medium" "configuration" "Wildcard CORS origin detected" '"backend/src"'
else
    log_success "No wildcard CORS origins found"
fi

# Check for rate limiting
log_info "Checking for rate limiting..."
if grep -r -E 'rateLimit|rate-limit|express-rate-limit' backend/src 2>/dev/null | grep -v node_modules | head -1 > /dev/null; then
    log_success "Rate limiting detected in backend"
else
    log_warning "No rate limiting found - consider adding for API protection"
    add_finding "medium" "configuration" "No rate limiting detected" '"backend/src"'
fi

# ============================================
# SECTION 4: DATABASE SECURITY
# ============================================

log_info "=== Database Security Checks ==="

# Check for parameterized queries
log_info "Checking for parameterized queries..."
if grep -r -E '\$1,\s*\$2|\$\{.*\}|\+\s*req\.' backend/src 2>/dev/null | grep -E 'query|sql' | grep -v node_modules | head -3; then
    log_warning "Potential string concatenation in SQL queries"
    add_finding "high" "database" "Potential unsafe SQL query construction" '"backend/src"'
else
    log_success "SQL queries appear to use parameterization"
fi

# Check for encryption at rest indicators
log_info "Checking for encryption configurations..."
if grep -r -E 'encrypt|ssl|tls' backend/src 2>/dev/null | grep -v node_modules | head -1 > /dev/null; then
    log_success "Encryption/SSL/TLS configurations found"
else
    log_warning "No explicit encryption configurations found"
    add_finding "low" "database" "No explicit encryption configuration found" '"backend/src"'
fi

# ============================================
# SECTION 5: AUTHENTICATION & AUTHORIZATION
# ============================================

log_info "=== Authentication & Authorization Checks ==="

# Check for JWT implementation
log_info "Checking JWT implementation..."
if grep -r -E 'jwt\.sign|jwt\.verify|jsonwebtoken' backend/src 2>/dev/null | grep -v node_modules | head -1 > /dev/null; then
    log_success "JWT authentication detected"
    
    # Check for weak JWT secrets
    if grep -r -E 'jwt.*secret.*=.*["\x27](test|secret|password|1234)["\x27]' backend/src 2>/dev/null | grep -v node_modules; then
        log_error "Weak JWT secret detected"
        add_finding "critical" "authentication" "Weak JWT secret in use" '"backend/src"'
    fi
else
    log_warning "No JWT implementation found"
fi

# Check for password hashing
log_info "Checking password hashing..."
if grep -r -E 'bcrypt|argon2|scrypt' backend/src 2>/dev/null | grep -v node_modules | head -1 > /dev/null; then
    log_success "Strong password hashing detected (bcrypt/argon2/scrypt)"
else
    log_warning "No strong password hashing found - ensure passwords are properly hashed"
    add_finding "high" "authentication" "No strong password hashing detected" '"backend/src"'
fi

# Check for session management
log_info "Checking session management..."
if grep -r -E 'session|cookie' backend/src 2>/dev/null | grep -v node_modules | head -1 > /dev/null; then
    log_success "Session management detected"
    
    # Check for secure cookie flags
    if grep -r -E 'secure:\s*true|httpOnly:\s*true|sameSite' backend/src 2>/dev/null | grep -v node_modules | head -1 > /dev/null; then
        log_success "Secure cookie flags detected"
    else
        log_warning "Secure cookie flags not found"
        add_finding "medium" "authentication" "Secure cookie flags not configured" '"backend/src"'
    fi
fi

# ============================================
# SECTION 6: WEBHOOK SECURITY (Twilio)
# ============================================

log_info "=== Webhook Security Checks ==="

# Check for webhook signature validation
log_info "Checking webhook signature validation..."
if grep -r -E 'validateRequest|validateSignature|x-twilio-signature' backend/src 2>/dev/null | grep -v node_modules | head -1 > /dev/null; then
    log_success "Webhook signature validation detected"
else
    log_warning "No webhook signature validation found"
    add_finding "high" "webhooks" "Webhook signature validation not implemented" '"backend/src"'
fi

# ============================================
# SUMMARY
# ============================================

log_info "=== Security Audit Complete ==="
log_info "Report saved to: ${REPORT_FILE}"

# Count findings by severity
if command -v jq &> /dev/null; then
    critical=$(jq '.findings | map(select(.severity == "critical")) | length' "${REPORT_FILE}")
    high=$(jq '.findings | map(select(.severity == "high")) | length' "${REPORT_FILE}")
    medium=$(jq '.findings | map(select(.severity == "medium")) | length' "${REPORT_FILE}")
    low=$(jq '.findings | map(select(.severity == "low")) | length' "${REPORT_FILE}")
    
    echo ""
    echo "=== Summary ==="
    echo -e "${RED}Critical: ${critical}${NC}"
    echo -e "${YELLOW}High: ${high}${NC}"
    echo -e "${BLUE}Medium: ${medium}${NC}"
    echo -e "${GREEN}Low: ${low}${NC}"
    echo ""
    
    if [ "${critical}" -gt 0 ] || [ "${high}" -gt 0 ]; then
        log_error "Security audit found critical or high severity issues - review required"
        exit 1
    else
        log_success "Security audit passed - no critical or high severity issues found"
        exit 0
    fi
fi
