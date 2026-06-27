# Velora Database Backup Strategy & Manual Guides

To ensure business continuity and guard against catastrophic data loss, a robust, production-grade backup strategy is integrated into Velora. This document details manual and automated operations.

---

## 1. Backup Core Pipeline

Backups are executed using our highly optimized shell helper (`scripts/db-backup.sh`). The pipeline performs the following actions:

1. **Active Compression**: Stream queries directly to `gzip` to optimize archive storage space (reducing file sizes by up to 90%).
2. **Deterministic Timestamps**: Naming formats use ISO-adjacent timestamp structures: `velora_backup_YYYYMMDD_HHMMSS.sql.gz`.
3. **Automated Pruning (Retention)**: Retention policies are set to **7 days** by default. Backups older than 7 days are auto-deleted at the end of the backup cycle to prevent server storage overflow.
4. **Volume Storage**: Archives are stored in `/opt/velora/backups` on the host machine.

---

## 2. Triggering Backups Manually

You can execute a manual backup using either `npm` or by executing the script directly:

### Option A: Using NPM (Recommended)
```bash
npm run docker:backup
```

### Option B: Executing the Shell Script
```bash
chmod +x ./scripts/db-backup.sh
./scripts/db-backup.sh
```

### Option C: Direct Docker Command (Fallback)
If executing outside of the root repository folder, invoke:
```bash
docker exec -t velora_postgres pg_dump -U velora_admin -d velora_db | gzip > ./backups/manual_velora_backup.sql.gz
```

---

## 3. Automating Backups (Cron Scheduling)

To configure automated daily backups on your Linux server:

### Step 1: Open the system crontab editor
```bash
sudo crontab -e
```

### Step 2: Add the cron configuration line
Append the following line to schedule backups **every night at 2:00 AM**:
```cron
0 2 * * * cd /opt/velora && /bin/sh ./scripts/db-backup.sh >> /var/log/velora_backup.log 2>&1
```

### Step 3: Verify the cron scheduler is active
```bash
sudo systemctl status cron # on Debian/Ubuntu
sudo systemctl status crond # on RHEL/CentOS
```

---

## 4. Off-Site Backup Replication (Disaster Recovery)

Storing backups on the same local server hosting the application represents a single point of failure (e.g. disk corruption, hardware failure). It is **strongly recommended** to replicate backups to off-site cloud storage.

### Replication Recipe using AWS CLI / S3:
Add this line to your backup script or schedule it after the backup cron job to sync files to secure S3 or Google Cloud Storage buckets:
```bash
aws s3 sync ./backups/ s3://your-secure-velora-backup-bucket/ --delete
```
or with gcloud:
```bash
gsutil rsync -r ./backups/ gs://your-secure-velora-backup-bucket/
```
