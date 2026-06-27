#!/bin/sh

echo "=== Velora Service Connectivity & Health Check ==="

# Set variables
DB_HOST=${SQL_HOST:-"postgres"}
DB_PORT=5432
REDIS_HOST="redis"
REDIS_PORT=6379

echo "Checking PostgreSQL at ${DB_HOST}:${DB_PORT}..."
PG_HEALTHY=0

# Use pg_isready if available
if command -v pg_isready >/dev/null 2>&1; then
  if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" >/dev/null 2>&1; then
    PG_HEALTHY=1
  fi
else
  # Fallback to netcat
  if nc -z "${DB_HOST}" "${DB_PORT}" >/dev/null 2>&1; then
    PG_HEALTHY=1
  fi
fi

if [ $PG_HEALTHY -eq 1 ]; then
  echo "  [OK] PostgreSQL database connection verified."
else
  echo "  [FAIL] PostgreSQL database is not reachable."
fi

echo "Checking Redis at ${REDIS_HOST}:${REDIS_PORT}..."
REDIS_HEALTHY=0

if command -v redis-cli >/dev/null 2>&1; then
  if redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" ping | grep -q "PONG"; then
    REDIS_HEALTHY=1
  fi
else
  # Fallback to netcat
  if nc -z "${REDIS_HOST}" "${REDIS_PORT}" >/dev/null 2>&1; then
    REDIS_HEALTHY=1
  fi
fi

if [ $REDIS_HEALTHY -eq 1 ]; then
  echo "  [OK] Redis cache connection verified."
else
  echo "  [FAIL] Redis cache is not reachable."
fi

if [ $PG_HEALTHY -eq 1 ] && [ $REDIS_HEALTHY -eq 1 ]; then
  echo "=== OVERALL SYSTEM CONNECTIVITY: HEALTHY ==="
  exit 0
else
  echo "=== OVERALL SYSTEM CONNECTIVITY: DEGRADED ==="
  exit 1
fi
