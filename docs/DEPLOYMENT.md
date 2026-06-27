# Velora Production Deployment Guide

This document outlines the hosting architecture, containerization structures, deployment steps, scaling strategies, and monitoring practices for hosting Velora in a production environment (either Google Cloud Run or a dedicated virtual private server / VM using Docker Compose).

---

## 1. Hosting Options & Production Architecture

Velora supports two production-grade deployment architectures based on your infrastructure strategy:

### Option A: Fully Managed Serverless (Google Cloud Run)
Best for elastic auto-scaling, scale-to-zero pricing, and minimal container management overhead.

```
                   +-----------------------------------+
                   |          Public Internet          |
                   +-----------------+-----------------+
                                     | (HTTPS / TLS on Port 443)
                                     v
                   +-----------------+-----------------+
                   |       GCP Load Balancer / DNS     |
                   +-----------------+-----------------+
                                     | (Port 3000 Ingress)
                                     v
                   +-----------------+-----------------+
                   |       Cloud Run Container         |
                   |      (Vite + Express Server)      |
                   +-----------------+-----------------+
                                     |
                       +-------------+-------------+
                       | (Private VPC Network)     |
                       v                           v
           +-----------+-----------+   +-----------+-----------+
           |    Cloud SQL Instance |   |   Google Cloud Gemini |
           |      (PostgreSQL)     |   |         AI Engine     |
           +-----------------------+   +-----------------------+
```

### Option B: High-Availability Docker Compose (Dedicated VM / VPS)
Best for sovereign hosting, flat-rate hosting pricing, and integrated Nginx proxy caching.

```
                                  [ Port 80 / 443 Ingress ]
                                              |
                                              v
                               +--------------+--------------+
                               |     nginx (Reverse Proxy)   |
                               +-------+--------------+------+
                                       |              |
                        +--------------+              +--------------+
                        | (Proxy to UI)                              | (Proxy to API)
                        v                                            v
         +--------------+--------------+              +--------------+--------------+
         |      frontend (8080)        |              |       backend (3000)        |
         +-----------------------------+              +-------+--------------+------+
                                                              |              |
                                               +--------------+              +--------------+
                                               | (SQL queries)                              | (Cache)
                                               v                                            v
                                +--------------+--------------+              +--------------+--------------+
                                |      postgres (5432)        |              |        redis (6379)         |
                                +-----------------------------+              +-----------------------------+
```

---

## 2. Option A: Deploying to Google Cloud Run

To build and deploy your container directly to Google Cloud Run, execute the following three stages:

### Step 1: Authenticate with Google Cloud SDK
Ensure you are authenticated and have targeted the correct Cloud project ID:
```bash
gcloud auth login
gcloud config set project your-gcp-project-id
```

### Step 2: Build Image via Google Artifact Registry
Build the Docker container and push it to your Google Artifact Registry:
```bash
# Enable required services
gcloud services enable artifactregistry.googleapis.com run.googleapis.com

# Create an Artifact Registry Repository
gcloud artifacts repositories create velora-repo \
    --repository-format=docker \
    --location=asia-southeast1 \
    --description="Velora production Docker images"

# Build and tag the backend container (which serves both backend + static client)
gcloud builds submit --tag asia-southeast1-docker.pkg.dev/your-gcp-project-id/velora-repo/velora-app:v1 -f Dockerfile.backend .
```

### Step 3: Deploy to Cloud Run
Deploy the image to Cloud Run, specifying port `3000` for ingress:
```bash
gcloud run deploy velora-service \
    --image asia-southeast1-docker.pkg.dev/your-gcp-project-id/velora-repo/velora-app:v1 \
    --platform managed \
    --region asia-southeast1 \
    --allow-unauthenticated \
    --port 3000 \
    --set-env-vars="NODE_ENV=production,PORT=3000,JWT_SECRET=your_production_secret"
```

---

## 3. Option B: Deploying with Docker Compose (VM / VPS)

To host Velora on a private Linux VPS (e.g. Ubuntu, Debian) with Nginx proxying, Postgres, and Redis:

### Step 1: Setup Server & Install Docker
Ensure Docker and Docker Compose are installed on your VPS host.
```bash
sudo apt update && sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

### Step 2: Allocate Codebase & Configure Environment
Clone the repository into `/opt/velora` and create a production `.env` configuration:
```bash
mkdir -p /opt/velora
cd /opt/velora
# Copy/Transfer codebase here...

# Copy and edit variables
cp .env.example .env
nano .env # Configure real secrets and passwords
```

### Step 3: Launch Services & Seed Database
```bash
# Build production images
npm run docker:build

# Run in background mode
npm run docker:up

# Check database connection logs and run Drizzle push
npm run docker:health
docker-compose exec -T backend sh ./scripts/db-migrate.sh
```

---

## 4. Production Security Hardening

For production environments, ensure you implement the following safety safeguards:

1. **Change Default Passwords**: Modify all database passwords, JWT secrets, and admin configurations in your production `.env` file before booting the containers.
2. **Setup SSL/TLS Certificates**: Configure Nginx with Let's Encrypt SSL certificates. You can use Certbot on the host or map a reverse-proxy sidecar (like Nginx Proxy Manager or Traefik) to automate SSL.
3. **Firewall Access Controls**:
   * Restrict access to host ports `5432` and `6379`. These ports are bound to `127.0.0.1` inside `docker-compose.yml` by default to prevent public access.
   * Expose ONLY ports `80` and `443` to the public web.
4. **Secrets Management**: If deploying on Google Cloud Run, prefer using **Google Secret Manager** to mount database credentials and API secrets into environment variables instead of loading them in plain text.

---

## 5. Auto-Scaling & Capacity Bounds

### Cloud Run Auto-Scaling Toggles
* **Concurrency Limits**: Set to **80 requests per container** to optimize CPU and memory utilization.
* **Auto-Scaling bounds**: Configure minimum instances to `1` (prevents cold-starts and latency spikes) and maximum instances to `10` or higher based on active campaign loads.
* **Resources**: Allocate **1 vCPU** and **2 GiB of RAM** per container instance.

### Docker Compose Scaling
* You can scale the backend API container under Nginx load balancers by executing:
  ```bash
  docker-compose up -d --scale backend=3
  ```
* Nginx automatically balances connections across scaled nodes inside the Docker network.
