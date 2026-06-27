# Velora Directory & File Structure Reference

This document provides a comprehensive structural guide to the folders and files of the Velora project, explaining the architectural purpose and responsibility of each section.

---

## 1. Directory Tree Overview

```
├── .env.example                # Template for environment variables (never commit actual secrets)
├── .gitignore                  # Git untracked path specifications (excludes build files, dependencies)
├── README.md                   # Repository primary landing document
├── metadata.json               # Platform configuration metadata, permissions, major capabilities
├── package.json                # NPM configuration, dependencies, and execution scripts
├── tsconfig.json               # Global TypeScript compiler configurations
├── vite.config.ts              # Vite configurations (Tailwind imports, server proxies)
├── server.ts                   # Backend entry point, API route controllers, and static server
├── dist/                       # Output directory for compiled production builds (generated)
│   ├── index.html              # Optimized HTML entry page
│   ├── assets/                 # Compiled CSS and bundled JS chunks
│   └── server.cjs              # Bundled, self-contained production backend server file
├── docs/                       # Complete developer, architectural, and REST documentation
│   ├── README.md               # Quick overview, stack, and document indices
│   ├── INSTALLATION.md         # Local setup, database setup, and execution steps
│   ├── DATABASE.md             # ER mappings, table layouts, constraints, indexes
│   ├── ARCHITECTURE.md         # High-level data structures, component mappings, flows
│   ├── API.md                  # REST specifications, content negotiation, code examples
│   ├── AUTHENTICATION.md       # Login progressive state gates, TOTP, lockouts
│   ├── REFERRAL_SYSTEM.md      # Multi-tier recursive logic, formulas, fraud guards
│   ├── TASK_SYSTEM.md          # Task types, claim evaluations, streaks
│   ├── ADMIN_GUIDE.md          # Analytics, user bans, KYC reviews, campaign dispatchers
│   ├── SECURITY.md             # OWASP compliance, threat mitigations, encryption standards
│   ├── DEPLOYMENT.md           # Production server rules, Docker, Cloud Run configurations
│   ├── ENVIRONMENT_VARIABLES.md# Variable directories, required states, and recommendations
│   ├── CODING_STANDARDS.md     # Code formats, React structures, naming conventions
│   └── TESTING.md              # Unit, integration, manual QA, and performance checklists
└── src/                        # Primary frontend source directory
    ├── main.tsx                # Client-side React DOM mounting entry
    ├── App.tsx                 # Core React Single Page App layout and routing router
    ├── index.css               # Global Tailwind CSS imports and variable custom theme variables
    ├── types.ts                # App-wide shared TypeScript interfaces and enums
    └── db/                     # Database access layer and migrations compiler
        ├── index.ts            # Drizzle DB client initialization and connection pooling
        ├── schema.ts           # PostgreSQL pg-table mappings and relationships definition
        ├── queries.ts          # Prepared parameterized queries and transactional routines
        └── seed.ts             # Default admin and tasks database seeding script
```

---

## 2. Main Entry Point Descriptions

### A. Root Configuration Files

* **`server.ts`**: The main full-stack server entry point. In development, it spins up Vite middleware inside Express to provide Hot Module Replacement. In production, it statically servescompiled HTML and JavaScript assets out of `/dist`. Houses all REST API routes, middlewares (auth verification, admin checks), and helper functions.
* **`metadata.json`**: Controls app name ("Velora"), descriptions, requested frame permissions (camera/mic), and platform permissions. Includes `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` to declare secure server proxying logic.
* **`package.json`**: Defines package scripts (`npm run dev`, `npm run build`, `npm run start`) and catalogs dependencies. Includes standard Node packages such as `express`, `@google/genai`, `drizzle-orm`, `pg`, `bcryptjs`, and UI libs such as `react`, `recharts`, and `motion`.
* **`vite.config.ts`**: Configures Vite, including CSS pre-processors and optimization behaviors.
* **`tsconfig.json`**: Guides type checking rules, directory path aliases, and modern TypeScript compilation outputs.

---

## 3. Database Layer (`src/db/`)

* **`src/db/index.ts`**: Connects to the PostgreSQL instance using raw environment credentials. Configures connection pool settings to support high-performance scaling in production.
* **`src/db/schema.ts`**: The single source of truth for the database layout. Uses `drizzle-orm/pg-core` to model tables, constraints, foreign key cascades, defaults, and many-to-many/one-to-many connections.
* **`src/db/queries.ts`**: Hosts performance-optimized, parameterized query functions for the backend routes. Isolates data retrieval from Express controllers, protecting against SQL injection and standard state issues.
* **`src/db/seed.ts`**: Contains automated initializers to seed standard tasks, configurations, and administrative profiles.

---

## 4. Frontend Application Layer (`src/`)

* **`src/main.tsx`**: Bootstraps the client-side React rendering loop, wrapping the root component in DOM mounts.
* **`src/App.tsx`**: The core frontend structure. Contains the single-page application framework. Evaluates active authentication states via standard REST calls and handles client views (dashboard, admin controls, check-ins, tasks panels, settings modals, and KYC forms).
* **`src/index.css`**: The main stylesheet. Imports Tailwind CSS and registers the core theme variables.
* **`src/types.ts`**: Houses type-safe schemas, request formats, response payloads, badge types, and KYC states, preventing compile-time bugs.
