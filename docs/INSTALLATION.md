# Velora Installation & Local Environment Setup Guide

This document outlines the step-by-step instructions for local development provisioning, database setup, environment verification, migration execution, and production compilation of the Velora full-stack system.

---

## 1. Prerequisites & Host Requirements

Before beginning installation, ensure your local development system satisfies the following runtime specifications:

* **Node.js**: `v18.18.0` or higher (LTS recommended)
* **NPM**: `v9.0.0` or higher
* **Database Engine**: **PostgreSQL** `v14` or higher (local service or managed Cloud SQL instance)
* **API Dependencies**: (Optional but required for full feature compliance)
  * Resend SMTP credentials (for email dispatch)
  * Google Gemini API Key (for server-side content generation gateway)

---

## 2. Installation Sequence

Execute the following commands sequentially to fetch, configure, and install the codebase:

### Step 1: Install Workspace Dependencies
Execute npm install to download and compile all packages in your local `node_modules` directory:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy the template configuration file to establish your local environmental values:
```bash
cp .env.example .env
```
Open `.env` in your text editor and populate the variables. Refer to the **[Environment Variables Manual](ENVIRONMENT_VARIABLES.md)** for exhaustive details on every field.

---

## 3. PostgreSQL Database Provisioning

Velora uses **Drizzle ORM** paired with a PostgreSQL database. Follow these steps to initialize your schema:

### Option A: Local PostgreSQL Setup
1. Create a clean database on your local PostgreSQL cluster:
   ```sql
   CREATE DATABASE velora_db;
   ```
2. Verify your database connection string format in your `.env` file:
   ```env
   DATABASE_URL=postgres://postgres:password@localhost:5432/velora_db
   ```

### Option B: Cloud SQL / Remote PostgreSQL
Configure the `DATABASE_URL` with your remote PostgreSQL connection string:
```env
DATABASE_URL=postgresql://db_user:db_password@your_host.gcp.cloudsql.com:5432/velora_db?sslmode=require
```

---

## 4. Drizzle Migrations & Schema Mapping

Velora's schema mappings are defined programmatically inside `/src/db/schema.ts`. Apply this structure to the database using the following commands:

### Generate Schema Migration Files
Compile schema updates into SQL files in the migrations directory:
```bash
npx drizzle-kit generate
```

### Apply Migrations to Database
Push the migration files directly into your active database instance to build tables, relationships, and constraints:
```bash
npx drizzle-kit push
```

### Optional: Open Drizzle Studio UI
Launch the interactive database UI to directly browse tables, write queries, and perform live data verification:
```bash
npx drizzle-kit studio
```

---

## 5. Seed the Database

Velora includes a dedicated seeding script inside `/src/db/seed.ts` that populates default waitlist tasks (Twitter verify, Wallet link, Telegram check, website visits), creates a default administrative profile, and establishes system settings.

To seed the database, run:
```bash
# Compile and execute the database seeding script
npx tsx src/db/seed.ts
```

---

## 6. Starting the Application

Once database setup is complete, you can start the application in development or production modes:

### A. Development Mode
Runs the backend Express server with `tsx` (which supports automatic TypeScript execution and live reload) while Vite compiles and serves the React frontend inside the development middleware:
```bash
npm run dev
```
* **Local Ingress Point**: `http://localhost:3000`
* **Vite Hot Refresh Port**: Handled automatically behind port `3000` via Express proxying.

### B. Production Build and Start
Compiles both frontend assets (via Vite compiler) and server-side TypeScript code (bundled via esbuild), and starts the optimized Node runtime.

1. **Build Step**:
   ```bash
   npm run build
   ```
   * *What this does*:
     1. Runs `vite build` to compile the React/TS SPA into optimized HTML, JS, and CSS inside `/dist`.
     2. Runs `esbuild` to compile `server.ts` and its dependencies into a single CommonJS bundle file at `/dist/server.cjs` for lightning-fast container cold-start speeds.

2. **Start Step**:
   ```bash
   npm run start
   ```
   * *What this does*: Launches the Express production server utilizing `node dist/server.cjs`, listening directly on port `3000`.

---

## 7. Post-Installation Verification Checklist

Verify installation success by checking the following behaviors:

- [ ] **Frontend Loading**: Accessing `http://localhost:3000` renders the modern glassmorphic landing page.
- [ ] **Connection Checks**: Submitting registration checks database storage on `users` and `profiles` tables.
- [ ] **Admin Ingress**: Log in using your seeded admin account credentials to confirm analytics charts and user summaries render successfully.
- [ ] **Log Outputs**: Terminal stdout shows `Server running on port 3000` and database connectivity confirmation.
