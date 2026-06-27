# Velora Authentication & Authorization Architecture Flow

This document details the architectural specifications and cryptographic protocols governing Velora's session handling, multi-tier login gates, dynamic token scopes, and email validation systems.

---

## 1. Authentication Protocol Overview

Velora uses a secure, stateless, token-based authentication mechanism driven by JSON Web Tokens (JWT). 

- **Session Lifetimes**: 
  - **Access Session Token (JWT)**: Valid for **24 hours**. Encrypted using HS256 with server-side `JWT_SECRET`.
  - **Refresh Session Token (JWT)**: Valid for **7 days**. Returned during successful login to allow secure re-issue of access sessions on client environments.
  - **Temporary Verification Token (JWT)**: Valid for **10 to 15 minutes**. Restricts scope to specialized endpoints (e.g., TOTP verification, password updates).

---

## 2. Progressive Login Gate State Machine

When a client initiates a request to `POST /api/auth/login`, the backend evaluates credentials and handles user state using a progressive routing table. 

Below is the state representation of the login transition gates:

```
+---------------------------------------------------------+
|                  Client initiates Login                 |
|                  POST /api/auth/login                   |
+----------------------------+----------------------------+
                             |
                             v
               +-------------+-------------+
               |   Check Password & State  |
               +-------------+-------------+
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
         [Match Fails]            [Match Succeeds]
                 |                       |
                 v                       v
      Lockout Counter Checked     Check user flags
                 |                       |
    (5 failures = 15m Lock)              |
                                         |
     +-----------------+-----------------+-----------------+
     |                 |                 |                 |
     v                 v                 v                 v
[Needs Reset?]   [2FA Enabled?]   [Suspended State?] [Standard User]
     |                 |                 |                 |
     v                 v                 v                 v
Return 200        Return 200        Return 401        Return 200
needsPassword     requires2fa       "This account     Login Session
  scope token       temp token       is deleted"       + User Payload
```

---

## 3. Dynamic Token Scopes Reference

Velora enforces precise route authorization by generating specialized JWT tokens containing constrained scopes:

### A. Reset Token Scope (`resetScope`)
- **Issued By**: `POST /api/auth/login` (if `needsPasswordChange` flag is active on the admin account).
- **Expiration**: **15 minutes**.
- **Scope Restriction**: Only authorized to access `POST /api/admin/force-password-change`. Attempting to query profile details or other API paths returns a `400 Bad Request` or `401 Unauthorized` response.
- **Claims Schema**:
  ```json
  {
    "userId": 1,
    "resetScope": true,
    "iat": 1782562484,
    "exp": 1782563384
  }
  ```

### B. Two-Factor Token Scope (`tempToken`)
- **Issued By**: `POST /api/auth/login` (if `twoFactorEnabled` flag is active).
- **Expiration**: **10 minutes**.
- **Scope Restriction**: Only authorized to access `POST /api/auth/login-2fa`. Consuming this token with incorrect codes fails and does not expose session capabilities.
- **Claims Schema**:
  ```json
  {
    "userId": 1,
    "twoFactorPending": true,
    "iat": 1782562484,
    "exp": 1782563084
  }
  ```

---

## 4. Email Verification Loop

During registration, user records are created with a default state of `verified: false`. 

1. **Generation**: The system automatically computes a 6-digit cryptographic verification code (e.g., `581029`) and saves it on the database user record (`verificationCode`).
2. **Dispatch**: Dispatches a styled verification card email containing the code to the user's registered inbox via Resend.
3. **Submission**: The user enters the code on the waitlist UI which triggers `POST /api/auth/verify-email` with Bearer auth.
4. **Validation**: The backend matches the provided code with `user.verificationCode`. 
5. **Completion**:
   - Updates `verified: true`.
   - Awards **+150 points** directly to the user's waitlist ledger balance.
   - Logs audit trail events (`Email Verification Completed`).
   - Dispatches a celebratory congrats push notification.
   - Triggers dynamic leaderboard rank evaluation.

---

## 5. Multi-Factor Authentication (TOTP) Pathway

Velora supports time-based one-time password (TOTP) generation following RFC 6238 standards.

### Step 1: Secret Setup (`POST /api/user/2fa/generate`)
1. Generates a secure, random 16-character base32 secret (e.g., `NB2W45DFOIZXG63T`).
2. Writes the temporary secret to `user.twoFactorTempSecret` on the database.
3. Builds the otpauth configuration URI:
   `otpauth://totp/Velora:user@velora.io?secret=NB2W45DFOIZXG63T&issuer=Velora`
4. Encodes and passes it to the QR code rendering service API (`https://api.qrserver.com`) to generate a setup card on the client UI.

### Step 2: Verification and Activation (`POST /api/user/2fa/verify`)
1. The user scans the QR code and enters their current 6-digit authenticator code on the verification modal.
2. The backend confirms code alignment against the temporary secret `user.twoFactorTempSecret`.
3. Upon success, the system:
   - Moves the temporary secret to `user.twoFactorSecret` (the permanent vault column).
   - Updates `twoFactorEnabled: true`.
   - Nullifies `twoFactorTempSecret` to prevent session replay vectors.
   - Dispatches security warning alerts (`Two-Factor Authentication Enabled`).

### Step 3: Deactivation (`POST /api/user/2fa/disable`)
1. Disabling 2FA requires the user to submit their current account password to prevent session takeovers if a device or token is briefly compromised.
2. The database resets `twoFactorEnabled` to `false` and clears `twoFactorSecret`.
