#!/bin/sh
set -e

echo "=== Velora Database Migration Runner ==="

# Fallback values for environment variables
DB_HOST=${SQL_HOST:-"postgres"}
DB_PORT=5432
DB_USER=${SQL_ADMIN_USER:-"velora_admin"}
DB_NAME=${SQL_DB_NAME:-"velora_db"}

echo "Waiting for PostgreSQL to be ready at ${DB_HOST}:${DB_PORT}..."

# Wait loop using standard netcat/pg_isready if available
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
  if nc -z "$DB_HOST" "$DB_PORT" >/dev/null 2>&1; then
    echo "PostgreSQL is reachable!"
    break
  fi
  echo "Attempt $attempt/$max_attempts: Database not reachable. Retrying in 2 seconds..."
  sleep 2
  attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
  echo "Error: Database connection timeout. Could not reach PostgreSQL at ${DB_HOST}:${DB_PORT}."
  exit 1
fi

echo "Running Drizzle Kit schema push / migration..."
# We generate any missing migrations first
npx drizzle-kit generate

# Run push to synchronize database schema directly
npx drizzle-kit push

echo "Database migration completed successfully!"
