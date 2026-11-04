#!/usr/bin/env bash
# ==============================================================================
# Production Database Automated Backup Script
# MSME POS Platform — Disaster Recovery & Backup Routine
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${HOME}/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/pos_prod_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting production database backup: ${TIMESTAMP}"

# Dump and compress database from running Docker container
docker exec pos_postgres_prod pg_dump -U postgres pos_prod | gzip > "${BACKUP_FILE}"

# Verify file size
FILESIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")

if [ "${FILESIZE}" -gt 1000 ]; then
  echo "[SUCCESS] Backup successfully created: ${BACKUP_FILE} (${FILESIZE} bytes)"
else
  echo "[ERROR] Backup file appears empty or corrupted (${FILESIZE} bytes)" >&2
  exit 1
fi

# Clean up backups older than RETENTION_DAYS
echo "[INFO] Purging backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "pos_prod_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete

echo "[SUCCESS] Database backup and rotation completed successfully."
