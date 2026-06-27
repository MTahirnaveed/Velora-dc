# Velora Docker Architecture & Containerization Guide

This document describes Velora's multi-tier production container infrastructure. It covers local container development, multi-stage compilation, image optimization, security rules, and networking layouts.

---

## 1. High-Level Container Topology

Velora uses a microservice-inspired container structure, wrapping core backend servers, frontend static content, load balancers, database instances, and caching servers into separate isolated components:

```
                  +-----------------------------------+
                  |         HTTP/S Client (Port 80)   |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |      nginx (Reverse Proxy)        |
                  |     - Static assets on /          |
                  |     - Proxy /api/ to Backend      |
                  +--------+-----------------+--------+
                           |                 |
            +--------------+                 +---------------+
            |                                                |
            v                                                v
+-----------+-----------+                        +-----------+-----------+
|    frontend (8080)    |                        |     backend (3000)    |
| - Unprivileged Nginx  |                        | - Node/Express Server |
| - Built with Vite     |                        | - REST API Endpoints  |
+-----------------------+                        +-----+-----------+-----+
                                                       |           |
                                         +-------------+           +-------------+
                                         | (Port 5432)               | (Port 6379)
                                         v                           v
                               +---------+---------+       +---------+---------+
                               |     postgres      |       |      redis      |
                               |  PostgreSQL 15    |       |     Redis 7       |
                               +-------------------+       +-------------------+
```

---

## 2. Service Definitions

Our orchestration pipeline is composed of five distinct services operating inside a unified custom bridge network (`velora_production_net`):

| Service | Port (Container) | Port (Host) | Base Image | Non-Root User | Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **nginx** | `8080` | `80` | `nginxinc/nginx-unprivileged` | `nginx` | Edge proxy, SSL termination, static content caching, rate limiting |
| **frontend** | `8080` | None | `nginxinc/nginx-unprivileged` | `nginx` | Host compiled client React files, serve Vite static assets |
| **backend** | `3000` | `3000` | `node:20-alpine` | `node` | REST API, database access, JWT management, Gemini AI gateway |
| **postgres** | `5432` | `127.0.0.1:5432` | `postgres:15-alpine` | `postgres` | Waitlist registry, audit logs, referral ledgers, configuration persistence |
| **redis** | `6379` | `127.0.0.1:6379` | `redis:7-alpine` | `redis` | Session cache, notification queues, API rate limits |

---

## 3. Image Optimization & Security Best Practices

To adhere to enterprise-grade security and platform reliability mandates, the following strategies have been implemented:

### A. Minimalist Base Images
* All containers utilize highly optimized, minimalist Alpine Linux distributions (`node:20-alpine`, `postgres:15-alpine`, `redis:7-alpine`, `nginxinc/nginx-unprivileged:alpine`). This limits the attack surface by excluding unused system utilities and binary dependencies while reducing image foot-prints (under ~100MB compressed).

### B. Multi-Stage Builds
* Both **Frontend** and **Backend** Dockerfiles employ multi-stage compilation patterns. Dependencies like development-only compilers, TypeScript typings, and esbuild tools are completely isolated in intermediate build containers and omitted from the final running production images.

### C. Non-Root Execution Privilege
* Both standard Nginx (`nginxinc/nginx-unprivileged`) and NodeJS runtimes are configured to execute processes using restricted, non-privileged system users (`nginx` and `node` respectively) with zero sudo access. If a container is compromised, the breakout capability is strictly mitigated.

### D. Docker Health Checks
* Active health checks are baked into container parameters (`HEALTHCHECK` instructions in Dockerfiles). Runtimes monitor container health internally and report state changes to orchestrators, enabling automatic failover and container healing.

---

## 4. Local Development with Docker

To boot the entire production stack locally for testing and evaluation, run the following commands:

### Prerequisites
1. Ensure you have **Docker** and **Docker Compose** installed.
2. Copy `.env.example` to `.env` and fill in mock secrets.

### Launching the Stack
```bash
# Build the images locally
npm run docker:build

# Spin up all containers in detached mode
npm run docker:up

# Check container health status
npm run docker:health

# Stream live container logs
npm run docker:logs
```

Verify that the application is accessible on port `80` (e.g. `http://localhost`).

---

## 5. Troubleshooting Containers

### Check running container status
```bash
docker ps -a
```

### Accessing Backend container shell
```bash
npm run docker:shell
```

### Inspect Database connection inside container
```bash
docker-compose exec postgres pg_isready -U velora_admin -d velora_db
```

### View memory and performance metrics
```bash
docker stats
```
