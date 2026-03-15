#!/bin/bash
# SalonOS Backup Verification Script
# TASK-055: Weekly backup verification

set -euo pipefail

BACKUP_DIR="/var/backups/salonos"
LOG_FILE="/var/log/salonos_backup_verify.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Starting Weekly Backup Verification ==="

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log "ERROR: Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# Count total backups
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)
log "Total backups found: $TOTAL_BACKUPS"

if [ "$TOTAL_BACKUPS" -eq 0 ]; then
    log "WARNING: No backups found!"
    exit 1
fi

# Verify each backup's integrity
FAILED=0
for backup in $(find "$BACKUP_DIR" -name "*.sql.gz" -type f); do
    if gunzip -t "$backup" 2>/dev/null; then
        log "✓ Verified: $(basename "$backup")"
    else
        log "✗ FAILED: $(basename "$backup")"
        FAILED=$((FAILED + 1))
    fi
done

# Check latest backup
LATEST=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
    LATEST_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST")) / 86400 ))
    log "Latest backup: $(basename "$LATEST") (${LATEST_AGE} days old)"
    
    if [ "$LATEST_AGE" -gt 2 ]; then
        log "WARNING: Latest backup is more than 2 days old!"
    fi
fi

# Summary
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log "=== Verification Complete ==="
log "Total backups: $TOTAL_BACKUPS"
log "Total size: $TOTAL_SIZE"
log "Failed verifications: $FAILED"

if [ "$FAILED" -gt 0 ]; then
    log "ERROR: $FAILED backup(s) failed verification!"
    exit 1
fi

log "All backups verified successfully"
exit 0
