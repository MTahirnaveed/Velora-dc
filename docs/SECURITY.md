# Velora Security Policy & Hardening Matrix

This document presents the complete security architecture, threat mitigations, cryptographic configurations, and key storage policies implemented across the Velora full-stack backend.

---

## 1. Cryptographic Specifications & Standards

Velora enforces strong cryptography across all persistent storage, transport, and session layers:

- **Password Hashing**: Passwords are secure salted hashes generated using **Bcrypt**. Cleartext passwords are never logged, stored, or processed beyond initial route validations.
- **Session Tokens**: Implemented via **HMAC-SHA256 (HS256)** JSON Web Tokens (JWT). Private keys are managed via the container environment (`JWT_SECRET`).
- **MFA Secrets**: Enforces the base32-encoded HMAC-SHA1 Time-Based One-Time Password (TOTP) algorithm defined in **RFC 6238**.
- **On-chain Simulation**: Dispatches mock transactions with random secure hex hashes of length 64, mimicking standard EVM keystores.

---

## 2. Dynamic Threat Mitigation Matrix

Velora is hardened against the OWASP Top 10 vulnerabilities:

### A. SQL Injection (SQLi)
- **Mitigation**: Velora uses **Drizzle ORM** for database interaction, which strictly utilizes parameterized SQL queries and prepared statements. Raw SQL string concatenation is prohibited in database statements.

### B. Cross-Site Scripting (XSS)
- **Mitigation**: Output validation is paired with content sanitation. The Express backend enforces `application/json` responses, preventing browser interpretation of payloads as executable scripts.

### C. Cross-Site Request Forgery (CSRF)
- **Mitigation**: All mutable actions require stateless `Authorization: Bearer <token>` HTTP headers. Since standard cookies are not used for REST sessions, CSRF vectors are mitigated.

### D. Insecure Direct Object References (IDOR)
- **Mitigation**: Route handlers verify resource ownership before modifying records. For example, marking notifications as read verifies that the user ID on the notification exactly matches the ID decoded from the JWT session token:
  ```typescript
  // Enforces IDOR isolation
  await db.update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notifId), eq(notifications.userId, req.user.id)));
  ```

### E. Server-Side Request Forgery (SSRF) & Path Traversal
- **Mitigation**: File system operations utilize sanitized relative paths. Web requests generated server-side (like email dispatches) do not accept arbitrary user-controlled target URLs, mitigating proxy SSRF vectors.

### F. Rate Limiting and Lockouts
- **Mitigation**: Login attempts are guarded by an active, progressive lockout mechanism. Users who fail password matching 5 times in a row are temporarily locked out of authentication for 15 minutes. Lockout timers are maintained securely on the database user records.

---

## 3. Role-Based Access Controls (RBAC)

Velora enforces a secure boundary separating regular waitlist users from platform administrators.

- **Standard User**: Can modify personal settings, link Web3 wallets, perform daily check-ins, claim achievements, and complete standard tasks.
- **Admin**: Has full system control, dashboard visibility, user auditing, user suspension (banning/unbanning), waitlist data export access, settings customization, KYC review capabilities, and broadcast capabilities.
- **Route Authorization Guard**: Admin routes check req.user.role status immediately after session verification:
  ```typescript
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden. Admin authorization required." });
  }
  ```

---

## 4. Third-Party Secret Isolation & API Keys

- **Gemini API Key Protection**: The application implements a secure gateway route (`POST /api/gemini/generate`) which proxies user prompts to Google Gemini models using the backend SDK. This prevents exposure of `GEMINI_API_KEY` to the browser, completely isolating AI secrets within the secure server runtime.
- **Resend API Key Protection**: Email dispatcher functions are strictly isolated behind server routines, preventing client execution of SMTP commands or mailing actions.
