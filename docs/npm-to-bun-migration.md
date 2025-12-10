# NPM to Bun Migration Task Tracker

**Branch:** `chore/complete-bun-migration`
**Date Started:** 2025-12-10
**Status:** In Progress

---

## Migration Overview

Complete the transition from npm to Bun across CI/CD workflows, documentation, and project-specific configurations. This follows a conservative 4-phase approach with validation at each step.

---

## Phase 1: CI/CD Workflows (CRITICAL) ⏳

**Goal:** Update all GitHub Actions workflows to use Bun instead of npm

### Tasks

- [ ] Update `.github/workflows/publish.yml`
  - [ ] Replace `actions/setup-node@v4` with `oven-sh/setup-bun@v2`
  - [ ] Replace `npm install` with `bun install`
  - [ ] Replace `tauriScript: 'npm run tauri'` with `tauriScript: 'bun run tauri'`

- [ ] Update `.github/workflows/auto-release-pr.yml`
  - [ ] Replace `actions/setup-node@v4` with `oven-sh/setup-bun@v2` (2 instances)
  - [ ] Replace all `npm install` with `bun install`
  - [ ] Replace `npm run test:run` with `bun run test:run`
  - [ ] Replace `npm run build:tauri` with `bun run build:tauri`
  - [ ] Replace `npm run test:e2e` with `bun run test:e2e`
  - [ ] Update cache key from `package-lock.json` to `bun.lockb`
  - [ ] Keep `npx playwright install` (correct usage)

- [ ] Update `.github/workflows/update-node-dependencies.yml`
  - [ ] Replace `actions/setup-node@v4` with `oven-sh/setup-bun@v2`
  - [ ] Replace `npm install` with `bun install`
  - [ ] Replace `npm run build` with `bun run build`

### Validation

- [ ] Push branch and verify all GitHub Actions pass
- [ ] Review workflow run logs for any Bun-specific issues
- [ ] Confirm build artifacts are created correctly

**Status:** Not Started
**Completed:** --

---

## Phase 2: User-Facing Documentation (HIGH) ⏸️

**Goal:** Update documentation that users and developers interact with

### Tasks

- [ ] Update `README.md`
  - [ ] Line 60: Update Prerequisites to emphasize Bun
  - [ ] Line 80: Change `npm install` to `bun install`
  - [ ] Line 87: Change `npm run build:tauri` to `bun run build:tauri`
  - [ ] Line 96: Change `npm run dev:tauri` to `bun run dev:tauri`
  - [ ] Remove npm as alternative option

- [ ] Update `tests/e2e/playwright.config.ts`
  - [ ] Line 48: Change `command: 'npm run dev'` to `command: 'bun run dev'`
  - [ ] Lines 52-56: Update comment and remove npm-specific env clearing

- [ ] Update `BUILD_PROJECT_FIXES.md`
  - [ ] Line 6: Change "verified with npm test" to "verified with bun test"

### Validation

- [ ] Run `bun run test:e2e` to verify E2E tests work with new config
- [ ] Verify dev server starts correctly via Playwright
- [ ] Review documentation for accuracy

**Status:** Not Started
**Completed:** --

---

## Phase 3: Internal Documentation (MEDIUM) ⏸️

**Goal:** Update Serena memory files for AI assistant consistency

### Tasks

- [ ] Update `.serena/memories/suggested_commands.md`
  - [ ] Replace all `npm run` commands with `bun run`
  - [ ] Replace `npm install` with `bun install`
  - [ ] Verify all command examples are accurate

- [ ] Update `.serena/memories/task_completion_workflow.md`
  - [ ] Replace npm command references with bun equivalents
  - [ ] Update workflow descriptions

- [ ] Update `.serena/memories/tech_stack.md`
  - [ ] Change package manager description from npm to Bun
  - [ ] Update any npm-specific notes

### Validation

- [ ] Review all changes for consistency
- [ ] Verify commands match those in CLAUDE.md and README.md

**Status:** Not Started
**Completed:** --

---

## Phase 4: Project-Specific Skills (MEDIUM) ⏸️

**Goal:** Update actively-used Claude Code skills to use Bun commands

### Tasks

- [ ] Update `.claude/skills/new-frontend-feature/skill.md`
  - [ ] Line 452: Change `npm run test` to `bun run test`
  - [ ] Verify skill instructions remain accurate

- [ ] Update `.claude/skills/test-specialist/SKILL.md`
  - [ ] Line 299: Replace `npm test -- --coverage` with `bun test --coverage`
  - [ ] Lines 436-448: Update all test command examples
    - [ ] `npm test` → `bun test`
    - [ ] `npm test -- --coverage` → `bun test --coverage`
    - [ ] `npm test -- ExpenseCalculator.test.ts` → `bun test ExpenseCalculator.test.ts`
    - [ ] `npm test -- --watch` → `bun test --watch`
    - [ ] `npm run test:e2e` → `bun run test:e2e`

### Validation

- [ ] Verify skill instructions work with current Bun test setup
- [ ] Test-run one skill to ensure commands execute correctly

**Status:** Not Started
**Completed:** --

---

## Post-Migration Testing Checklist ⏸️

**Goal:** Comprehensive validation before merging to release branch

### Core Functionality

- [ ] `bun install` installs all dependencies correctly
- [ ] `bun run dev:tauri` launches the Tauri app
- [ ] `bun run build:tauri` creates DMG in `/target/build/dmg`
- [ ] `bun test` runs all Vitest tests and passes
- [ ] `bun run prettier:fix` formats code correctly
- [ ] `bun run eslint:fix` lints code correctly

### CI/CD Validation

- [ ] All GitHub Actions workflows show green checkmarks
- [ ] Publish workflow can build release artifacts
- [ ] Auto-release-PR workflow runs without errors
- [ ] Update-node-dependencies workflow functions correctly

### E2E Testing

- [ ] `bun run test:e2e` runs Playwright tests successfully
- [ ] Dev server starts correctly for E2E tests
- [ ] All E2E tests pass

### Documentation Review

- [ ] README.md instructions are accurate and complete
- [ ] CLAUDE.md references are still correct
- [ ] No broken npm references remain in user-facing docs

**Status:** Not Started
**Completed:** --

---

## Final Steps ⏸️

- [ ] Review all changes in git diff
- [ ] Commit changes with descriptive message
- [ ] Push branch to remote
- [ ] Create PR: `chore/complete-bun-migration` → `release`
- [ ] Add PR description with migration summary
- [ ] Request review if needed
- [ ] Merge PR after approval

**Status:** Not Started
**Completed:** --

---

## Files Intentionally Excluded

These files contain npm references that should NOT be changed:

### Third-Party/Generated Content
- `node_modules/*` (third-party code)
- `dist/*` (build artifacts)
- `CHANGELOG.md` (historical record)

### Correct NPX Usage
- `CLAUDE.md` line 47-49: `npx npm-check-updates` (npm-specific tool)
- `docs/react-query-patterns.md`: `npx ts-node` (correct usage)
- `scripts/validate-migration.ts`: `npx tsc` (correct usage)

### Package Names (Not Commands)
- `package.json`: `"npm-check-updates": "^19.1.1"` (dependency name)

### Non-Project-Specific Skills
- `.claude/skills/cicd-pipeline-generator/*`
- `.claude/skills/docker-containerization/*`
- `.claude/skills/document-skills/*`
- `.claude/skills/frontend-enhancer/*`
- `.claude/skills/codebase-documenter/*`
- `.claude/skills/tailwind-auditor/*`
- `.claude/skills/ux-animation-guru/*`

---

## Notes & Issues

### Issues Encountered
(None yet)

### Decisions Made
1. Remove npm as fallback option in documentation (user preference)
2. Focus only on project-specific skills, ignore general-purpose skills
3. Conservative 4-phase approach with validation between each phase
4. Keep `.claude/settings.local.json` unchanged (auto-approval rules)

### Command Mapping Reference

| npm Command | Bun Equivalent |
|-------------|----------------|
| `npm install` | `bun install` |
| `npm run <script>` | `bun run <script>` |
| `npm test` | `bun test` |
| `npm run build` | `bun run build` |
| `npm ci` | `bun install --frozen-lockfile` |
| `npx <package>` | `bunx <package>` (or keep npx for compatibility) |

---

## Progress Summary

- **Phase 1 (CI/CD):** 0% complete
- **Phase 2 (User Docs):** 0% complete
- **Phase 3 (Internal Docs):** 0% complete
- **Phase 4 (Skills):** 0% complete
- **Overall:** 0% complete

**Last Updated:** 2025-12-10
