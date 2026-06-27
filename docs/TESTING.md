# Velora System Testing & QA Manual

This document details the automated, security, and manual verification procedures used to validate the stability, security, and performance of the Velora platform.

---

## 1. REST API Integration Testing

All REST API endpoints are validated using the following test configurations:

* **Insomnia Workspaces**: We maintain a production workspace file at `/docs/INSOMNIA_COLLECTION.json`. Import this collection to test endpoints such as authentication, profile updates, task completions, and admin broadcasts.
* **Postman Collections**: Import `/docs/POSTMAN_COLLECTION.json` to configure automated API testing suites, verifying response schemas and HTTP codes.
* **cURL Scripts**: Quick terminal scripts can verify simple endpoint health:
  ```bash
  # Check system API health status
  curl -X GET http://localhost:3000/api/health
  ```

---

## 2. Security & Vulnerability Auditing

To ensure the security of the platform, the following security checks are performed:

* **IDOR Validation Checks**: Confirm that users cannot modify other users' notifications or settings. The API should reject unauthorized requests with a `403 Forbidden` response.
* **SQL Injection Safeguards**: Ensure all database queries use Drizzle's parameterized statements. Avoid using raw SQL concatenations, as they can expose security vulnerabilities.
* **Login Lockout Checks**: Verify that five consecutive failed login attempts trigger a 15-minute lockout. The API should return a `403 Forbidden` lockout response.
* **Token Scope Integrity**: Confirm that password reset tokens containing `resetScope: true` cannot access protected user resources like `/api/auth/me`.

---

## 3. Manual QA Verification Checklist

Perform these manual checks to verify features are working correctly before deploying to production:

### A. Onboarding & Authentication
- [ ] **Registration**: Registering a new account writes records to both the `users` and `profiles` tables.
- [ ] **Email Verification**: Confirm that the 6-digit confirmation code matches the database record, and verifying the code awards the +150 verification bonus points.
- [ ] **MFA Setup**: Configure Time-Based 2FA, scan the generated QR code, and verify that incorrect 6-digit codes are rejected.
- [ ] **MFA Login**: Log in with MFA enabled, verify that a temporary token is returned, and confirm that the login completes successfully only after submitting a valid authenticator code.

### B. Referrals Engine
- [ ] **Direct Referrals (Level 1)**: Register a user using an invite code. Verify that the referrer receives +250 points and their referral count increments.
- [ ] **Recursive Referrals (Levels 2 & 3)**: Verify that points are distributed recursively up the referral chain (Level 2: +100 points, Level 3: +50 points).
- [ ] **Self-Referral Prevention**: Confirm that attempting to register with your own username or invite code returns a `422 Unprocessable Entity` error.

### C. Tasks & Achievements
- [ ] **Social Tasks**: Complete social tasks (e.g., website visit or Twitter verification) and confirm that points are added and the task is marked "Completed" on the UI.
- [ ] **Streak Multipliers**: Perform consecutive daily check-ins and verify that the points awarded include the correct streak multiplier bonus.
- [ ] **Achievements**: Complete milestones (such as linking a wallet or email verification) and confirm that the corresponding badge is unlocked and saved to your profile.

### D. Administrative Workspace
- [ ] **Access Guard**: Confirm that standard users attempting to access `/api/admin/*` routes receive a `403 Forbidden` response.
- [ ] **Settings Modifications**: Update settings (e.g. app name, social links, global point multiplier) and confirm that the changes apply across the UI.
- [ ] **KYC Portal**: Approve and reject pending KYC submissions, and verify that approved users receive their +500 point bonus, "Verified Citizen" badge, and a confirmation email.
- [ ] **Audit Trail**: Confirm that administrative actions (e.g. banning users or creating tasks) are written to the `audit_logs` table.
