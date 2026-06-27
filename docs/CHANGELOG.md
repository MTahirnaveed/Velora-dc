# Velora API Versioning & Changelog

All notable changes to the Velora REST API are documented here. Velora adheres to Semantic Versioning (SemVer) principles.

---

## [1.0.0] - 2026-06-27

### Added
- **PostgreSQL Database Support**: Migrated system from standard in-memory structures to fully parameterized Drizzle ORM PostgreSQL.
- **Dynamic 2FA / TOTP Setup**: Added cryptographic setup generation, authenticator verification codes matching, and account deactivations.
- **Google Gemini API Gateway**: Created a server-side proxy route to securely route content generation queries without exposing backend API keys.
- **Comprehensive API Specifications**: Generated full Markdown manuals, OpenAPI YAML definitions, Postman Collections, and Insomnia workspaces.
- **Account Verification and Lockouts**: Implemented progressive lockout controls (5 failed attempts within 15 minutes) and 6-digit email confirmation loops.
- **Multi-Level Referrals Network**: Added direct and multi-level rewards logic awarding points recursively (Level 1: +250 pts, Level 2: +100 pts, Level 3: +50 pts).
- **Gamified Achievements Feed**: Added daily check-in streaks, progress milestone indicators, and custom badges ("Early Pioneer", "Web3 Explorer", "Streak Champion").
- **Administrative Exports**: Implemented secure, streaming CSV downloads for user databases, waitlist rankings, and referral tree graphs.
- **KYC Review Gates**: Created admin review tools with custom validation templates, transactional notification dispatches, and priority reward allocations.
