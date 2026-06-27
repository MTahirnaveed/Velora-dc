# Velora Database Schema & ER Diagram Manual

This guide describes the complete relational database architecture of the Velora platform. It details all 14 active tables, their types, defaults, indices, relationships, migrations, and transactional configurations.

---

## 1. Entity-Relationship ASCII Representation

Below is the logical mapping of tables and active connections within the PostgreSQL database:

```
                  +-----------------------+
                  |         USERS         |<-------------------+
                  +-----------------------+                    |
                  | id (PK) [Serial]      |                    |
                  | uid [Text, Unique]    |                    |
                  | email [Text, Unique]  |                    |
                  +-----------------------+                    |
                   |       |   |   |   |                       |
    +--------------+       |   |   |   +----------+            |
    | (1-to-1)             |   |   | (1-to-Many)  |            |
    v                      |   |   |              v            |
+--------------+           |   |   |         +-----------+     |
|   PROFILES   |           |   |   |         | SESSIONS  |     |
+--------------+           |   |   |         +-----------+     |
| id (PK)      |           |   |   |         | id (PK)   |     |
| user_id (FK) |           |   |   |         | user_id   |     |
+--------------+           |   |   |         +-----------+     |
                           |   |   |                           |
            +--------------+   |   +--------------+            |
            | (1-to-Many)      |                  | (1-to-Many)|
            v                  v                  v            v
      +-----------+      +-----------+      +-----------+  +-----------+
      | REFERRALS |      | REWARDS   |      |USER_TASKS |  |ACHIEVEM'TS|
      +-----------+      +-----------+      +-----------+  +-----------+
      | id (PK)   |      | id (PK)   |      | id (PK)   |  | id (PK)   |
      | referrer  |      | user_id   |      | user_id   |  | user_id   |
      | referee   |      +-----------+      | task_id   |  +-----------+
      +-----------+                         +-----------+
                                                  |
                                                  | (Many-to-1)
                                                  v
                                            +-----------+
                                            |   TASKS   |
                                            +-----------+
                                            | id (PK)   |
                                            +-----------+
```

---

## 2. Exhaustive Table Specifications

### 1. `users` Table
Stores primary user identity, login status, point metrics, streak indicators, and profile settings.

| Column | PG Data Type | Nullability | Default / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `serial` | NOT NULL | PRIMARY KEY | Primary incremental identifier |
| `uid` | `text` | NOT NULL | UNIQUE | Firebase Auth UID |
| `email` | `text` | NOT NULL | UNIQUE | Primary email address |
| `username` | `text` | NULL | UNIQUE | Selected user profile handle |
| `points` | `integer` | NOT NULL | `0` | Cumulative waitlist points ledger |
| `referrals_count` | `integer` | NOT NULL | `0` | Count of verified referrals made |
| `referred_by` | `text` | NULL | None | Username of the referrer user |
| `referral_code` | `text` | NULL | UNIQUE | Unique referral code for invites |
| `verified` | `boolean` | NOT NULL | `false` | True if email validation completed |
| `verification_code`| `text` | NULL | None | Active 6-digit confirmation code |
| `daily_streak` | `integer` | NOT NULL | `0` | Days checked-in consecutively |
| `last_check_in` | `timestamp` | NULL | None | Timestamp of last standard check-in |
| `avatar` | `text` | NOT NULL | `'preset_1'` | ID of visual profile avatar |
| `role` | `text` | NOT NULL | `'user'` | `'user'` or `'admin'` access tier |
| `badges` | `jsonb` | NOT NULL | `'[]'` | JSON list of unlocked badges |
| `telegram_id` | `text` | NULL | None | Connected Telegram user ID |
| `telegram_username`| `text` | NULL | None | Connected Telegram user handle |
| `joined_telegram_channel`| `boolean`| NOT NULL | `false` | Checked state of Telegram channel join |
| `joined_telegram_community`| `boolean`| NOT NULL | `false` | Checked state of Telegram group join |
| `failed_login_attempts`| `integer`| NOT NULL | `0` | Login failure tracker for lockouts |
| `locked_until` | `timestamp` | NULL | None | Duration timestamp of lockout |
| `needs_password_change`| `boolean`| NOT NULL | `false` | Admin flag to enforce password resets |
| `two_factor_enabled`| `boolean` | NOT NULL | `false` | True if authenticator TOTP is on |
| `two_factor_secret`| `text` | NULL | None | Permanent vault secret (base32) |
| `two_factor_temp_secret`| `text` | NULL | None | Temporary secret during setup |
| `password_hash` | `text` | NULL | None | Salted Bcrypt password representation |
| `wallet_address` | `text` | NULL | None | Linked EVM/Phantom wallet string |
| `wallet_type` | `text` | NULL | None | `'metamask'`, `'coinbase'`, etc. |
| `kyc_status` | `text` | NOT NULL | `'not_started'`| `'not_started'`,`'pending'`,`'verified'`|
| `email_marketing` | `boolean` | NOT NULL | `true` | Notification preference opt-in |
| `email_announcements`| `boolean`| NOT NULL | `true` | Notification preference opt-in |
| `email_referrals` | `boolean` | NOT NULL | `true` | Notification preference opt-in |
| `sound_effects` | `boolean` | NOT NULL | `true` | Client-side audio preference |
| `is_deleted` | `boolean` | NOT NULL | `false` | Soft-deletion flag |
| `deleted_at` | `timestamp` | NULL | None | Timestamp of soft-deletion action |
| `created_at` | `timestamp` | NOT NULL | `now()` | Account creation timestamp |
| `updated_at` | `timestamp` | NOT NULL | `now()` | Last modification timestamp |

### 2. `profiles` Table
Stores extended biography metadata in a strict 1-to-1 relationship with the primary user.

* **Primary Key**: `id` (`serial`)
* **Foreign Keys**: `user_id` -> `users.id` with `onDelete: 'cascade'`, unique constraint.
* **Columns**:
  * `bio` (`text`, nullable)
  * `full_name` (`text`, nullable)
  * `updated_at` (`timestamp`, default `now()`)

### 3. `referrals` Table
Maintains the recursive referral trees across three tiers of invitations.

* **Primary Key**: `id` (`serial`)
* **Foreign Keys**:
  * `referrer_id` -> `users.id` with `onDelete: 'cascade'`
  * `referee_id` -> `users.id` with `onDelete: 'cascade'`, unique constraint.
* **Columns**:
  * `points_awarded` (`integer`, default `0`)
  * `level` (`integer`, default `1`) - Identifies invitation tier relative to referrer.
  * `created_at` (`timestamp`, default `now()`)

### 4. `referral_rewards` Table
Maintains transaction logs tracking referral point allocations.

* **Primary Key**: `id` (`serial`)
* **Foreign Key**: `user_id` -> `users.id` with `onDelete: 'cascade'`
* **Columns**:
  * `from_username` (`text`, not null) - Username of user whose signup triggered the reward.
  * `level` (`integer`, not null) - Level of invitation tree (1, 2, or 3).
  * `points` (`integer`, not null) - Absolute points added to the account.
  * `timestamp` (`timestamp`, default `now()`)

### 5. `tasks` Table
Catalogs the available challenges, standard rewards, types, and links.

* **Primary Key**: `id` (`serial`)
* **Columns**:
  * `title` (`text`, not null)
  * `description` (`text`, nullable)
  * `points` (`integer`, default `0`)
  * `type` (`text`, not null) - `'daily'`, `'social'`, `'telegram'`, `'twitter'`, or `'website'`.
  * `link` (`text`, nullable)
  * `is_deleted` (`boolean`, default `false`)
  * `deleted_at` (`timestamp`, nullable)
  * `created_at` (`timestamp`, default `now()`)
  * `updated_at` (`timestamp`, default `now()`)

### 6. `user_tasks` Table
Logs standard waitlist tasks completed by users.

* **Primary Key**: `id` (`serial`)
* **Foreign Keys**:
  * `user_id` -> `users.id` with `onDelete: 'cascade'`
  * `task_id` -> `tasks.id` with `onDelete: 'cascade'`
* **Columns**:
  * `claimed_at` (`timestamp`, default `now()`)

### 7. `notifications` Table
Stores push alerts displayed within the in-app notification center.

* **Primary Key**: `id` (`serial`)
* **Foreign Key**: `user_id` -> `users.id` with `onDelete: 'cascade'`
* **Columns**:
  * `title` (`text`, not null)
  * `message` (`text`, not null)
  * `type` (`text`, default `'info'`) - `'info'`, `'success'`, `'alert'`, or `'announcement'`.
  * `is_read` (`boolean`, default `false`)
  * `created_at` (`timestamp`, default `now()`)

### 8. `system_settings` Table
Holds global admin configurations.

* **Primary Key**: `id` (`serial`)
* **Columns**:
  * `app_name` (`text`, default `'Velora'`)
  * `telegram_channel_link` (`text`, default `'https://t.me/VeloraAnnouncements'`)
  * `telegram_group_link` (`text`, default `'https://t.me/VeloraCommunity'`)
  * `telegram_bot_username` (`text`, default `'VeloraBot'`)
  * `formspree_id` (`text`, default `'xpzvlewr'`)
  * `launch_date` (`text`, default `'2026-12-31'`)
  * `maintenance_mode` (`boolean`, default `false`)
  * `point_multiplier` (`doublePrecision`, default `1.0`)
  * `updated_at` (`timestamp`, default `now()`)

### 9. `achievements` Table
Logs gamified badges unlocked by users.

* **Primary Key**: `id` (`serial`)
* **Foreign Key**: `user_id` -> `users.id` with `onDelete: 'cascade'`
* **Columns**:
  * `badge_name` (`text`, not null)
  * `unlocked_at` (`timestamp`, default `now()`)

### 10. `audit_logs` Table
Maintains trace logs of user logins, password modifications, wallet links, and administrative actions.

* **Primary Key**: `id` (`serial`)
* **Foreign Key**: `user_id` -> `users.id` with `onDelete: 'set null'`
* **Columns**:
  * `action` (`text`, not null)
  * `details` (`text`, nullable)
  * `timestamp` (`timestamp`, default `now()`)

### 11. `sessions` Table
Stores JWT refresh tokens for secure long-lived login sessions.

* **Primary Key**: `id` (`serial`)
* **Foreign Key**: `user_id` -> `users.id` with `onDelete: 'cascade'`
* **Columns**:
  * `refresh_token` (`text`, not null)
  * `expires_at` (`timestamp`, not null)
  * `created_at` (`timestamp`, default `now()`)

### 12. `password_reset_tokens` Table
Manages temporary verification tokens for password reset flows.

* **Primary Key**: `id` (`serial`)
* **Columns**:
  * `email` (`text`, not null)
  * `token` (`text`, not null)
  * `expires_at` (`timestamp`, not null)
  * `created_at` (`timestamp`, default `now()`)

### 13. `email_verification_tokens` Table
Manages 6-digit confirmation codes for email verification.

* **Primary Key**: `id` (`serial`)
* **Columns**:
  * `email` (`text`, not null)
  * `code` (`text`, not null)
  * `expires_at` (`timestamp`, not null)
  * `created_at` (`timestamp`, default `now()`)

### 14. `reward_claims` Table
Logs simulated Web3 on-chain transactions converting points to VLR tokens.

* **Primary Key**: `id` (`serial`)
* **Foreign Key**: `user_id` -> `users.id` with `onDelete: 'cascade'`
* **Columns**:
  * `amount_vlr` (`integer`, not null)
  * `txn_hash` (`text`, not null, unique)
  * `status` (`text`, default `'pending'`) - `'pending'` or `'completed'`.
  * `timestamp` (`timestamp`, default `now()`)

---

## 3. Database Connection Pooling

The database connection is initialized via Drizzle ORM in `/src/db/index.ts` utilizing the `pg` driver library.

* **Driver Pool Size**: Set with maximum pool configurations suited for container runtimes, enabling multiple requests to be processed concurrently.
* **Encryption (SSL)**: Enabled dynamically when connection strings contain SSL parameters, ensuring secure encryption of database traffic.
