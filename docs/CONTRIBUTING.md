# Velora Contribution Guidelines

Thank you for contributing to Velora! This document outlines our branching models, Pull Request (PR) review processes, issue reporting guidelines, and testing requirements to ensure high software quality.

---

## 1. Branching & Development Workflow

All contributions must follow this branching workflow:

1. **Fork or Branch**: Create a feature branch off of the `develop` branch:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
2. **Implement Changes**: Develop your feature, keeping your code modular and ensuring it adheres to our **[Coding Standards](CODING_STANDARDS.md)**.
3. **Run Code Validation**: Before committing, run the linter and compiler locally to ensure your changes don't introduce syntax or build errors:
   ```bash
   # Run the linter
   npm run lint

   # Compile the app to verify the build passes
   npm run build
   ```
4. **Commit & Push**: Commit your changes using Conventional Commits guidelines and push to your remote repository:
   ```bash
   git add .
   git commit -m "feat(auth): add time-based TOTP 2FA setup"
   git push origin feature/your-feature-name
   ```

---

## 2. Pull Request (PR) Submission

When your feature branch is ready, submit a Pull Request (PR) to merge into `develop`:

* **Target Branch**: Always target `develop`, never merge feature branches directly into `main`.
* **PR Checklist**:
  - [ ] Linting and build steps pass with zero errors.
  - [ ] No temporary testing keys or secrets are committed.
  - [ ] Updated schema definitions are mapped to Drizzle migrations.
  - [ ] New API endpoints are documented in `/docs/API.md`.
* **Code Review**: At least one senior developer or architect must review and approve your PR before it is merged.

---

## 3. Issue Reporting Guidelines

If you encounter a bug or want to suggest an improvement, open an issue in the repository with the following details:

* **Clear Title**: Summarize the issue (e.g. "Failed login attempt counter does not increment on incorrect MFA codes").
* **Reproduction Steps**: Step-by-step guide to reproduce the bug.
* **Expected vs. Actual Behavior**: Explain what should have happened versus what actually happened.
* **Environment Details**: Specify your Node.js, NPM, and OS versions.
* **Log Output**: Attach any relevant backend console error messages or frontend console logs.
