# Velora REST API Documentation

Welcome to the Velora Production Platform API reference. This document provides complete, production-grade technical specifications for the entire Velora backend waitlist, authentication, task, and administrative ecosystem.

---

## Global API Standards

### API Base URL
- **Production URL**: `https://ais-pre-i7zfxg55onnk4lv3j3rt22-851597643510.asia-southeast1.run.app`
- **Development URL**: `https://ais-dev-i7zfxg55onnk4lv3j3rt22-851597643510.asia-southeast1.run.app`
- **Prefix**: All API endpoints (except public assets like `/robots.txt` and `/sitemap.xml`) are prefixed with `/api`.

### Content Negotiation
- **Request Format**: `application/json` (must be specified in `Content-Type` header for all write operations).
- **Response Format**: `application/json` (except export endpoints which return `text/csv`).

### Date and Time Format
All timestamps returned in response bodies adhere to the ISO 8601 extended format with UTC offset:
`YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., `2026-06-27T12:15:00.000Z`).

### Pagination
For mass collections, results are retrieved as flat arrays or streams. Explicit exports support full waitlist streaming formats.

---

## Table of Contents

- [Authentication](#authentication)
  - [Register](#register)
  - [Login](#login)
  - [Login 2FA](#login-2fa)
  - [Verify Email](#verify-email)
  - [Request Password Reset](#request-password-reset)
  - [Confirm Password Reset](#confirm-password-reset)
  - [Force Password Change](#force-password-change)
  - [Get Self User Profile (Me)](#get-self-user-profile-me)
- [User](#user)
  - [Update Avatar](#update-avatar)
  - [Update Profile Settings](#update-profile-settings)
- [Wallet](#wallet)
  - [Link Wallet](#link-wallet)
- [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
  - [Generate 2FA Secret](#generate-2fa-secret)
  - [Verify & Enable 2FA](#verify--enable-2fa)
  - [Disable 2FA](#disable-2fa)
- [KYC (Know Your Customer)](#kyc-know-your-customer)
  - [Initiate KYC](#initiate-kyc)
- [Points & Rewards](#points--rewards)
  - [Daily Check-In](#daily-check-in)
  - [Claim Waitlist Rewards](#claim-waitlist-rewards)
- [Tasks](#tasks)
  - [Get Tasks](#get-tasks)
  - [Claim Task Reward](#claim-task-reward)
- [Notifications](#notifications)
  - [Get Notifications](#get-notifications)
  - [Mark All Read](#mark-all-read)
  - [Mark Single Notification Read](#mark-single-notification-read)
- [Telegram Integration](#telegram-integration)
  - [Telegram Announcements Feed](#telegram-announcements-feed)
  - [Telegram Bot Webhook](#telegram-bot-webhook)
  - [Simulate Telegram Community Join](#simulate-telegram-community-join)
- [Gemini AI Gateway](#gemini-ai-gateway)
  - [Gemini Content Generation](#gemini-content-generation)
- [Site Settings](#site-settings)
  - [Get System Settings](#get-system-settings)
- [Admin Panel](#admin-panel)
  - [Update System Settings](#update-system-settings)
  - [Create Waitlist Task](#create-waitlist-task)
  - [Update Waitlist Task](#update-waitlist-task)
  - [Delete Waitlist Task](#delete-waitlist-task)
  - [Broadcast Push Notifications](#broadcast-push-notifications)
  - [Analytics Dashboard](#analytics-dashboard)
  - [Sent Emails Log](#sent-emails-log)
  - [Email Campaign dispatcher](#email-campaign-dispatcher)
  - [Approve KYC Audit](#approve-kyc-audit)
  - [Reject KYC Audit](#reject-kyc-audit)
  - [Ban User Account](#ban-user-account)
  - [Unban User Account](#unban-user-account)
  - [Export Users CSV](#export-users-csv)
  - [Export Referrals CSV](#export-referrals-csv)
  - [Export Waitlist Leaderboard CSV](#export-waitlist-leaderboard-csv)

---

## Authentication

### Register

- **Route**: `POST /api/auth/register`
- **Description**: Registers a new user account on the Velora Smart Waitlist. Computes initial reward points modified by the platform multiplier, creates default profile structures, sets up a secure email verification code, and handles multi-tier referral tree logic if a valid referral code is provided.
- **Authentication Required**: No
- **Required Role**: Guest
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "email": "string (required, format: email)",
    "username": "string (required, format: alphanumeric, min: 3)",
    "password": "string (required, min: 8)",
    "referralCode": "string (optional)"
  }
  ```
- **Validation Rules**:
  - `email` must be unique and valid.
  - `username` must be unique and alphanumeric.
  - `password` must be at least 8 characters long.
  - Self-referrals are strictly prohibited.
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Registration successful. Please verify email.",
    "token": "string (JWT session token)",
    "user": {
      "id": "string (Numeric ID)",
      "email": "user@velora.io",
      "username": "user123",
      "points": 100,
      "referralsCount": 0,
      "referralCode": "VEL_USER123",
      "verified": false,
      "dailyStreak": 0,
      "avatar": "avatar_1",
      "role": "user",
      "badges": ["Early Pioneer"],
      "createdAt": "2026-06-27T12:15:00.000Z",
      "verificationCode": "482910"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Missing required fields: email, username, password."}`
  - `400 Bad Request`: `{"error": "An account with this email already exists."}`
  - `400 Bad Request`: `{"error": "This username is already taken."}`
  - `400 Bad Request`: `{"error": "Referral Rejected. Self-referrals are strictly prohibited."}`
  - `403 Forbidden`: `{"error": "System is undergoing scheduled maintenance."}`
- **Database Tables Used**: `users`, `profiles`, `referrals`, `referral_rewards`, `notifications`, `audit_logs`
- **Security Notes**: Direct password isolation is enforced; passwords are raw hashed using Bcrypt before storage. Session tokens expire in 24 hours. Sends welcome verification email via Resend.
- **Examples**:
  - **cURL**:
    ```bash
    curl -X POST https://ais-pre-i7zfxg55onnk4lv3j3rt22-851597643510.asia-southeast1.run.app/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{"email":"pioneer@velora.io", "username":"pioneer", "password":"super_secure_pass_123", "referralCode":"VEL_ADMIN"}'
    ```
  - **JavaScript Fetch**:
    ```javascript
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pioneer@velora.io', username: 'pioneer', password: 'super_secure_pass_123', referralCode: 'VEL_ADMIN' })
    }).then(res => res.json()).then(console.log);
    ```
  - **Axios**:
    ```javascript
    axios.post('/api/auth/register', {
      email: 'pioneer@velora.io',
      username: 'pioneer',
      password: 'super_secure_pass_123',
      referralCode: 'VEL_ADMIN'
    }).then(res => console.log(res.data));
    ```

---

### Login

- **Route**: `POST /api/auth/login`
- **Description**: Authenticates users using email or username paired with their password. Implements automated progressive account lockouts after 5 consecutive failed login attempts. Enforces administrative forced password updates and TOTP multi-factor verification redirect flows.
- **Authentication Required**: No
- **Required Role**: Guest
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "identity": "string (required, username or email)",
    "password": "string (required)"
  }
  ```
- **Success Response (200 OK - Standard)**:
  ```json
  {
    "message": "Login successful.",
    "token": "string (JWT session token)",
    "refreshToken": "string (JWT refresh token)",
    "user": {
      "id": "1",
      "email": "user@velora.io",
      "username": "user123",
      "points": 100,
      "referralsCount": 0,
      "referralCode": "VEL_USER123",
      "verified": false,
      "dailyStreak": 0,
      "avatar": "avatar_1",
      "role": "user",
      "badges": ["Early Pioneer"],
      "createdAt": "2026-06-27T12:15:00.000Z",
      "joinedTelegramChannel": false,
      "joinedTelegramCommunity": false,
      "verificationCode": "482910",
      "twoFactorEnabled": false
    }
  }
  ```
- **Success Response (200 OK - Admin Password Change Required)**:
  ```json
  {
    "success": true,
    "needsPasswordChange": true,
    "token": "string (Temporary change token valid for 15 minutes)",
    "message": "Security Notice: Password change required on first login."
  }
  ```
- **Success Response (200 OK - Multi-Factor Verification Required)**:
  ```json
  {
    "success": true,
    "requires2fa": true,
    "tempToken": "string (Temporary validation token valid for 10 minutes)",
    "message": "Two-Factor Authentication required."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Missing identity or password."}`
  - `401 Unauthorized`: `{"error": "Invalid username, email, or password."}`
  - `401 Unauthorized`: `{"error": "Invalid credentials. 3 attempts remaining before lockout."}`
  - `401 Unauthorized`: `{"error": "This account has been deleted."}`
  - `403 Forbidden`: `{"error": "Account locked due to repeated failed logins. Please try again in 15 minutes."}`
- **Database Tables Used**: `users`, `audit_logs`
- **Security Notes**: Accounts are soft locked for 15 minutes upon 5 successive verification failures.
- **Examples**:
  - **cURL**:
    ```bash
    curl -X POST https://ais-pre-i7zfxg55onnk4lv3j3rt22-851597643510.asia-southeast1.run.app/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"identity":"pioneer@velora.io", "password":"super_secure_pass_123"}'
    ```

---

### Login 2FA

- **Route**: `POST /api/auth/login-2fa`
- **Description**: Verifies a 6-digit TOTP verification code for users with 2FA enabled, consuming the temporary validation token generated during the initial login step.
- **Authentication Required**: No (requires a valid temporary validation token)
- **Required Role**: Guest
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "tempToken": "string (required, JWT temp token)",
    "code": "string (required, 6-digit number string)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "2FA Login successful.",
    "token": "string (JWT session token)",
    "refreshToken": "string (JWT refresh token)",
    "user": {
      "id": "1",
      "email": "admin@velora.io",
      "username": "velora_architect",
      "points": 5000,
      "referralsCount": 15,
      "referralCode": "VEL_VELORA_ARCHITECT",
      "verified": true,
      "dailyStreak": 4,
      "avatar": "avatar_admin",
      "role": "admin",
      "badges": ["Early Pioneer", "Referral Legend"],
      "createdAt": "2026-06-27T12:15:00.000Z",
      "joinedTelegramChannel": true,
      "joinedTelegramCommunity": true,
      "verificationCode": "123456",
      "twoFactorEnabled": true
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Missing required parameters: tempToken, code."}`
  - `400 Bad Request`: `{"error": "Invalid token scope for 2FA validation."}`
  - `400 Bad Request`: `{"error": "Invalid 2FA code format. Must be 6 digits."}`
  - `401 Unauthorized`: `{"error": "Invalid or expired session token."}`
  - `404 Not Found`: `{"error": "User record not found."}`
- **Database Tables Used**: `users`, `audit_logs`

---

### Verify Email

- **Route**: `POST /api/auth/verify-email`
- **Description**: Checks the user's secure 6-digit email verification code against their waitlist user profile, updates verification status, adds +150 points to waitlist balance, and triggers notifications.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "code": "string (required, 6-digit code)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Congratulations! Your email has been verified.",
    "pointsAdded": 150,
    "verified": true
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Verification authorization code required."}`
  - `400 Bad Request`: `{"error": "Your email address is already fully verified."}`
  - `400 Bad Request`: `{"error": "Incorrect verification code. Access Denied."}`
  - `401 Unauthorized`: `{"error": "Access Denied. Authorization token required."}`
- **Database Tables Used**: `users`, `notifications`, `audit_logs`

---

### Request Password Reset

- **Route**: `POST /api/auth/reset-password-request`
- **Description**: Generates a secure 6-digit password reset authorization token, persists it in the database with a 15-minute expiration window, and sends a styled reset email via Resend.
- **Authentication Required**: No
- **Required Role**: Guest
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "email": "string (required, format: email)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Authorization reset token has been dispatched.",
    "code": "849201"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Email address is required."}`
- **Database Tables Used**: `users`, `password_reset_tokens`, `audit_logs`
- **Security Notes**: Returns a generic 200 message if the account doesn't exist to prevent email enumeration.

---

### Confirm Password Reset

- **Route**: `POST /api/auth/reset-password-confirm`
- **Description**: Consumes a valid, unexpired password reset token to update the user account's password with a new Bcrypt hash, dispatches alerts, and invalidates other session tokens.
- **Authentication Required**: No
- **Required Role**: Guest
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "email": "string (required, format: email)",
    "code": "string (required, 6-digit token)",
    "newPassword": "string (required, min: 8)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully. You can now log in with your new credentials."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Missing email, code, or new password."}`
  - `400 Bad Request`: `{"error": "Invalid or expired authorization code."}`
  - `404 Not Found`: `{"error": "User associated with reset token not found."}`
- **Database Tables Used**: `users`, `password_reset_tokens`, `notifications`, `audit_logs`

---

### Force Password Change

- **Route**: `POST /api/auth/force-password-change` (Route actual path: `POST /api/admin/force-password-change`)
- **Description**: Forces administrative password modification during first-time login under credentials configuration policies. Consumes a 15-minute JWT authorization scope token.
- **Authentication Required**: No (Requires active JWT resetScope token)
- **Required Role**: Guest
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "token": "string (required, JWT resetScope token)",
    "newPassword": "string (required, min: 8)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Administrative credentials updated. Please log in with your new password."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Missing token or password."}`
  - `400 Bad Request`: `{"error": "Invalid token scope for password reset."}`
  - `401 Unauthorized`: `{"error": "Authorization failed. Token is invalid or expired."}`
  - `404 Not Found`: `{"error": "User not found."}`
- **Database Tables Used**: `users`, `audit_logs`

---

### Get Self User Profile (Me)

- **Route**: `GET /api/auth/me`
- **Description**: Resolves active JWT bearer token to retrieve complete user details, preferences, verified state, linked Web3 configuration, streaks, and gamification points.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "id": "1",
    "email": "user@velora.io",
    "username": "user123",
    "points": 250,
    "referralsCount": 0,
    "referredBy": null,
    "referralCode": "VEL_USER123",
    "verified": true,
    "dailyStreak": 1,
    "avatar": "avatar_1",
    "role": "user",
    "badges": ["Early Pioneer"],
    "telegramId": null,
    "telegramUsername": null,
    "joinedTelegramChannel": false,
    "joinedTelegramCommunity": false,
    "createdAt": "2026-06-27T12:15:00.000Z",
    "walletAddress": null,
    "walletType": null,
    "kycStatus": "not_started",
    "emailMarketing": true,
    "emailAnnouncements": true,
    "emailReferrals": true,
    "soundEffects": true,
    "twoFactorEnabled": false,
    "verificationCode": "482910"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{"error": "Access Denied. Authorization token required."}`
  - `401 Unauthorized`: `{"error": "User associated with this session no longer exists."}`

---

## User

### Update Avatar

- **Route**: `POST /api/user/avatar`
- **Description**: Updates the avatar selection key linked to the user profile record.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "avatar": "string (required, e.g., 'avatar_2')"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "avatar": "avatar_2"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Avatar selection is required."}`

---

### Update Profile Settings

- **Route**: `PUT /api/user/profile/settings`
- **Description**: Dynamically updates notification channel permissions, application audio choices, and username handle. Changing username automatically regenerates the waitlist referral code.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "username": "string (optional, format: alphanumeric)",
    "emailMarketing": "boolean (optional)",
    "emailAnnouncements": "boolean (optional)",
    "emailReferrals": "boolean (optional)",
    "soundEffects": "boolean (optional)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile settings updated successfully.",
    "user": {
      "username": "new_pioneer",
      "referralCode": "VEL_NEW_PIONEER",
      "emailMarketing": true,
      "emailAnnouncements": false,
      "emailReferrals": true,
      "soundEffects": true
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "This username is already taken."}`
- **Database Tables Used**: `users`, `audit_logs`

---

## Wallet

### Link Wallet

- **Route**: `POST /api/user/wallet/link`
- **Description**: Associates a decentralized Web3 wallet address with the user waitlist profile. Award +300 points and activates the "Web3 Explorer" badge on first-time linking.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "walletAddress": "string (required, e.g., EVM '0x123...abc')",
    "walletType": "string (required, 'metamask' | 'coinbase' | 'walletconnect' | 'phantom')"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "walletType": "metamask",
    "pointsAdded": 300,
    "user": {
      "points": 550,
      "badges": ["Early Pioneer", "Web3 Explorer"]
    }
  }
  ```
- **Database Tables Used**: `users`, `notifications`, `audit_logs`

---

## Two-Factor Authentication (2FA)

### Generate 2FA Secret

- **Route**: `POST /api/user/2fa/generate`
- **Description**: Generates a cryptographically strong, 16-character base32 temporary TOTP secret, constructs the URI, and returns a high-contrast dynamic QR Code URL.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "secret": "ABCDEFGH12345678",
    "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth%3A%2F%2Ftotp%2FVelora%3Auser%40velora.io%3Fsecret%3DABCDEFGH12345678%26issuer%3DVelora",
    "otpauthUrl": "otpauth://totp/Velora:user@velora.io?secret=ABCDEFGH12345678&issuer=Velora"
  }
  ```
- **Database Tables Used**: `users`

---

### Verify & Enable 2FA

- **Route**: `POST /api/user/2fa/verify`
- **Description**: Validates the 6-digit verification code from the user's authenticator app against the temporary secret generated previously. If successful, activates permanent 2FA status.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "code": "string (required, 6-digit code)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Two-Factor Authentication is now active."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Invalid authenticator code. Must be 6 digits."}`
  - `400 Bad Request`: `{"error": "2FA setup session not started. Please generate secret first."}`
- **Database Tables Used**: `users`, `notifications`, `audit_logs`

---

### Disable 2FA

- **Route**: `POST /api/user/2fa/disable`
- **Description**: Deactivates Two-Factor Authentication for the user account. Requires explicit account password confirmation.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "password": "string (required)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Two-Factor Authentication disabled."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Account password required to disable 2FA."}`
  - `401 Unauthorized`: `{"error": "Incorrect password. Authorization failed."}`
- **Database Tables Used**: `users`, `notifications`, `audit_logs`

---

## KYC (Know Your Customer)

### Initiate KYC

- **Route**: `POST /api/user/kyc/start`
- **Description**: Submits the user's full name, identity document type, and identification number for verification. Changes user KYC status to `pending` for administrator review.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "fullName": "string (required)",
    "documentType": "string (required, e.g., 'passport', 'id_card', 'drivers_license')",
    "documentNumber": "string (required)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "kycStatus": "pending"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Missing required KYC documents."}`
- **Database Tables Used**: `users`, `notifications`, `audit_logs`

---

## Points & Rewards

### Daily Check-In

- **Route**: `POST /api/user/checkin`
- **Description**: Logs a daily check-in event. Builds progressive check-in streaks (up to 7 days) and adds +50 base points plus streak bonus (+10 per consecutive day), scaled by the active platform multiplier. Activates the "Streak Champion" badge on day 7.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "pointsAdded": 90,
    "streak": 4,
    "newPoints": 640
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "You have already completed your synergy check-in today."}`
- **Database Tables Used**: `users`, `notifications`, `audit_logs`

---

### Claim Waitlist Rewards

- **Route**: `POST /api/user/rewards/claim`
- **Description**: Processes a claim to convert accumulated waitlist points into on-chain `VLR` reward tokens. Requires a linked Web3 wallet, verified KYC status, and sufficient points balance. Generates a mock hexadecimal transaction hash and dispatches transactional confirmation receipt emails.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "amount": "number (required, positive integer)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "txnHash": "0x5f87b8ea278f6a7cf3329f8c6eb56b107acb9d5642a8a860b73c914d9cf4bb1a",
    "newPoints": 140
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Invalid claim amount specified."}`
  - `400 Bad Request`: `{"error": "Insufficient waitlist points balance."}`
  - `400 Bad Request`: `{"error": "Web3 wallet address is required to process tokens claims."}`
  - `403 Forbidden`: `{"error": "KYC verified identity status required to claim Web3 tokens."}`
- **Database Tables Used**: `users`, `reward_claims`, `notifications`, `audit_logs`

---

## Tasks

### Get Tasks

- **Route**: `GET /api/tasks`
- **Description**: Lists all waitlist tasks available in the ecosystem, annotated with completion status for the authenticated user.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "1",
      "title": "Verify Twitter Follow",
      "description": "Follow us on Twitter to stay updated.",
      "points": 200,
      "type": "twitter",
      "link": "https://twitter.com/velora_io",
      "completed": true
    },
    {
      "id": "2",
      "title": "Link Decentralized Wallet",
      "description": "Connect your Web3 pioneer wallet address.",
      "points": 300,
      "type": "wallet",
      "link": "",
      "completed": false
    }
  ]
  ```
- **Database Tables Used**: `tasks`, `user_tasks`

---

### Claim Task Reward

- **Route**: `POST /api/tasks/:id/claim`
- **Description**: Claims points for completing a specific cognitive task. Prevents double-claiming by checking completion tables, computes points multiplied by active system multipliers, adds points to balance, and dispatches notifications.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **URL Parameters**:
  - `id`: "number (required, primary task ID)"
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task successfully completed and verified.",
    "pointsAdded": 200,
    "newPoints": 1200
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "This cognitive task has already been completed."}`
  - `404 Not Found`: `{"error": "Required task record not found."}`
- **Database Tables Used**: `tasks`, `user_tasks`, `users`, `notifications`, `audit_logs`

---

## Notifications

### Get Notifications

- **Route**: `GET /api/notifications`
- **Description**: Retrieves a chronological feed of notifications, alerts, achievement unlock announcements, and reward confirmation logs for the user.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 4,
      "userId": 1,
      "title": "Direct Referral Registered! 🚀",
      "message": "@pioneer2 registered using your referral code. Earned +250 points!",
      "type": "success",
      "read": false,
      "createdAt": "2026-06-27T12:15:00.000Z"
    }
  ]
  ```
- **Database Tables Used**: `notifications`

---

### Mark All Read

- **Route**: `POST /api/notifications/read-all`
- **Description**: Marks all notifications of the authenticated user as read.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true
  }
  ```
- **Database Tables Used**: `notifications`

---

### Mark Single Notification Read

- **Route**: `POST /api/notifications/:id/read`
- **Description**: Marks a specific notification as read, ensuring it belongs to the active user.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **URL Parameters**:
  - `id`: "number (required, notification record ID)"
- **Success Response (200 OK)**:
  ```json
  {
    "success": true
  }
  ```
- **Database Tables Used**: `notifications`

---

## Telegram Integration

### Telegram Announcements Feed

- **Route**: `GET /api/telegram/feed`
- **Description**: Returns a mock streaming feed of live announcements from the Velora bot, containing system statistics, signup updates, and linked Web3 community indicators.
- **Authentication Required**: No
- **Required Role**: Guest
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "tg_1719488100000_254",
      "sender": "Ecosystem Bot",
      "message": "🆕 Waitlist Signup: @pioneer entered the arena! Verified referrals boost priority status.",
      "timestamp": "2026-06-27T12:15:00.000Z"
    }
  ]
  ```

---

### Telegram Bot Webhook

- **Route**: `POST /api/telegram/webhook`
- **Description**: Handles incoming updates simulated from the Telegram Bot API. Integrates command endpoints `/start` and `/status` to return ecosystem stats, Pioneer rankings, and bot greetings.
- **Authentication Required**: No
- **Required Role**: Guest
- **Request Body Schema**:
  ```json
  {
    "update_id": 1234567,
    "message": {
      "message_id": 9876,
      "from": {
        "id": 999999,
        "is_bot": false,
        "first_name": "Pioneer",
        "username": "velora_pioneer"
      },
      "text": "/status"
    }
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "reply": "📊 *Velora System Live Status*:\n\n🚀 Active Pioneers: 242\n🎯 Global tasks: 12\n✨ Multiplier: x1.0"
  }
  ```

---

### Simulate Telegram Community Join

- **Route**: `POST /api/telegram/simulate-join`
- **Description**: Simulates verify validation for joining the official Velora announcement channel or community chat group. Associates the Telegram handle, updates user indicators, and awards +150 points for each link event.
- **Authentication Required**: Yes
- **Required Role**: User / Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "telegramUsername": "string (required, e.g. '@pioneer')",
    "channelType": "string (required, 'channel' | 'community')"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "pointsAdded": 150,
    "user": {
      "points": 450,
      "joinedTelegramChannel": true,
      "joinedTelegramCommunity": false
    }
  }
  ```
- **Database Tables Used**: `users`, `notifications`, `audit_logs`

---

## Gemini AI Gateway

### Gemini Content Generation

- **Route**: `POST /api/gemini/generate`
- **Description**: Serves as a secure backend API gateway proxying requests to the Google Gemini API (model `gemini-3.5-flash`). Accesses the Google GenAI SDK server-side to hide the API key, enforcing customized prompt parameters, temperature, system instruction sheets, and structured JSON output modes.
- **Authentication Required**: No
- **Required Role**: Guest
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "prompt": "string (required, user query)",
    "systemInstruction": "string (optional, formatting instructions)",
    "temperature": "number (optional, float)",
    "model": "string (optional, defaults to 'gemini-3.5-flash')",
    "responseMimeType": "string (optional, e.g., 'application/json')",
    "responseSchema": "object (optional, JSON Schema for structured generation)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "text": "Generated cognitive analysis text..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Prompt is required"}`
  - `500 Internal Server Error`: `{"error": "Error generating content"}`
- **Security Notes**: This endpoint is highly secure as the `GEMINI_API_KEY` environment variable is fully hidden and isolated within server execution boundaries.

---

## Site Settings

### Get System Settings

- **Route**: `GET /api/settings`
- **Description**: Retrieves public settings, social media handles, waitlist metrics, launch dates, and platform points multipliers.
- **Authentication Required**: No
- **Required Role**: Guest
- **Success Response (200 OK)**:
  ```json
  {
    "id": 1,
    "appName": "Velora Waitlist",
    "telegramChannelLink": "https://t.me/velorachannel",
    "telegramGroupLink": "https://t.me/veloracommunity",
    "telegramBotUsername": "VeloraWaitlistBot",
    "formspreeId": "form_id",
    "launchDate": "2026-09-01T00:00:00.000Z",
    "maintenanceMode": false,
    "pointMultiplier": "1.00",
    "updatedAt": "2026-06-27T12:15:00.000Z"
  }
  ```

---

## Admin Panel

*Note: All endpoints under this section require valid JWT verification where the authenticated user profile has the field `role` set to `'admin'`.*

### Update System Settings

- **Route**: `PUT /api/admin/settings`
- **Description**: Modifies global application parameters, active multipliers, maintenance gates, and contact keys. Logs administrative audits.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **Request Body Schema**:
  ```json
  {
    "appName": "string (optional)",
    "telegramChannelLink": "string (optional)",
    "telegramGroupLink": "string (optional)",
    "telegramBotUsername": "string (optional)",
    "formspreeId": "string (optional)",
    "launchDate": "string (optional, format: date-time)",
    "maintenanceMode": "boolean (optional)",
    "pointMultiplier": "number (optional)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "settings": {
      "appName": "Velora",
      "telegramChannelLink": "https://t.me/velorachannel",
      "pointMultiplier": "1.50"
    }
  }
  ```

---

### Create Waitlist Task

- **Route**: `POST /api/admin/tasks`
- **Description**: Creates a new waitlist gamification task.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **Request Body Schema**:
  ```json
  {
    "title": "string (required)",
    "description": "string (optional)",
    "points": "number (optional, defaults to 100)",
    "type": "string (required, e.g. 'twitter', 'telegram', 'wallet')",
    "link": "string (optional)"
  }
  ```
- **Success Response (210 Created)**:
  ```json
  {
    "success": true,
    "task": {
      "id": 3,
      "title": "Subscribe YouTube Channel",
      "description": "Watch introduction video",
      "points": 150,
      "type": "youtube",
      "link": "https://youtube.com/velora"
    }
  }
  ```

---

### Update Waitlist Task

- **Route**: `PUT /api/admin/tasks/:id`
- **Description**: Updates fields of an existing task.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **URL Parameters**:
  - `id`: "number (required, task record ID)"
- **Request Body Schema**: See `POST /api/admin/tasks` (all fields optional).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "task": {
      "id": 3,
      "title": "Subscribe YouTube Channel Premium",
      "points": 200
    }
  }
  ```

---

### Delete Waitlist Task

- **Route**: `DELETE /api/admin/tasks/:id`
- **Description**: Permanently removes a task from database records.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **URL Parameters**:
  - `id`: "number (required, task record ID)"
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task successfully deleted."
  }
  ```

---

### Broadcast Push Notifications

- **Route**: `POST /api/admin/broadcast`
- **Description**: Dispatches customized database push notification alerts to every active waitlist user account in the system.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **Request Body Schema**:
  ```json
  {
    "title": "string (required)",
    "message": "string (required)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 242
  }
  ```

---

### Analytics Dashboard

- **Route**: `GET /api/admin/analytics`
- **Description**: Compiles comprehensive stats, registration metrics, KYC volume, referral counts, transactional logs, audit trails, and email dispatcher tracking.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **Success Response (200 OK)**:
  ```json
  {
    "stats": {
      "totalUsers": 242,
      "activeUsers": 194,
      "waitlistCount": 241,
      "telegramConversions": 150,
      "referralConversions": 98
    },
    "signupsOverTime": [
      { "date": "Jun 21", "count": 12 },
      { "date": "Jun 27", "count": 30 }
    ],
    "auditLogs": [
      {
        "id": "1",
        "action": "KYC Approved",
        "details": "Approved user pioneer KYC credentials.",
        "timestamp": "2026-06-27T12:15:00.000Z"
      }
    ],
    "userSummary": [
      {
        "id": "2",
        "username": "pioneer",
        "email": "pioneer@velora.io",
        "points": 1200,
        "referralsCount": 4,
        "verified": true,
        "dailyStreak": 3,
        "telegramUsername": "pioneer_tg",
        "role": "user",
        "createdAt": "2026-06-27T12:15:00.000Z",
        "walletAddress": "0x123...",
        "kycStatus": "verified"
      }
    ],
    "sentEmails": []
  }
  ```

---

### Sent Emails Log

- **Route**: `GET /api/admin/sent-emails`
- **Description**: Retrieves transactional dispatch history for all emails processed via Resend on the platform.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "em_93012",
      "to": "pioneer@velora.io",
      "subject": "🔑 Authorize your Velora Pioneer account",
      "timestamp": "2026-06-27T12:15:00.000Z"
    }
  ]
  ```

---

### Email Campaign dispatcher

- **Route**: `POST /api/admin/email-campaign`
- **Description**: Broadcasts customized styled marketing campaigns to all signed-up users who have announcements notifications enabled.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **Request Body Schema**:
  ```json
  {
    "subject": "string (required)",
    "title": "string (required)",
    "body": "string (required, supporting HTML markup)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "sentCount": 182
  }
  ```

---

### Approve KYC Audit

- **Route**: `POST /api/admin/kyc/approve/:userId`
- **Description**: Formally approves a user's pending identity documents. Awards +500 waitlist priority points, activates the "Verified Citizen" badge, and dispatches dynamic approval email templates.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **URL Parameters**:
  - `userId`: "number (required, user record ID)"
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "kycStatus": "verified"
  }
  ```

---

### Reject KYC Audit

- **Route**: `POST /api/admin/kyc/reject/:userId`
- **Description**: Rejects a user's uploaded identity documentation. Resets KYC status to `not_started`, dispatches feedback alerts, and triggers informational emails.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **URL Parameters**:
  - `userId`: "number (required, user record ID)"
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "kycStatus": "not_started"
  }
  ```

---

### Ban User Account

- **Route**: `POST /api/admin/users/ban/:userId`
- **Description**: Suspends a user account from waitlist platform activities. Soft deletes record by updating `isDeleted` and `deletedAt`.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **URL Parameters**:
  - `userId`: "number (required, user record ID)"
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User @pioneer was successfully suspended from the platform."
  }
  ```

---

### Unban User Account

- **Route**: `POST /api/admin/users/unban/:userId`
- **Description**: Restores a previously suspended user account, re-enabling access.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **URL Parameters**:
  - `userId`: "number (required, user record ID)"
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User account was successfully restored."
  }
  ```

---

### Export Users CSV

- **Route**: `GET /api/admin/export/users`
- **Description**: Streams a flat text/csv data sheet containing full database records of users.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK - CSV Attachment)**:
  - **Headers**: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="velora_users_export.csv"`
  - **Payload**:
    ```csv
    ID,Username,Email,Points,Referrals,Verified,Streak,Wallet,KYC_Status,CreatedAt
    1,"velora_architect","admin@velora.io",5000,15,true,4,"0xabc...","verified",2026-06-27T12:15:00.000Z
    ```

---

### Export Referrals CSV

- **Route**: `GET /api/admin/export/referrals`
- **Description**: Streams a complete multi-tier network breakdown of referral codes, parents, direct children counts, and associated reward points.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **Success Response (200 OK - CSV Attachment)**:
  - **Headers**: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="velora_referrals_export.csv"`
  - **Payload**:
    ```csv
    ID,Pioneer,ReferredBy,DirectInvitesCount,Points
    2,"pioneer","velora_architect",4,1200
    ```

---

### Export Waitlist Leaderboard CSV

- **Route**: `GET /api/admin/export/waitlist`
- **Description**: Streams a sorted scoreboard list of signed-up pioneers ordered by waitlist points balance. Useful for computing ranks.
- **Authentication Required**: Yes
- **Required Role**: Admin
- **Success Response (200 OK - CSV Attachment)**:
  - **Headers**: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="velora_waitlist_ranks.csv"`
  - **Payload**:
    ```csv
    Rank,Username,Email,Points,Verified,WalletSynced
    1,"velora_architect","admin@velora.io",5000,true,YES
    2,"pioneer","pioneer@velora.io",1200,true,YES
    ```
