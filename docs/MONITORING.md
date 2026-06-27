# Velora Production Monitoring & Reliability Guide

This document describes Velora's observability, diagnostics, and monitoring frameworks, including structured logs, container health loops, API heartbeats, and performance tracing.

---

## 1. Monitoring Stack Architecture

Velora's production observability framework is built on three main layers:

```
+------------------+     +-------------------+     +--------------------+
|  Structured Logs | --> |  Standard Streams | --> | Cloud Logger       |
|  (JSON Outputs)  |     |  (stdout/stderr)  |     | (GCP, Datadog, ELK)|
+------------------+     +-------------------+     +--------------------+
                                                            ^
+------------------+     +-------------------+              |
|  API Heartbeats  | --> |  /api/health check| -------------+
|  (JSON Payload)  |     |  (Internal/SRE)   |
+------------------+     +-------------------+
                                                            v
+------------------+     +-------------------+     +--------------------+
| Container Checks | --> |  Docker Daemon    | --> | Orchestrator Alarm |
|  (Healthcheck)   |     |  (Heal / Restart) |     | (Slack / PagerDuty)|
+------------------+     +-------------------+     +--------------------+
```

---

## 2. API Health Check Endpoint

Velora exposes a comprehensive, real-time health-check resource at `/api/health`. This endpoint provides diagnostic metrics about the underlying hardware and database engines:

### Heartbeat Request
```http
GET /api/health HTTP/1.1
Host: your-domain.com
```

### Healthy Heartbeat Response (HTTP 200)
```json
{
  "status": "healthy",
  "timestamp": "2026-06-27T12:00:00.000Z",
  "uptime": 2304.5,
  "version": "2.0.0",
  "memory": {
    "rss": 42123456,
    "heapTotal": 24567123,
    "heapUsed": 18234567,
    "external": 1234567
  },
  "database": "PostgreSQL (Cloud SQL)",
  "system": {
    "appName": "Velora",
    "usersCount": 1205,
    "tasksCount": 5,
    "pointMultiplier": 1.0
  }
}
```

### Degraded Heartbeat Response (HTTP 500)
If the connection to the PostgreSQL database fails or timing queries fail, the API responds with a `500 Internal Server Error` and includes the details of the failure:
```json
{
  "status": "degraded",
  "timestamp": "2026-06-27T12:05:00.000Z",
  "error": "connect ECONNREFUSED 127.0.0.1:5432"
}
```

---

## 3. Structured JSON Logging

To allow easy log aggregation by systems like **Elasticsearch**, **Google Cloud Logging**, **Grafana Loki**, or **Datadog**, Velora outputs production logs in structured JSON format via the Nginx access logs:

```json
{
  "time_local": "27/Jun/2026:12:00:00 +0000",
  "remote_addr": "192.168.1.50",
  "request": "POST /api/auth/login HTTP/1.1",
  "status": "200",
  "body_bytes_sent": "542",
  "request_time": "0.045",
  "http_referrer": "https://velora.io/login",
  "http_user_agent": "Mozilla/5.0...",
  "http_x_forwarded_for": "10.0.2.100"
}
```

---

## 4. Container Self-Healing Rules

In `docker-compose.yml`, both `frontend` and `backend` containers execute active, interval-based checks:

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Self-Healing Logic:
1. Every **30 seconds**, the container sends a fetch query to `/api/health`.
2. If the query fails or takes longer than **10 seconds**, it registers a failure.
3. If **3 consecutive failures** are registered, the container is marked as `unhealthy`.
4. The Nginx edge proxy will stop routing traffic to that instance, and the Docker daemon will automatically trigger a container restart (`restart: always` rule).

---

## 5. Proactive Alerting (Sentry, PagerDuty, Slack)

To establish active notification alarms, configure SRE alerts for the following metric deviations:

| Metric | Alarm threshold | Trigger Condition | Recommended Target |
| :--- | :--- | :--- | :--- |
| **API Response Latency** | `> 500ms` | Average over 5 minutes | Slack Channel alert |
| **HTTP 5xx Rate** | `> 1.5%` | Out of total requests over 1 minute | PagerDuty On-Call |
| **Disk Storage (Postgres)** | `> 85%` | Persistent for 1 hour | Email notification |
| **CPU Utilization** | `> 90%` | Persistent for 5 minutes | Scale up containers |
