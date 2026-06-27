# Velora: Premium Web3 Smart Waitlist & Cognitive Task Platform

Velora is an enterprise-grade, high-performance Web3 waitlist, cognitive task verification, and multi-tier referral ecosystem. Built around a modern, secure, full-stack React and Express architecture, Velora provides deep gamification, robust administration interfaces, secure identity verification (KYC), Time-Based Multi-Factor Authentication (MFA/TOTP), and a custom server-side Google Gemini API gateway.

---

## 1. Project Overview

Velora is engineered to solve user acquisition, community building, and participant vetting in a unified, modern web portal. By combining standard user verification with decentralized Web3 wallet integration and a simulated on-chain rewards payout loop, Velora provides a seamless onboarding pipeline for high-value Web3 communities and decentralized protocols.

### Key Objectives
* **User Engagement**: Daily check-ins, achievements tracking, and interactive gamified tasks.
* **Network Viral Growth**: Multi-tier, multi-level referral tracking system rewarding Level 1, Level 2, and Level 3 invites.
* **Ecosystem Integrity**: progressive lockouts, secure email verifications, and custom KYC review portals.
* **Actionable Admin Controls**: Granular user status auditing, real-time analytics dashboard, platform-wide configuration switches, database exports, and a transactional email campaigns logs panel.

---

## 2. Platform Core Features

* **Multi-Tier Referral Engine**: Deep viral loops tracking referred invitees across Level 1 (+250 points), Level 2 (+100 points), and Level 3 (+50 points) networks. Includes strict self-referral checks and complete hierarchy graphs.
* **On-Chain Token Claims Simulation**: Direct conversion of accrued waitlist points into on-chain `VLR` utility tokens. Automatically verifies KYC verified state and active linked EVM/Phantom wallet addresses, generating unique hexadecimal ledger hash codes.
* **Time-Based MFA/TOTP (RFC 6238)**: Cryptographically secure authenticator setup utilizing QR Code URI generations and temporary token verification steps.
* **Email Verification & Reset Loops**: Dynamic 6-digit confirmation cards and password update codes dispatched through the Resend email delivery service.
* **Gamified Achievement Badges**: Automated rewards, streaks trackers, and progress milestones (e.g., "Early Pioneer", "Web3 Explorer", "Streak Champion", "Verified Citizen").
* **Secure Gemini API Gateway**: Proxies LLM prompt validations server-side using the Google GenAI SDK to keep the `GEMINI_API_KEY` hidden from client exposures.
* **Robust Admin Workspace**: Live signups monitoring charts, audit logs lists, bulk system push notifications broadcasters, custom waitlist task creators, KYC reviewers, and email campaign newsletters dispatchers.

---

## 3. Technology Stack

### Frontend Architecture
* **Core Library**: React 18+ (Vite)
* **Design System**: Glassmorphism UI styled via **Tailwind CSS**
* **Icons Library**: Lucide React
* **Data Visualization**: Recharts (Admin charts, signups over time)
* **Animation Engine**: Motion (`motion/react`)

### Backend Architecture
* **Runtime**: Node.js (TypeScript)
* **Server Framework**: Express (using type-safe route controllers and token guards)
* **Database Access**: **Drizzle ORM** (fully parameterized, prepared statements)
* **Database Server**: PostgreSQL
* **Security & Auth**: JWT (Stateless sessions + database refresh tokens tracking), Bcrypt (salted password hashes), TOTP (base32-encoded HMAC-SHA1 tokens)
* **API Integrations**: Google GenAI SDK (Gemini AI), Resend (SMTP/Transactional Mailings)

---

## 4. Documentation Index

To help onboard developers, DevOps architects, QA analysts, and security auditors, we maintain a complete catalog of design, architectural, and operational manuals:

1. **[Installation Guide](INSTALLATION.md)**: Full local environment provisioning, Docker configurations, seeding scripts, and production compilation paths.
2. **[System Architecture](ARCHITECTURE.md)**: High-level architectural diagrams, component relationships, sequence flowcharts, and system data flows.
3. **[Database Schema Guide](DATABASE.md)**: Entity-Relationship representations, table properties, index listings, constraints, and migration strategies.
4. **[Authentication & Security](AUTHENTICATION.md)**: Session lifecycles, JWT scopes, TOTP setups, progressive lockouts, and OWASP hardening vectors.
5. **[Multi-Tier Referrals Engine](REFERRAL_SYSTEM.md)**: Point distribution formulas, recursive graph definitions, invite state machines, and fraud protection rules.
6. **[Gamified Task Tracking](TASK_SYSTEM.md)**: Task types, claim evaluations, completion states, and streak multipliers.
7. **[Admin Panel Operations](ADMIN_GUIDE.md)**: Dashboard metrics, settings controls, audit logging, KYC approvals, and marketing newsletter broadcasts.
8. **[REST API Specifications](API.md)**: Endpoint standards, URLs, content negotiation, pagination rules, error responses, and complete path specs.
9. **[Environment Variables](ENVIRONMENT_VARIABLES.md)**: System secrets, public settings keys, and configuration profiles.
10. **[Coding & Dev Standards](CODING_STANDARDS.md)**: Code formatting rules, React patterns, TypeScript guidelines, and Git version control standards.
11. **[Testing Manual](TESTING.md)**: Unit, integration, manual QA, and performance checklists.
12. **[Outbound Integrations](WEBHOOKS.md)**: Telegram bot webhook simulations and Resend email templates.
13. **[Platform Deployment](DEPLOYMENT.md)**: Cloud Run production guidelines, Docker builds, and CI/CD parameters.
14. **[Contributing Guide](CONTRIBUTING.md)**: Branches structure, Pull Request rules, and review standards.
15. **[Troubleshooting Index](TROUBLESHOOTING.md)**: Common errors, database locks, JWT expires, and build fixes.
16. **[Ecosystem Roadmap](ROADMAP.md)**: Core milestone phases, beta, on-chain tokens launch, and governance setups.
17. **[Ecosystem Changelog](CHANGELOG.md)**: Detailed feature release timeline and version adjustments.

---

## 5. Quick Start Development

```bash
# Install all required packages
npm install

# Build environment configuration (fill in secrets)
cp .env.example .env

# Compile the full application
npm run build

# Start the local development server (Express + Vite)
npm run dev
```

---

## 6. Security & Disclosure Policy

For details on security implementations, risk matrices, and vulnerability disclosures, refer to the **[Security and Hardening Policy](SECURITY.md)**.

---

## 7. License

The Velora Waitlist & Cognitive Platform is proprietary software. All rights reserved. Authorized developer distribution only.
