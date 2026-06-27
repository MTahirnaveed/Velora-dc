# Velora Authentication & Access Control Architecture

This document details the architectural specifications and cryptographic protocols governing Velora's multi-tiered session handling, progressive login gates, Time-Based Multi-Factor Authentication (MFA), and Role-Based Access Control (RBAC).

---

## 1. Authentication Lifecycle Flow

Below is the procedural state diagram of a user session, from initial registration to authenticated endpoint usage:

```
[Register Account]
        |  Generates verificationCode
        v
[Verify Email Code]  --> Rewards user +150 Points & Sets verified = true
        |
        v
[Submit Login Credentials]
        |
        +---> Password Incorrect? Increase Lockout Count (5 fails = 15m lock)
        |
        v  Password Matches & Account Active
        |
        +---> Needs Password Reset? Return resetScope Token (15m expiry)
        |
        +---> MFA Enabled? Return tempToken (10m expiry, requires login-2fa)
        |
        v  All Gates Passed
        |
[Issue Token Envelope] 
  - Access Token (JWT, 24h lifetime)
  - Refresh Token (Saved in DB, 7d lifetime)
```

---

## 2. Stateless JWT Session Tokens

Velora uses stateless JSON Web Tokens (JWT) for secure authentication.

* **Access Session Token**:
  * **Algorithm**: HMAC-SHA256 (HS256)
  * **Lifetime**: **24 Hours**
  * **Contents**: Includes `userId`, `email`, `username`, and `role`. Passed in the HTTP `Authorization: Bearer <token>` header.
* **Refresh Session Token**:
  * **Algorithm**: HMAC-SHA256 (HS256)
  * **Lifetime**: **7 Days**
  * **Storage**: Stored in both client `localStorage` and the database `sessions` table, enabling secure access token regeneration.

---

## 3. Progressive Login Gates

When a request is sent to `POST /api/auth/login`, Velora processes it through a series of progressive security gates:

1. **Lockout Gate**: Checks if `user.lockedUntil` is set and in the future. If so, login is rejected immediately.
2. **Password Verification Gate**: Validates the password against `user.passwordHash` using `bcrypt.compare()`.
   * **If incorrect**: Increments `user.failedLoginAttempts`. If it reaches 5, sets `user.lockedUntil` to 15 minutes in the future and returns `403 Forbidden`.
   * **If correct**: Resets `failedLoginAttempts` to 0 and clears `lockedUntil`.
3. **Reset Password Gate**: Checks if `user.needsPasswordChange` is true. If so, returns a restricted `resetScope` JWT valid for 15 minutes, allowing access *only* to `/api/admin/force-password-change`.
4. **Multi-Factor Authentication (MFA) Gate**: Checks if `user.twoFactorEnabled` is true. If so, returns a restricted `tempToken` valid for 10 minutes, requiring verification via `POST /api/auth/login-2fa`.
5. **Session Finalization**: If all gates are passed, generates standard access and refresh tokens.

---

## 4. Time-Based One-Time Password (TOTP) Setup

Velora supports time-based MFA following RFC 6238 standards.

```
[Request 2FA Setup] (POST /api/user/2fa/generate)
        |
        v
- Generates 16-character base32 secret
- Saves in user.twoFactorTempSecret
- Returns otpauth URI
        |
        v
[Scan QR Code in App & Submit 6-digit Code] (POST /api/user/2fa/verify)
        |
        v
- Verifies TOTP code against twoFactorTempSecret
- Saves secret to permanent user.twoFactorSecret
- Sets twoFactorEnabled = true
- Clears twoFactorTempSecret
```

---

## 5. Email Verification Loop

To prevent fake signups, Velora enforces email verification:

1. **Registration**: Generates a 6-digit confirmation code, stores it in `users.verificationCode`, and sends an HTML card to the user's inbox via Resend.
2. **Verification**: User submits the code to `POST /api/auth/verify-email`.
3. **Completion**: If correct, updates `verified = true`, clears the code, and awards **+150 waitlist points** to encourage verification.

---

## 6. Role-Based Access Control (RBAC)

Velora separates platform privileges into two distinct roles:

### Standard User (`role: 'user'`)
* Can view personal dashboard and stats.
* Can complete waitlist tasks, perform daily check-ins, and claim rewards.
* Can update personal settings, link wallets, and configure 2FA.

### Platform Administrator (`role: 'admin'`)
* Full system read and write privileges.
* Can access `/api/admin/*` endpoints to view global analytics, update settings, create/delete tasks, and review KYC submissions.
* Enforced via the `checkRole('admin')` Express middleware.
