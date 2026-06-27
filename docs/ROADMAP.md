# Velora Product & Engineering Roadmap

This document outlines the product phases and milestones scheduled for the Velora waitlist and referral ecosystem, transitioning from private beta to mainnet token launch and governance.

---

## Roadmap Phases Overview

```
   Phase 1: Private Beta  ===============> [Completed]
   * Parameterized PostgreSQL Schema with Drizzle ORM
   * Multi-Level (3-Tier) Recursive Referral Point System
   * Time-Based MFA / TOTP Authenticator Integration

   Phase 2: Public Launch ===============> [In Progress]
   * Active Community Tasks Verification (Twitter/Telegram)
   * Advanced Admin Panel (CSV exports, KYC reviews)
   * Google Gemini AI-assisted Support Gateway

   Phase 3: Mobile Onboarding & Biometrics => [Q3 2026]
   * React Native Cross-Platform Client Port
   * Biometric Authentication (FaceID / TouchID)
   * Interactive Push Notifications Integration

   Phase 4: EVM Mainnet Token Integration => [Q4 2026]
   * Mainnet Launch & Real VLR Token Contract Deployments
   * Audit and Security Hardening of Token Claims
   * Real MetaMask, Phantom, & WalletConnect Connections

   Phase 5: DAO Governance & Staking ====> [Q1 2027]
   * Waitlist Points-to-Token Conversion Pools
   * Decentralized Governance & DAO voting portals
   * VLR Token Liquidity Staking & Rewards
```

---

## Detailed Milestone Descriptions

### Phase 1: Private Beta (Completed)
* **Objective**: Build the core platform infrastructure and test the multi-tier referral engine with early invitees.
* **Key Achievements**:
  * Established a secure, full-stack React and Express backend with a PostgreSQL database.
  * Implemented stateless JWT session handling with refresh token rotation.
  * Designed a 3-level recursive referral system to drive viral user growth.
  * Added Time-Based Multi-Factor Authentication (MFA) to secure accounts.

### Phase 2: Public Launch (In Progress)
* **Objective**: Scale the platform to a wider audience and introduce advanced task and admin management features.
* **Current Deliverables**:
  * Real-time verification of social tasks (Twitter verification and Telegram community joining).
  * Robust admin dashboard with live analytics, user suspensions, and CSV data exports.
  * Manual KYC review pipeline with points bonuses and email verification confirmations.
  * Server-side Gemini AI gateway to provide automated support.

### Phase 3: Mobile Apps & Biometrics (Scheduled Q3 2026)
* **Objective**: Port the platform to mobile devices to increase user retention.
* **Planned Features**:
  * Native iOS and Android app wrappers built with React Native.
  * Seamless biometric authentication (FaceID and TouchID) for secure login.
  * Push notifications to alert users of daily check-in resets and waitlist rank changes.

### Phase 4: EVM Mainnet Token Integration (Scheduled Q4 2026)
* **Objective**: Transition from simulated Web3 token claims to real on-chain token distributions.
* **Planned Features**:
  * Deploy the `$VLR` ERC-20 utility token contract on Arbitrum or Base networks.
  * Implement secure smart contract claims, allowing verified users to convert waitlist points to real tokens.
  * Support wallet connections using MetaMask, Phantom, and WalletConnect.

### Phase 5: DAO Governance & Staking (Scheduled Q1 2027)
* **Objective**: Hand over platform governance to the community and incentivize long-term token holding.
* **Planned Features**:
  * Staking pools that allow users to lock `$VLR` tokens to earn yield and point multipliers.
  * Decentralized governance portal (DAO) where token holders can vote on future features, tasks, and system settings.
