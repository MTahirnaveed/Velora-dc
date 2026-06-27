# Velora Database Restoration & Recovery Guide

This document describes how to recover and restore the Velora PostgreSQL database from compressed backup archives.

---

## 🛑 CRITICAL SAFETY WARNINGS
* **Restoration Overwrites Current Data**: Executing a restore completely overwrites the targeted database tables. Any data logged between the backup date and the current time will be permanently lost.
* **Stop Server Connections first**: To prevent deadlocks or half-written rows, stop the backend API server container before restoring. This releases any active database locks or connection pools.

---

## 1. Step-by-Step Restoration Pipeline

Follow this precise checklist to perform a database restoration in staging or production:

### Step 1: Terminate API connection pools
Stop the running application server to drop connection pools and prevent write conflicts:
```bash
docker-compose stop backend
```

### Step 2: Identify your target backup archive
List all available compressed backups in the archive directory:
```bash
ls -lh ./backups
```
Identify the file name you wish to restore (e.g. `velora_backup_20260627_120000.sql.gz`).

### Step 3: Run the restoration utility
Run the restore script, passing the backup file path as the first argument:
```bash
npm run docker:restore ./backups/velora_backup_20260627_120000.sql.gz
```
The script will display a security warning:
```
WARNING: This operation will overwrite existing data in database 'velora_db'!
Are you sure you want to proceed? (y/N)
```
Type `y` and hit **Enter** to confirm.

### Step 4: Restart the backend API server
Once restoration completes, reboot the backend to re-seed connection pools and resume services:
```bash
docker-compose start backend
```

---

## 2. Alternate Direct Recovery (Manual Fallback)

If the restore script is unavailable, you can manually decompress and pipe the SQL files directly into the PostgreSQL container using Docker commands:

```bash
# Decompress the sql.gz file
gunzip -c ./backups/velora_backup_20260627_120000.sql.gz > temp_restore.sql

# Pipe the SQL commands directly into the postgres container instance
docker exec -i velora_postgres psql -U velora_admin -d velora_db < temp_restore.sql

# Remove the temporary uncompressed SQL file
rm temp_restore.sql
```

---

## 3. Post-Recovery Verification

To ensure that the restoration was fully successful and data integrity has been maintained:

1. **Verify user table sizes**: Check user counts and match them against known totals prior to the backup.
   ```bash
   docker-compose exec postgres psql -U velora_admin -d velora_db -c "SELECT COUNT(*) FROM users;"
   ```
2. **Review server logs**: Look for any database read/write failures or schema mismatch issues.
   ```bash
   npm run docker:logs backend
   ```
3. **Execute API health check**: Make sure the health check responds with 200:
   ```bash
   npm run docker:health
   ```
