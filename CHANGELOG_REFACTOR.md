# Changelog: Architectural Refactoring

This document describes the comprehensive refactoring performed to transition the Velora smart waitlist platform from a monolithic architecture to a highly modular, decoupled multi-layered structure based on the **Repository-Service-Controller** design pattern.

---

## 1. Package and Dependency Optimization
* **Package Renaming:** Updated the root `package.json` descriptor name from `"react-example"` to `"velora"`.
* **Firebase Decommissioning:** 
  * Completely removed the `firebase-applet-config.json` file.
  * Extirpated `firebase` and `firebase-admin` dependencies from `package.json` to reduce container bundle size and eliminate stale integration layers.
* **Build System Alignment:** Verified and ensured compatibility of the `npm run build`, `npm run dev`, and `npm run start` scripts under Vite + tsx/esbuild node execution models.

## 2. Decoupling Database Persistence (Repositories)
Direct database queries using Drizzle ORM have been cleanly relocated from `queries.ts` to separate single-responsibility repositories inside the `server/repositories/` module directory:
* **`user.repository.ts`**: Manages all user profiles, referral linkages, invite rankings, and credential states.
* **`task.repository.ts`**: Handles global waitlist objectives, user task completions, and verification mappings.
* **`notification.repository.ts`**: Controls user alerts, in-app system messages, and read markers.
* **`settings.repository.ts`**: Manages dynamic waitlist multipliers, maintenance mode switches, and metadata configurations.
* **`claim.repository.ts`**: Tracks Web3 decentralized reward claims and transaction hashes.
* **`audit.repository.ts`**: Audits and persists security actions, logins, and administrative operations.

## 3. Dedicated Utility Decoupling (`server/utils/`)
Utility and simulation helpers have been extracted into isolated modules for reusability:
* **`hash.ts`**: Encapsulates one-way secure password hashing and comparison routines using `bcryptjs`.
* **`jwt.ts`**: Centralizes session and refresh JWT generation with separate configurable secrets.
* **`email.ts`**: Handles HTML document templating for email notifications and coordinates dispatches using the Resend API (with a simulation log fallback).
* **`telegram.ts`**: Maintains the in-memory simulated Telegram feed and coordinates webhook notifications.
* **`milestone.ts`**: Standardizes the rules engine for awarding badges and milestones.

## 4. Middleware Extract (`server/middleware/`)
* **`rateLimiter.ts`**: Implements memory-based sliding window IP-based rate limiting to protect waitlist routes.
* **`auth.ts`**: Exposes the `authenticateToken` JWT guard, verifying claims and attaching the current user payload to requests.

## 5. Clean Separation of Services (`server/services/`)
Core business rules and transactional logic have been migrated from `server.ts` into individual domain services:
* **`AuthService`**: Handles pioneer signup workflows, multi-level referral reward distributions, brute-force lockout timers, secure password changes, and email verifications.
* **`UserService`**: Coordinates profile avatar mutations, Web3 wallet syncs, TOTP 2FA, document KYC verifications, reward claiming, and daily synergy check-ins.
* **`TaskService`**: Manages interactive cognitive tasks, reward calculations, and objectives.
* **`AdminService`**: Compiles administrative statistics, settings updates, user bans, broadcasts, CSV waitlist data compiling, and email newsletter campaigns.
* **`TelegramService`**: Emulates Telegram bots, start commands, system status reports, and group joins.
* **`GeminiService`**: Incorporates Google GenAI SDK wrappers using a lazy-initialized client architecture.

## 6. Request Orchestration (Controllers & Routes)
Controllers act as the entry point for API processing, reading request structures and returning responses with corresponding API status codes:
* **Controllers (`server/controllers/`):** Created `auth.controller.ts`, `user.controller.ts`, `task.controller.ts`, `admin.controller.ts`, `telegram.controller.ts`, and `gemini.controller.ts`.
* **Routes (`server/routes/`):** Defined clear routing blueprints mapping path matches to controllers.
* **Consolidated Server:** Refactored `/server.ts` into an elegant, high-level coordinator that handles startup parameters, public assets (robots, sitemap), health endpoints, and delegates API logic entirely to our modular routing controllers.

---
**Status: SUCCESS**
* TypeScript `tsc --noEmit` validation: **0 errors**
* Bundler build compilation status: **100% Successful**
