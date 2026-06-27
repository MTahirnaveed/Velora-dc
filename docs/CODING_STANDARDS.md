# Velora Coding Standards & Developer Guidelines

This document outlines the coding standards, folder structures, TypeScript rules, React structures, and Git patterns required for contributors to the Velora platform.

---

## 1. Naming & Case Conventions

To ensure consistency across the stack, follow these naming conventions:

* **File Names**:
  * React Components: PascalCase (e.g. `UserDashboard.tsx`, `BadgeCard.tsx`)
  * Standard Modules, Hooks, and Queries: camelCase (e.g. `queries.ts`, `useAuth.ts`)
  * Documentation: UPPER_SNAKE_CASE (e.g. `API.md`, `DEVELOPMENT_GUIDE.md`)
* **Variables & Functions**: camelCase (e.g. `const [user, setUser] = useState()`, `function fetchUserStats()`)
* **Types, Interfaces, and Enums**: PascalCase (e.g. `interface UserProfile`, `enum kycStatus`)
* **Database Objects**: snake_case for tables, columns, and relationships (e.g. `users`, `referral_rewards`, `user_id`)

---

## 2. TypeScript Guidelines

* **Strict Type Safety**: Avoid using `any` across the codebase. Always specify exact parameters and return types:
  ```typescript
  // ❌ Bad
  function updatePoints(user: any, pts: any) { ... }

  // ✅ Good
  function updatePoints(user: User, pts: number): Promise<User> { ... }
  ```
* **Use Named Imports**: Always use named imports instead of object destructuring when importing types and assets:
  ```typescript
  // ✅ Good
  import { ShieldAlertIcon, CheckCircleIcon } from 'lucide-react';
  ```
* **Enums**: Use standard TypeScript `enum` declarations instead of `const enum` to ensure clean compilation outputs and prevent runtime bugs.

---

## 3. React Guidelines

* **Functional Components & Hooks**: Implement all components as standard functional components with hooks.
* **Component Modularity**: Keep components focused on a single responsibility. Extract large static data objects or complex helper functions into separate files.
* **Dependency Arrays**: Maintain strict hygiene in `useEffect` dependency arrays to prevent infinite re-renders. Use primitive properties (strings, numbers, booleans) instead of arrays or objects inside dependencies.
* **Icon Usage**: All icons must be imported from the `lucide-react` library. Do not design inline SVGs or custom icons unless requested.

---

## 4. Express Server & Database Guidelines

* **Isolate Queries**: Keep SQL and database queries isolated within `/src/db/queries.ts`. Express route controllers should call these functions rather than writing raw queries:
  ```typescript
  // ✅ Good
  const user = await getUserById(db, req.user.id);
  ```
* **Parameterized Statements**: Leverage Drizzle's built-in query helpers. Never concatenate user input into database statements, as this introduces SQL injection vectors.
* **Wrap Controllers in Try/Catch**: Wrap Express route controllers in try/catch blocks. Log error stack traces to stdout and return a standard `500 Internal Server Error` response to prevent server crashes.

---

## 5. Git & Commit Message Standards

* **Commit Message Format**: Follow the Conventional Commits specification:
  `<type>(<scope>): <short description>`
  * `feat`: Introduce a new feature (e.g., `feat(auth): add time-based TOTP 2FA setup`)
  * `fix`: Apply a bug fix (e.g., `fix(referrals): resolve recursive loop calculation`)
  * `docs`: Update documentation (e.g., `docs(api): update OpenAPI specs`)
  * `style`: Apply styling or formatting changes (e.g., `style(dashboard): polish glassmorphic cards`)
  * `refactor`: Restructure code without changing behavior (e.g., `refactor(db): optimize user retrieval queries`)
* **Branching Strategy**:
  * `main`: Represents the production branch. All commits must be merged via verified Pull Requests.
  * `develop`: Integration branch for active feature development.
  * `feature/*`: Short-lived feature branches for specific tasks (e.g. `feature/jwt-refresh-tokens`).
  * `bugfix/*`: Branches for specific bug fixes (e.g. `bugfix/kyc-rejection-email`).
