# Velora System Architecture & Component Mapping

This document provides a technical breakdown of Velora's high-level system design, data flows, client components, and server structures.

---

## 1. High-Level System Architecture

Velora is built on a full-stack Node.js runtime, combining a React Single Page Application (SPA) frontend with an Express API backend. Data persistence is managed using PostgreSQL and Drizzle ORM.

```
       +--------------------------------------------------------+
       |                  CLIENT ENVIRONMENT                    |
       |  +-----------------+  +-----------------------------+  |
       |  |  React SPA App  |  | Local Storage (Session JWT) |  |
       |  +--------+--------+  +--------------+--------------+  |
       +-----------|--------------------------|-----------------+
                   | HTTP Requests            | Extracts Token
                   v                          v
       +--------------------------------------------------------+
       |                  ROUTING & MIDDLEWARE                  |
       |  +--------------------------------------------------+  |
       |  |                 Express Router                   |  |
       |  +------------------------+-------------------------+  |
       |                           |                            |
       |            +--------------v--------------+             |
       |            |   authenticateToken()       |             |
       |            |   (Verifies JWT & Sessions) |             |
       |            +--------------+--------------+             |
       +---------------------------|----------------------------+
                                   v
       +--------------------------------------------------------+
       |                 CONTROLLERS & SERVICES                 |
       |  +-----------------+  +------------------+  +-------+  |
       |  | Auth Controller |  | Task Controller  |  |  AI   |  |
       |  +--------+--------+  +--------+---------+  |Gateway|  |
       |           |                    |            +---+---+  |
       +-----------|--------------------|----------------|------+
                   v                    v                |
       +------------------------------------------+      |
       |            PERSISTENCE LAYER             |      | (Calls SDK)
       |  +------------------------------------+  |      v
       |  |            Drizzle ORM             |  |  +-------+
       |  +-----------------+------------------+  |  |Google |
       |                    |                     |  |Gemini |
       |                    v                     |  |  AI   |
       |  +-----------------+------------------+  |  +-------+
       |  |           PostgreSQL               |  |
       |  +------------------------------------+  |
       +------------------------------------------+
```

---

## 2. Frontend Component & View Mapping

The React frontend (`src/App.tsx`) is structured as a responsive Single Page Application utilizing a layout wrapper, responsive side navigation, and dynamic view components:

* **Authentication Wrapper**: Controls view access based on login state. If no valid JWT is present, the app renders the Guest landing page and login modals. If logged in, it mounts the core dashboard views.
* **Layout Grid**: Features a responsive sidebar navigation panel and a main glassmorphic display stage.
* **Dashboard Panel**: Displays user statistics (points, waitlist rank, referral count), consecutive check-in streak indicators, and active push notifications.
* **Tasks Section**: Lists active, completed, and pending challenges (social tasks, wallet connections, daily check-ins) in a grid layout.
* **Referrals Section**: Contains the user's custom referral code, invite links, and an interactive ledger detailing Level 1, 2, and 3 referral signups and awarded points.
* **Admin Section**: Restricted to administrators, this panel displays global analytics charts, user directories, system setting toggles, KYC review pipelines, and email campaign editors.

---

## 3. Backend Route & Middleware Mapping

The backend server (`server.ts`) is organized into dedicated route handlers protected by security middlewares:

### Core Middleware
* `authenticateToken(req, res, next)`: Extracts the Bearer JWT token from the `Authorization` header, decrypts it using `JWT_SECRET`, verifies the session in the database, and appends the decoded user payload to `req.user`.
* `checkRole(role)`: Validates that the authenticated user possesses the required access role (e.g. `admin`) before permitting access to administrative routes.

### REST API Endpoints
* **Authentication**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/verify-email`.
* **Tasks & Streaks**: `/api/tasks`, `/api/tasks/:id/claim`, `/api/tasks/check-in`.
* **KYC & Wallets**: `/api/user/kyc/submit`, `/api/user/wallet/link`, `/api/user/rewards/claim`.
* **Administrative Operations**: `/api/admin/analytics`, `/api/admin/users`, `/api/admin/settings`, `/api/admin/kyc/review`, `/api/admin/broadcast`.

---

## 4. Sequence Diagrams

### Daily Check-in Sequence

```
[Client]                [Express Server]             [PostgreSQL Database]
   |                           |                               |
   |-- POST /tasks/check-in -->|                               |
   |   (Bearer Access JWT)     |-- Fetch user record --------->|
   |                           |<- Return user entity ---------|
   |                           |                               |
   |                           |-- Perform streak math --------|
   |                           |   (Streak increments or resets|
   |                           |    and multiplies points)     |
   |                           |                               |
   |                           |-- Update user row & logs ---->|
   |                           |<- Return updated user --------|
   |                           |                               |
   |<- Return updated user ----|                               |
   |   and point values        |                               |
```

### Multi-Tier Referral Distribution Sequence

```
[Client (Referee)]      [Express Server]             [PostgreSQL Database]
   |                           |                               |
   |-- POST /auth/register --->|                               |
   |   (Referral Code: VEL_A)  |-- Find referrer (Level 1) ---->|
   |                           |<- Return Level 1 referrer ----|
   |                           |                               |
   |                           |-- Allocate +250 points to L1-->|
   |                           |                               |
   |                           |-- Find L1's referrer (L2) ---->|
   |                           |<- Return Level 2 referrer ----|
   |                           |                               |
   |                           |-- Allocate +100 points to L2-->|
   |                           |                               |
   |                           |-- Find L2's referrer (L3) ---->|
   |                           |<- Return Level 3 referrer ----|
   |                           |                               |
   |                           |-- Allocate +50 points to L3 -->|
   |                           |                               |
   |                           |-- Write new user record ------>|
   |                           |<- Confirm transaction --------|
   |                           |                               |
   |<- Return 201 Created -----|                               |
```
