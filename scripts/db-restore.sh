#!/bin/sh
set -e

echo "=== Velora PostgreSQL Database Restore Utility ==="

# Set variables
DB_HOST=${SQL_HOST:-"postgres"}
DB_PORT=5432
DB_USER=${SQL_ADMIN_USER:-"velora_admin"}
DB_NAME=${SQL_DB_NAME:-"velora_db"}
DB_PASSWORD=${SQL_ADMIN_PASSWORD:-"super_secure_admin_password_here"}

BACKUP_FILE=$1

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  echo "Example: $0 ./backups/velora_backup_20260627_120000.sql.gz"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' does not exist."
  exit 1
fi

echo "WARNING: This operation will overwrite existing data in database '${DB_NAME}'!"
echo "Are you sure you want to proceed? (y/N)"
read -r response
if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Restoring database from ${BACKUP_FILE}..."

# Determine restoration channel
if command -v psql >/dev/null 2>&1; then
  echo "Using local gunzip and psql tools..."
  gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"
else
  echo "psql not found locally. Attempting restoration via Docker container..."
  if command -v docker-compose >/dev/null 2>&1; then
    gunzip -c "${BACKUP_FILE}" | docker-compose exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}"
  elif command -v docker >/dev/null 2>&1; then
    gunzip -c "${BACKUP_FILE}" | docker exec -i velora_postgres psql -U "${DB_USER}" -d "${DB_NAME}"
  else
    echo "Error: Neither local psql nor Docker command is available."
    exit 1
  fi
fi

echo "Database successfully restored from ${BACKUP_FILE}!"
