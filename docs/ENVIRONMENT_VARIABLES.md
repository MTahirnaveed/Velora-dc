# Velora Environment Configuration Matrix

This document catalogs all environment variables used by Velora, detailing their purposes, default values, required states, and security recommendations.

---

## 1. Environment Variables Catalog

| Variable Name | Required | Default Value | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `development` | `production` | Running environment mode. Triggers build optimizations and static directory hosting configurations. |
| `PORT` | Yes | `3000` | `3000` | The network port the server binds to. Must always be `3000` for hosting routing and reverse-proxy compatibility. |
| `DATABASE_URL` | Yes | None | `postgresql://db_user:db_pass@host:5432/veloradb` | Connection string used by the Drizzle ORM client to connect to PostgreSQL. |
| `JWT_SECRET` | Yes | None | `7a1b...f8e2` | HMAC-SHA256 secret key used to sign and verify stateless session JSON Web Tokens (JWT). |
| `RESEND_API_KEY`| No | None | `re_a1b2c3d4...` | API Key for the Resend email delivery service. Used to dispatch transactional, verification, and campaign emails. |
| `GEMINI_API_KEY`| No | None | `AIzaSy...` | API Key for Google Gemini. Used by the server-side proxy route for AI-powered verification features. |

---

## 2. In-Depth Variable Specifications & Security

### `NODE_ENV`
- **Purpose**: Controls whether the app runs in developer or production mode.
- **Security Impact**: In production (`NODE_ENV=production`), detailed database error messages are suppressed from API responses to prevent exposing internal schema details, and standard security headers are enforced.

### `PORT`
- **Purpose**: Defines the server port.
- **Security Impact**: Hardcoded to bind to port `3000` on host `0.0.0.0` inside container runtimes. This aligns with GCP Cloud Run and internal reverse-proxy routing models.

### `DATABASE_URL`
- **Purpose**: Relational connection string for Drizzle ORM and PostgreSQL.
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database_name]?sslmode=require`
- **Security Impact**: Must never be hardcoded in the codebase. In production, utilize IAM Database Authentication or store the connection string securely in Google Secret Manager, granting access only to the Cloud Run service account.

### `JWT_SECRET`
- **Purpose**: Signs and decrypts user JWT tokens.
- **Security Impact**: Must be a high-entropy, random hex string of at least 256 bits (32 bytes). Keep this secret secure; if compromised, attackers can forge admin-level credentials and bypass authentication.

### `RESEND_API_KEY`
- **Purpose**: Authenticates transactional and campaign emails.
- **Security Impact**: Restrict Resend API Key permissions to "Sending Only" and bind them to your verified sending domain in the Resend dashboard to prevent misuse.

### `GEMINI_API_KEY`
- **Purpose**: Google Gemini model access.
- **Security Impact**: Restrict the key's API access permissions in the Google Cloud Console to the Gemini API only, and monitor usage limits to protect against DDoS billing attacks.

---

## 3. Deployment Configurations Mapping

Below is an example of an environment configuration template:

```env
# Runtime Environment Mode
NODE_ENV=production
PORT=3000

# PostgreSQL Drizzle Database Connection
DATABASE_URL=postgresql://velora_admin:db_password@your_project.gcp.cloudsql.com:5432/velora_db?sslmode=require

# Cryptographic Keys
JWT_SECRET=b63c462be1194297127e9970bc3422079de915d3cf4c7d08baee4b85c138f325

# Third-Party Integrations
RESEND_API_KEY=re_xyz123abc456
GEMINI_API_KEY=AIzaSyD7-xyz123abc
```
