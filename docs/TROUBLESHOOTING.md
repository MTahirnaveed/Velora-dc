# Velora Platform Troubleshooting Manual

This document provides a troubleshooting playbook for resolving common database errors, authentication issues, build failures, and deployment anomalies on the Velora platform.

---

## 1. Database & Drizzle ORM Issues

### Issue A: "Connection Refused" or "Timeout" during startup
* **Root Cause**: The Express backend cannot connect to the PostgreSQL instance at the address specified in `DATABASE_URL`.
* **Resolution**:
  1. Check if the local PostgreSQL service is running:
     ```bash
     sudo service postgresql status
     ```
  2. Verify that the connection string in your `.env` file matches your PostgreSQL database credentials:
     ```env
     DATABASE_URL=postgresql://user:password@localhost:5432/velora_db
     ```
  3. If deploying to Cloud Run, ensure that the VPC Connector or Cloud SQL Auth Proxy is configured correctly to grant access to the database.

### Issue B: "Relation does not exist" or "Schema mismatch"
* **Root Cause**: Database tables are missing or do not match the schema definitions in `/src/db/schema.ts`.
* **Resolution**: Run migrations to sync your database schema:
  ```bash
  npx drizzle-kit generate
  npx drizzle-kit push
  ```

---

## 2. Authentication & Session Failures

### Issue A: "Invalid token" or "Signature verification failed"
* **Root Cause**: The JWT token submitted in the client's `Authorization` header cannot be verified by the backend.
* **Resolution**:
  1. Check if the `JWT_SECRET` environment variable was changed or restarted. If so, all active sessions are invalidated, and users must log in again.
  2. Ensure the client is passing the token correctly using the Bearer format:
     ```
     Authorization: Bearer <your_token_string>
     ```

### Issue B: "Authenticator code mismatch" during MFA Setup or Login
* **Root Cause**: The 6-digit verification code submitted by the user does not match the computed Time-Based One-Time Password (TOTP) value.
* **Resolution**:
  1. Ensure the system time on your server is synchronized with a reliable internet NTP server (such as Google NTP or Pool NTP), as TOTP calculations depend strictly on time alignment.
  2. Confirm that the user's mobile device is also synchronized to their local network time.

### Issue C: "Account locked" or lockout loops
* **Root Cause**: The user's account has been locked due to consecutive failed login attempts.
* **Resolution**:
  1. Wait for the 15-minute lockout timer to expire.
  2. Administrators can manually unlock the account from the Admin panel by resetting `failedLoginAttempts` to 0 and clearing the `lockedUntil` timestamp in the database.

---

## 3. Local Build & Development Compilation Issues

### Issue A: "Vite command not found" or "tsx: command not found"
* **Root Cause**: Project dependencies are missing or were not installed completely.
* **Resolution**: Clear the local cache and reinstall dependencies:
  ```bash
  rm -rf node_modules
  npm cache clean --force
  npm install
  ```

### Issue B: "Out of memory" or build crashes
* **Root Cause**: Heavy bundling operations during compilation exceed Node's default heap space memory allocation.
* **Resolution**: Increase Node's memory limit during build operations using the `max-old-space-size` flag:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm run build
  ```

---

## 4. Production Deployment & Cloud Run Issues

### Issue A: "Application failed to start" or continuous container crashes
* **Root Cause**: The container is crashing on startup, often due to missing required environment variables.
* **Resolution**:
  1. Inspect the Cloud Run log stream:
     ```bash
     gcloud beta run services logs tail velora-service --region asia-southeast1
     ```
  2. Confirm that all required secrets (e.g. `DATABASE_URL` and `JWT_SECRET`) are configured and accessible by the Cloud Run service account.

### Issue B: "SSL Connection Required" on Cloud SQL
* **Root Cause**: The PostgreSQL instance is configured to require secure SSL connections, but the connection string is missing the SSL parameter.
* **Resolution**: Append `sslmode=require` to the database connection string:
  ```env
  DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
  ```
