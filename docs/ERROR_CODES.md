# Velora API Error Code Reference

This document catalogs the standard error response conventions, HTTP status codes, validation structures, and error troubleshooting guides for Velora API developers.

---

## 1. Global Error Response Format

All API errors return a standard JSON envelope with an descriptive error string to allow clean frontend parsing and display.

```json
{
  "error": "Detailed validation, authentication, or operational message explaining the issue."
}
```

---

## 2. HTTP Status Code Catalog

Velora uses standard HTTP status codes to classify the type of failure.

| Code | Status Name | Root Cause / Trigger Conditions |
| :--- | :--- | :--- |
| **400** | Bad Request | Missing required body properties, invalid types, malformed JSON, or failed input validations. |
| **401** | Unauthorized | Bearer token missing, expired, or cryptographically invalid. Also returned on incorrect passwords or invalid 2FA validation attempts. |
| **403** | Forbidden | Token is structurally correct but does not have appropriate permissions (e.g., standard users attempting to reach `/api/admin/*` endpoints, or unverified KYC users attempting to claim Web3 tokens). |
| **404** | Not Found | Requested primary record (user, task, notification) does not exist in the database. |
| **409** | Conflict | Unique database constraint violated (e.g., registering with an email or username that is already taken). |
| **422** | Unprocessable Entity| Syntactically correct payload containing semantic logical issues (e.g., attempting a self-referral or claiming more points than the active balance). |
| **429** | Too Many Requests | Rate limits exceeded for the specified IP or account session. |
| **500** | Internal Server Error| Database connection failure, unhandled runtime crashes, or third-party email/AI API gateway errors. |

---

## 3. Detailed Error Code Reference & Fixes

Below is a troubleshooting lookup table of specific error messages returned by Velora's routing handlers:

### A. Authentication & Registration Errors

- **`"Missing required fields: email, username, password."`**
  - *Trigger*: `POST /api/auth/register` missing one or more JSON fields.
  - *Status*: `400 Bad Request`
  - *Resolution*: Ensure payload is formatted as a JSON object containing keys `email`, `username`, and `password`.

- **`"An account with this email already exists."`**
  - *Trigger*: Email collision during registration.
  - *Status*: `400 Bad Request` (Conflict)
  - *Resolution*: Redirect user to Login or initiate Password Reset.

- **`"This username is already taken."`**
  - *Trigger*: Username collision during registration or profile updates.
  - *Status*: `400 Bad Request` (Conflict)
  - *Resolution*: Suggest username alternatives by appending random numbers.

- **`"Referral Rejected. Self-referrals are strictly prohibited."`**
  - *Trigger*: User entered their own username/referral code during registration.
  - *Status*: `400 Bad Request` (Unprocessable Entity)
  - *Resolution*: Notify the user that they cannot refer themselves. Strip the referral field or prompt for a peer's code.

- **`"Account locked due to repeated failed logins. Please try again in 15 minutes."`**
  - *Trigger*: User triggered 5 failed password attempts consecutively.
  - *Status*: `403 Forbidden`
  - *Resolution*: Temporarily disable login inputs for 15 minutes. Render a countdown timer or suggest requesting a password reset code.

---

### B. Verification & Security Errors

- **`"Invalid authenticator code. Must be 6 digits."`**
  - *Trigger*: Entering non-numeric text, or strings of length other than 6 during TOTP 2FA setup or login.
  - *Status*: `400 Bad Request`
  - *Resolution*: Validate inputs on the client-side to ensure only 6 digits are submitted.

- **`"Incorrect verification code. Access Denied."`**
  - *Trigger*: Submitted email verification code does not match the random token stored on the user's DB record.
  - *Status*: `400 Bad Request` (Unauthorized)
  - *Resolution*: Prompt user to verify the exact 6-digit code sent to their email. Make sure they didn't submit a password reset code by mistake.

- **`"Invalid or expired authorization code."`**
  - *Trigger*: Submitted password reset code was either entered wrong or consumed after its 15-minute expiration window.
  - *Status*: `400 Bad Request`
  - *Resolution*: Request a new password reset email code.

- **`"Invalid token scope for password reset."`**
  - *Trigger*: Requesting admin forced-password changes with standard sessions or mismatched temporary scopes.
  - *Status*: `400 Bad Request`
  - *Resolution*: Complete the proper authentication path to receive the temporary token containing `resetScope: true`.

---

### C. Gamification, Web3, & KYC Errors

- **`"You have already completed your synergy check-in today."`**
  - *Trigger*: Multiple check-in POST calls within the same UTC calendar day.
  - *Status*: `400 Bad Request`
  - *Resolution*: Disable check-in triggers on the UI once the profile response confirms `lastCheckIn` matches today's date.

- **`"This cognitive task has already been completed."`**
  - *Trigger*: Submitting `POST /api/tasks/:id/claim` for an item that already exists in `user_tasks`.
  - *Status*: `400 Bad Request`
  - *Resolution*: Update the task list state on the UI to display "Completed" and hide the claim action.

- **`"Insufficient waitlist points balance."`**
  - *Trigger*: Claiming token amounts greater than the user's current database `points` value.
  - *Status*: `400 Bad Request`
  - *Resolution*: Validate the input amount on the client against `user.points` prior to sending the request.

- **`"Web3 wallet address is required to process tokens claims."`**
  - *Trigger*: Attempting token claims with null or blank wallet addresses.
  - *Status*: `400 Bad Request`
  - *Resolution*: Show a modal instructing the user to link their wallet first via `POST /api/user/wallet/link`.

- **`"KYC verified identity status required to claim Web3 tokens."`**
  - *Trigger*: User attempts token conversions while their `kycStatus` is `not_started`, `pending`, or rejected.
  - *Status*: `403 Forbidden`
  - *Resolution*: Block conversion features for unverified users and redirect them to the identity verification/KYC portal.
