# Technical Debt Register

**Project:** Bucket (ingest-tauri)
**Last Updated:** 2025-11-19
**Maintained By:** Development Team

## Summary

- **Total Debt Items:** 9 (8 resolved)
- **Critical:** 0
- **High:** 0
- **Medium:** 1
- **Low:** 3
- **Estimated Total Effort:** 2-4 days

---

## Active Debt Items

### DEBT-001: Excessive Console Statements (247 instances)

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-17

**Location:**
- Widespread across all source files
- Particularly concentrated in: `AppRouter.tsx`, hooks, components

**Description:**
247 console statements left in production code. While useful for debugging, these should be removed or replaced with proper logging infrastructure before production builds.

**Impact:**
- **Business Impact:** Potential information leakage in production, console clutter
- **Technical Impact:** Performance overhead, unprofessional developer experience
- **Risk:** Sensitive data could be logged to browser console

**Proposed Solution:**
1. Add ESLint rule to enforce no-console in production
2. Implement proper logging service with conditional output
3. Global find/replace to migrate existing console statements
4. Add pre-commit hook to prevent new console statements

**Effort Estimate:** 2-3 days

**Priority Justification:**
Medium - Not blocking functionality but affects code quality. Can be addressed systematically.

**Status:** In Progress

**Progress:**
- ✅ Added ESLint `no-console` rule (2025-11-18)
  - Rule warns on `console.log`, `console.info`, `console.debug`, `console.trace`
  - Allows `console.error` and `console.warn` for legitimate error handling
- ✅ Created `src/utils/logger.ts` utility (2025-11-18)
  - Development-only logging (silent in production)
  - Namespaced logger support for module-specific debugging
  - Drop-in replacement for console.log
- ✅ Migrated `useScriptProcessor.ts` to logger utility (2025-11-19)
  - 13 console.log statements converted to namespaced logger
- Current status: 128 console.log remaining (down from 141)
  - 34 in UserFeedbackService.ts (intentional user feedback - keep)
  - 8 in debug.ts (development debugging - keep)
  - ~86 candidates for gradual migration
- Remaining: Continue gradual migration as files are touched

**Target Resolution:** Q1 2026

---

### DEBT-004: Large Files (1 file >500 lines)

**Category:** Architecture

**Severity:** Low

**Created:** 2025-11-17

**Location:**
- `components/ui/sidebar.tsx` - 722 lines (shadcn/ui component - intentionally single-file)
- ~~`pages/AI/ScriptFormatter/ScriptFormatter.tsx` - 717 lines~~ ✅ Reduced to 175 lines
- ~~`utils/breadcrumbsComparison.ts` - 565 lines~~ ✅ Reduced to 27 lines (re-export file)
- ~~`components/Baker/VideoLinksManager.tsx` - 559 lines~~ ✅ Reduced to 169 lines
- ~~`components/Baker/TrelloCardsManager.tsx` - 533 lines~~ ✅ Reduced to 165 lines
- ~~`components/BreadcrumbsViewerEnhanced.tsx` - 524 lines~~ ✅ Reduced to 75 lines
- ~~`pages/AI/ExampleEmbeddings/UploadDialog.tsx` - 504 lines~~ ✅ Reduced to 223 lines

**Description:**
Only one file exceeds the recommended 500-line limit (sidebar.tsx), but this is intentional as it's a shadcn/ui design system component that follows the single-file pattern.

**Impact:**
- **Business Impact:** Minimal - sidebar.tsx is a design system component with clear structure
- **Technical Impact:** Low - well-organized with clear sections
- **Risk:** Low - component is stable and rarely modified

**Root Cause:**
Feature additions over time without decomposition. UI components grew to include business logic, state management, and presentation.

**Proposed Solution:**
For each large file:
1. **sidebar.tsx**: ⚠️ Skip - shadcn/ui component follows single-file design pattern
2. **ScriptFormatter.tsx**: ✅ Extracted processing logic to hooks/services
3. **breadcrumbsComparison.ts**: ✅ Split into 6 focused modules (comparison, formatting, categorization, preview, date, debug)
4. **VideoLinksManager/TrelloCardsManager**: ✅ Extracted dialog components and business logic to hooks
5. **BreadcrumbsViewerEnhanced**: ✅ Split preview, comparison, and rendering concerns
6. **UploadDialog**: ✅ Extracted form hook, model status indicator, success view, and file input field

**Effort Estimate:** 4-5 days

**Priority Justification:**
Low - Only one file remains (sidebar.tsx) and it's an intentional design choice for shadcn/ui components.

**Status:** Completed ✅

**Progress:**
- ✅ `ScriptFormatter.tsx` reduced from 717 to 175 lines (2025-11-18)
- ✅ `TrelloCardsManager.tsx` reduced from 533 to 165 lines (2025-11-18)
- ✅ `VideoLinksManager.tsx` reduced from 559 to 169 lines (2025-11-18)
- ✅ `BreadcrumbsViewerEnhanced.tsx` reduced from 524 to 75 lines (2025-11-18)
- ✅ `breadcrumbsComparison.ts` reduced from 565 to 27 lines (2025-11-19)
  - Split into `src/utils/breadcrumbs/` module with 6 focused files
  - Maintains backward compatibility via re-exports
- ✅ `UploadDialog.tsx` reduced from 504 to 223 lines (2025-11-19)
  - Extracted `useUploadDialogForm` hook (205 lines)
  - Extracted `ModelStatusIndicator`, `UploadSuccessView`, `FileInputField` components
- ⚠️ `sidebar.tsx` (722 lines) - Not refactored (shadcn/ui design pattern)

**Resolved:** 2025-11-19

---

### DEBT-008: Magic Numbers (170 instances)

**Category:** Code Quality

**Severity:** Low

**Created:** 2025-11-17

**Location:**
- Widespread across codebase
- Common: timeout values (30000, 10000), file size limits (2048), cache times (30, 60)

**Description:**
170 magic numbers found in code without explanation. While not all are problematic (some are self-evident like array indices), many should be named constants.

**Impact:**
- **Business Impact:** Minimal - doesn't affect functionality
- **Technical Impact:** Harder to understand intent, difficult to change consistently
- **Risk:** Low - mostly maintainability concern

**Root Cause:**
Values hardcoded during development without extraction to constants.

**Proposed Solution:**
1. Extract timeout values to configuration constants
2. Move file size limits to validation config
3. Create constants file for common values
4. Document units (milliseconds, bytes, etc.)
5. Keep obvious values (0, 1, 100 for percentages) as-is

**Effort Estimate:** 1-2 days

**Priority Justification:**
Low - Nice-to-have improvement. Address opportunistically during related work.

**Status:** Open

**Target Resolution:** Q2 2026 (opportunistic)

---

### DEBT-009: Missing Integration/E2E Tests (17 tests skipped)

**Category:** Test

**Severity:** Medium

**Created:** 2025-11-17

**Location:**
- `tests/integration/example-management.test.tsx` - 14 tests skipped
- `tests/integration/baker-scan-workflow.test.ts` - 3 tests skipped

**Description:**
17 integration tests are properly documented but skipped, awaiting E2E testing infrastructure. While unit tests cover components well (479 passing), missing integration tests leave workflow gaps.

**Impact:**
- **Business Impact:** Higher risk of workflow-level bugs reaching production
- **Technical Impact:** Manual testing required for full workflows
- **Risk:** Regressions in multi-step user journeys not caught automatically

**Root Cause:**
E2E infrastructure not yet implemented. Tests written in TDD RED phase but infrastructure needed for GREEN phase.

**Proposed Solution:**
1. Evaluate E2E frameworks (Playwright vs Cypress vs Tauri testing tools)
2. Set up E2E infrastructure for Tauri app
3. Implement the 17 skipped tests
4. Add CI pipeline for E2E tests
5. Establish E2E testing guidelines

**Effort Estimate:** 3-4 days (infrastructure + test implementation)

**Priority Justification:**
Medium - Good unit test coverage exists, but integration testing would improve confidence in releases.

**Status:** Completed ✅

**Progress:**
- ✅ Created E2E testing implementation plan (2025-11-19)
  - Plan document: `specs/e2e-testing/README.md`
  - Recommended stack: Playwright + Tauri WebDriver
  - 4 implementation phases defined
  - Estimated 3-4 days total effort
- ✅ Phase 1: Basic Infrastructure Complete (2025-11-19)
  - Installed `@playwright/test` and `playwright` packages
  - Created `tests/e2e/playwright.config.ts` configuration
  - Created directory structure: `tests/e2e/{fixtures,pages,specs}/`
  - Created app launch fixture (`fixtures/app.fixture.ts`)
  - Created Tauri mocking fixtures (`fixtures/mocks.fixture.ts`)
  - Created basic smoke tests (`specs/smoke.spec.ts`)
  - Added npm scripts: `test:e2e`, `test:e2e:headed`, `test:e2e:debug`, `test:e2e:report`
  - Installed Chromium and WebKit browsers
- ✅ Phase 2: Test Fixtures Complete (2025-11-19)
  - Created page objects: `common.page.ts`, `baker.page.ts`, `example.page.ts`
  - Enhanced mock fixtures with properly typed data (BreadcrumbsFile, ExampleWithMetadata, ProjectFolder)
  - Added Vitest exclusion for E2E tests directory
- ✅ Phase 3: E2E Tests Implemented (2025-11-19)
  - Created `specs/example-management.spec.ts` (14 tests)
  - Created `specs/baker-workflow.spec.ts` (11 tests)
  - Total: 50 E2E tests passing (25 Chromium + 25 WebKit)
  - Test execution time: ~30 seconds
- ✅ Phase 4: CI Integration Complete (2025-11-19)
  - Added E2E test job to GitHub Actions CI workflow
  - Configured to run after build job completes
  - Installs Playwright browsers (Chromium only for CI speed)
  - Uploads Playwright HTML report as artifact (30-day retention)
  - Uploads test results on failure (screenshots/videos, 7-day retention)
  - Runs on PRs and pushes to master/release branches

**Resolved:** 2025-11-19

**Notes:**
- Playwright configured for Chromium and WebKit testing
- Tauri API mocking infrastructure in place
- E2E tests run against Vite dev server (not full Tauri app)
- See `specs/e2e-testing/README.md` for detailed implementation plan

---

### DEBT-010: BakerPage Component Tests Require Rewrite

**Category:** Test

**Severity:** Medium

**Created:** 2025-11-17

**Location:**
- `tests/component/BakerPage.test.tsx` - ~~9 tests skipped~~ ✅ 7 tests now passing

**Description:**
BakerPage component was significantly refactored with new hooks and architecture, but tests were not updated. Tests are currently skipped pending comprehensive rewrite to match new structure.

**Impact:**
- **Business Impact:** Baker page changes not covered by automated tests
- **Technical Impact:** Manual testing required for Baker functionality
- **Risk:** Baker regressions could slip through

**Root Cause:**
Component evolved faster than tests were maintained. Tests became coupled to old implementation.

**Proposed Solution:**
1. Review current BakerPage architecture
2. Write new tests for current component structure
3. Update mocks to match new hooks (useBakerScan, useBreadcrumbsManager)
4. Test rendered output rather than implementation details
5. Add proper Tauri mocking for storage utilities

**Effort Estimate:** 1-2 days

**Status:** Completed ✅

**Progress:**
- ✅ Rewrote BakerPage tests with proper hook mocks (2025-11-18)
  - Mocked all 7 hooks: useBakerScan, useBreadcrumbsManager, useBakerPreferences, useLiveBreadcrumbsReader, useBreadcrumbsPreview, useTrelloBoard, useBakerTrelloIntegration
  - Added tests for rendering, scan state, and results display
  - 7 tests now passing (previously 9 skipped)
  - Test count increased from 456 to 463, skipped reduced from 31 to 19

**Resolved:** 2025-11-18

---

### DEBT-011: Deprecated Code Markers (2 instances)

**Category:** Code Quality

**Severity:** Low

**Created:** 2025-11-17

**Location:**
- `types/baker.ts` (line 36)
- `hooks/useImageRefresh.ts` (line 58)

**Description:**
Two DEPRECATED comments found indicating code that should be removed or replaced.

**Impact:**
- **Business Impact:** Minimal - deprecated code still functioning
- **Technical Impact:** Dead code accumulation, confusion about what to use
- **Risk:** Low - deprecated code may be removed unexpectedly

**Proposed Solution:**
1. Review each deprecated item
2. Identify replacement approach
3. Create migration plan if used elsewhere
4. Remove deprecated code
5. Update documentation

**Effort Estimate:** 0.5 days

**Priority Justification:**
Low - Not urgent but should be cleaned up to reduce codebase clutter.

**Status:** Open

**Target Resolution:** Q2 2026 (opportunistic)

---

### DEBT-012: Exact Version Constraints (8 packages)

**Category:** Dependency

**Severity:** Low

**Created:** 2025-11-17

**Location:**
- Package.json - 8 packages with exact versions (no ^ or ~)

**Description:**
Eight packages pinned to exact versions: @tauri-apps/cli, @eslint/js, @ianvs/prettier-plugin-sort-imports, @types/node, eslint-config-prettier, lightningcss, postcss, prettier.

**Impact:**
- **Business Impact:** Miss out on bug fixes and minor improvements
- **Technical Impact:** Manual effort to update versions
- **Risk:** Low - but missing security patches in minor versions

**Root Cause:**
Likely intentional to ensure build reproducibility, or result of package manager behavior.

**Proposed Solution:**
1. Review why each package is pinned
2. For non-critical packages, use ^ for minor/patch updates
3. For critical packages (Tauri), document why exact version is needed
4. Set up Dependabot or Renovate for automated PR updates
5. Establish policy for version pinning

**Effort Estimate:** 0.5 days

**Priority Justification:**
Low - Current approach is overly cautious but not harmful. Can adjust incrementally.

**Status:** Open

**Target Resolution:** Q2 2026

---

## Resolved Debt Items

### DEBT-002: Complex Functions with High Cyclomatic Complexity ✅

**Category:** Code Quality

**Severity:** High

**Created:** 2025-11-17

**Resolved:** 2025-11-18

**Location:**
All functions previously identified have been refactored to complexity <15.

**Description:**
Multiple functions exceeded recommended cyclomatic complexity of 15, making them difficult to test, understand, and maintain.

**Resolution:**
Comprehensive refactoring across 7 components:
- `useScriptProcessor.ts`: Extracted processing logic
- `ScriptFormatter.tsx`: 717→175 lines (76% reduction)
- `TrelloCardsManager.tsx`: 539→165 lines (69% reduction)
- `VideoLinksManager.tsx`: 559→169 lines (70% reduction)
- `BatchUpdateConfirmationDialog.tsx`: 423→155 lines (63% reduction)
- `UploadTrello.tsx`: Extracted to hook + components (111 lines)
- `BreadcrumbsViewerEnhanced.tsx`: 524→75 lines (86% reduction)

All functions now pass ESLint complexity check with threshold of 15.

**Effort Actual:** 3-4 days

---

### DEBT-003: Deep Nesting (88 instances, 16 critical with depth 7-8) ✅

**Category:** Code Quality

**Severity:** High

**Created:** 2025-11-17

**Resolved:** 2025-11-18

**Location:**
All files previously identified have been verified to be within max-depth limit of 4.

**Description:**
88 instances of excessive nesting (>4 levels), with 16 critical cases reaching 7-8 levels deep.

**Resolution:**
- Refactored `useUpdateMutation.ts` by extracting helper functions and using early returns
- Refactored `useBakerTrelloIntegration.ts` by extracting helper functions and using early returns
- Verified all other flagged files (AppRouter.tsx, breadcrumbsValidation.ts, useScriptProcessor.ts, useLiveBreadcrumbsReader.ts) are within max-depth limit
- No ESLint max-depth violations remaining in codebase

**Effort Actual:** 1 day

---

### DEBT-006: Critical BUG Comments (3 instances) ✅

**Category:** Code Quality

**Severity:** High

**Created:** 2025-11-17

**Resolved:** 2025-11-18

**Location:**
- `utils/breadcrumbsComparison.ts` (line 356)
- `hooks/useScriptProcessor.ts` (line 226)
- `pages/BuildProject/BuildProject.tsx` (line 99)

**Description:**
Three BUG comments found in code indicating known issues that haven't been addressed.

**Resolution:**
BUG comments have been investigated and resolved. The issues were either fixed or the comments were removed after determining they were no longer applicable.

**Effort Actual:** < 1 day

---

### DEBT-007: Weak TypeScript Typing (7 instances of 'any') ✅

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-17

**Resolved:** 2025-11-18

**Location:**
- `hooks/useEmbedding.ts` - embedderInstance, loadingPromise
- `hooks/useOllamaEmbedding.ts` - model array elements
- `services/ai/modelFactory.ts` - configuration parameter
- `services/ai/providerConfig.ts` - model filtering

**Description:**
Seven uses of TypeScript `any` type, reducing type safety.

**Resolution:**
All `any` types have been replaced with proper TypeScript interfaces and types. Remaining `any` usages are only in test files for mocking purposes, which is acceptable.

**Effort Actual:** < 1 day

---

### DEBT-005: Long Parameter Lists (10 functions with 6-13 params) ✅

**Category:** Code Quality

**Severity:** High

**Created:** 2025-11-17

**Resolved:** 2025-11-18

**Location:**
- `hooks/useScriptProcessor.ts` - uses `ProcessScriptOptions` interface
- `hooks/useCreateProject.ts` - uses `CreateProjectParams` interface
- `components/ui/button-variants.ts` - uses CVA configuration pattern

**Description:**
Functions with excessive parameters (>5) were identified as difficult to use correctly.

**Resolution:**
Investigation revealed that the identified functions already use the recommended options object/interface pattern:
- `useScriptProcessor` accepts a single `ProcessScriptOptions` object
- `useCreateProject` accepts a single `CreateProjectParams` object
- `button-variants.ts` uses class-variance-authority (CVA) configuration, not function parameters

The original analysis may have counted interface properties rather than function parameters. The codebase correctly follows TypeScript best practices for parameter management.

**Effort Actual:** 0 days (already resolved)

---

## Won't Fix Items

_No items marked as won't fix yet._

---

## Debt Trends

### By Category
- Code Quality: 3 items (DEBT-001, 008, 011)
- Architecture: 0 items
- Test: 0 items
- Documentation: 0 items
- Dependency: 1 item (DEBT-012)
- Performance: 0 items
- Security: 0 items
- Infrastructure: 0 items
- Design: 0 items

### By Severity
- Critical: 0 items
- High: 0 items
- Medium: 1 item (DEBT-001)
- Low: 3 items (DEBT-008, 011, 012)

### Aging
- < 1 week: 9 items (all identified this week)
- 1-4 weeks: 0 items
- 1-3 months: 0 items
- 3-6 months: 0 items
- > 6 months: 0 items

### Priority Actions
1. ~~**Immediate**: Investigate BUG comments (DEBT-006)~~ ✅ Resolved
2. ~~**Sprint Q1 2026**: Long parameter lists (DEBT-005)~~ ✅ Already using options pattern
3. ~~**Sprint Q1 2026**: Complex functions (DEBT-002)~~ ✅ All functions now below complexity threshold
4. ~~**Sprint Q1 2026**: Deep nesting issues (DEBT-003)~~ ✅ No max-depth violations remaining
5. ~~**Sprint Q1 2026**: Implement E2E testing infrastructure (DEBT-009)~~ ✅ Complete with CI integration
6. **Sprint Q1 2026**: Continue console.log migration (DEBT-001)
7. **Q2 2026**: Opportunistic cleanup (magic numbers, deprecated code)

---

## Review Schedule

- **Weekly:** Review new BUG/TODO comments, triage new findings
- **Monthly:** Update debt register, plan high-priority fixes
- **Quarterly:** Full codebase analysis, trend review, strategy adjustment

---

## Next Actions

1. **This Week:**
   - [x] Review BUG comments (DEBT-006) - ✅ Resolved
   - [x] Fix TypeScript any usages (DEBT-007) - ✅ Resolved
   - [x] Add ESLint rules for max-complexity (15), max-depth (5), max-params (6) - ✅ Added as warnings
   - [x] Complete complexity reduction (DEBT-002) - ✅ All functions below threshold
   - [x] Resolve deep nesting issues (DEBT-003) - ✅ No max-depth violations remaining

2. **Next Sprint:**
   - [ ] Continue console.log migration (DEBT-001)
   - [x] Set up E2E testing infrastructure (DEBT-009) - ✅ Completed with CI integration

3. **Next Quarter:**
   - [x] Rewrite BakerPage tests (DEBT-010) - ✅ Completed
   - [x] Refactor large files (DEBT-004) - ✅ Completed (sidebar.tsx skipped as shadcn/ui)

---

## Notes

**Analysis Date:** 2025-11-17
**Analysis Method:** Automated script analysis + manual review
**Test Status:** 463 passing, 19 skipped (100% pass rate)
**Overall Code Health:** Good - codebase is functional with well-tested components. Primary debt is in code complexity and missing integration tests. No critical security issues identified.

**Positive Highlights:**
- Excellent test coverage with 100% pass rate
- No deprecated package dependencies
- Active development with recent refactoring
- Strong TypeScript usage (no `any` in production code) ✅
- Modern tech stack (React 18, TanStack Query, Tauri 2.0)
- Good parameter management using options interfaces ✅
- 7 debt items resolved since initial register
- All high-severity items resolved ✅
- All architecture debt resolved ✅

**Areas of Concern:**
- ~128 console statements need migration to logger (DEBT-001)

**Recent Achievements:**
- E2E testing infrastructure fully implemented with CI integration (DEBT-009)
- 8 of 9 technical debt items resolved
