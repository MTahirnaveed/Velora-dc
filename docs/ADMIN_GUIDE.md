# Velora Administrator Operations Guide

This manual is written for platform administrators and operations managers using the Velora admin dashboard. It details system configurations, user management, KYC review pipelines, and CSV exports.

---

## 1. Administrative Workspace Overview

The Admin Dashboard provides full visibility into platform health, user signups, and waitlist activity:

```
+-----------------------------------------------------------------------+
|                           ADMIN DASHBOARD                             |
+-------------------+--------------------+------------------------------+
|   TOTAL SIGNUPS   |  VERIFIED USERS    |     CLAIMED VLR TOKENS       |
|       14,812      |   12,410 (83%)     |         1,250,000            |
+-------------------+--------------------+------------------------------+
|                                                                       |
|   Signup Trends Chart [Recharts]                                      |
|   (Daily registration rates, KYC submissions, wallet connections)     |
|                                                                       |
+-----------------------------------------------------------------------+
```

* **Access Control**: Limited strictly to users with `role = 'admin'`. Non-admins attempting to access admin views or API routes are blocked by the `checkRole('admin')` middleware and receive a `403 Forbidden` response.

---

## 2. Real-Time Analytics & KPIs

The admin dashboard aggregates metrics directly from database tables:

* **Pioneer Registrations**: Tracks total signups and daily growth trends.
* **KYC Status Distribution**: Displays verification rates (Not Started, Pending, Verified).
* **Task Completion Distribution**: Shows which tasks are completed most frequently (e.g., wallet links vs. social checks).
* **Referral Network Volume**: Visualizes viral loops and Level 1/2/3 referral point distribution.

---

## 3. User Management & Auditing

Administrators can audit and modify user profiles:

* **User Search**: Filter user directories by username, email, wallet address, or UID.
* **Point Adjustments**: Manually adjust user points to resolve disputes or award special bonuses.
* **Suspensions & Bans**: Suspend users for violating terms (e.g., self-referrals or botting). Suspended users have `is_deleted = true` set on their database record, blocking authentication immediately.
* **Activity Audit Logs**: Inspect user-specific events (e.g. login timestamps, wallet links, MFA toggles).

---

## 4. Settings & Feature Toggles

The Settings tab lets admins modify global configurations on the `system_settings` table:

* **Platform Name**: Update the application name dynamically across the UI.
* **Community Social Links**: Configure Telegram announcements, community chat, and Telegram Bot usernames.
* **Global Point Multiplier**: Apply a multiplier (e.g., `x1.5` or `x2.0`) to reward points dynamically during promotional campaigns.
* **Maintenance Mode Toggle**: Instantly lock the public portal and display a stylized maintenance screen, restricting access to administrators for updates.

---

## 5. KYC Review & Verification Pipeline

Velora contains a dedicated KYC review pipeline for manual identity verification:

```
[User Submits KYC Details] -> Sets kycStatus = 'pending'
                                     |
                                     v
                       [Admin Reviews Submission]
                              /              \
                          (Approve)        (Reject)
                            /                  \
              Sets kycStatus = 'verified'     Sets kycStatus = 'not_started'
              Awards +500 KYC Points          Dispatches Rejection Email
              Awards "Verified Citizen" Badge
              Unlocks Web3 Token Claims
```

Admins can approve or reject pending KYC submissions from the Admin panel:
* **Approved**: Upgrades `kycStatus` to `'verified'`, awards the user **+500 points**, unlocks Web3 token claims, unlocks the "Verified Citizen" badge, and dispatches a confirmation email.
* **Rejected**: Resets `kycStatus` to `'not_started'`, allowing the user to correct details and resubmit, and dispatches a rejection email.

---

## 6. Global Broadcasts & Newsletters

* **In-App Broadcasts**: Send rich, system-wide announcements to all waitlist participants. These are written to the `notifications` table and rendered on user dashboards in real-time.
* **Email Campaigns**: Dispatch formatted newsletter templates to all opted-in waitlist users via the Resend SMTP integration.

---

## 7. Data Extraction & CSV Exports

Admins can export platform data directly to CSV files for marketing, security, or compliance reviews:

1. **User Directories**: Downloads the complete user registry (excluding sensitive password hashes), including email addresses, points, and referral metrics.
2. **Rankings Ledger**: Exports waitlist positions, registration timestamps, and verification states.
3. **Referral Graphs**: Exports invite mappings, illustrating referral connections across Levels 1, 2, and 3.
