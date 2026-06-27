#!/bin/sh
set -e

echo "=== Velora PostgreSQL Database Backup Utility ==="

# Set variables
DB_HOST=${SQL_HOST:-"postgres"}
DB_PORT=5432
DB_USER=${SQL_ADMIN_USER:-"velora_admin"}
DB_NAME=${SQL_DB_NAME:-"velora_db"}
DB_PASSWORD=${SQL_ADMIN_PASSWORD:-"super_secure_admin_password_here"}

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/velora_backup_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "Initiating database backup for '${DB_NAME}' from host '${DB_HOST}'..."

# Verify if pg_dump is available locally or execute via docker-compose
if command -v pg_dump >/dev/null 2>&1; then
  echo "Using local pg_dump..."
  PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
  echo "pg_dump not found locally. Attempting backup via Docker container..."
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose exec -T postgres pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
  elif command -v docker >/dev/null 2>&1; then
    docker exec -t velora_postgres pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
  else
    echo "Error: Neither local pg_dump nor Docker command is available."
    exit 1
  fi
fi

if [ -f "${BACKUP_FILE}" ]; then
  FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "Success! Database backup archived at: ${BACKUP_FILE} (${FILE_SIZE})"
else
  echo "Error: Backup file creation failed."
  exit 1
fi

# Rotate backups: Prune backups older than 7 days
echo "Cleaning up backups older than 7 days..."
find "${BACKUP_DIR}" -name "velora_backup_*.sql.gz" -mtime +7 -delete || echo "No older backups found to prune."

echo "Backup cycle complete!"
