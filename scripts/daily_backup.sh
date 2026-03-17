#!/bin/bash
# SalonOS Daily Backup Script
# TASK-055: Daily Backup Automation
# Created: 2026-03-14

set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/salonos"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
LOG_FILE="/var/log/salonos_backup.log"

# Database configuration (from environment or defaults)
DB_HOST=${DB_HOST:-""}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"postgres"}
DB_USER=${DB_USER:-"salon_admin"}
DB_PASSWORD=${DB_PASSWORD:-""}

# Cloud Storage bucket (GCP)
GCS_BUCKET=${GCS_BUCKET:-"gs://salonos-backups"}

# Export password for pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log "=== Starting SalonOS Daily Backup ==="
log "Database: $DB_HOST:$DB_PORT/$DB_NAME"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/salonos_${DATE}.sql.gz"

# Perform database backup
log "Creating database backup..."
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log "ERROR: Backup failed!"
    exit 1
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE"; then
    log "Backup integrity verified"
else
    log "ERROR: Backup integrity check failed!"
    exit 1
fi

# Remove backups older than retention period
log "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "Deleted $DELETED_COUNT old backup(s)"

# Upload to Cloud Storage (if gsutil is available)
if command -v gsutil &> /dev/null; then
    log "Uploading backup to Cloud Storage..."
    if gsutil cp "$BACKUP_FILE" "$GCS_BUCKET/daily/"; then
        log "Upload successful: $GCS_BUCKET/daily/$(basename "$BACKUP_FILE")"
    else
        log "WARNING: Cloud Storage upload failed (backup saved locally)"
    fi
else
    log "INFO: gsutil not available, skipping cloud upload"
fi

# Create symlink to latest backup
ln -sf "$BACKUP_FILE" "$BACKUP_DIR/salonos_latest.sql.gz"

# Summary
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "=== Backup Complete ==="
log "Total backups: $TOTAL_BACKUPS"
log "Total size: $TOTAL_SIZE"
log "Latest backup: $BACKUP_FILE"

# Cleanup
unset PGPASSWORD

exit 0
