# Technical Debt Register

**Project:** Bucket (ingest-tauri)
**Last Updated:** 2025-11-18
**Maintained By:** Development Team

## Summary

- **Total Debt Items:** 9 (3 resolved)
- **Critical:** 0
- **High:** 2
- **Medium:** 4
- **Low:** 3
- **Estimated Total Effort:** 13-18 days

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

**Status:** Open

**Target Resolution:** Q1 2026

---

### DEBT-002: Complex Functions with High Cyclomatic Complexity

**Category:** Code Quality

**Severity:** High

**Created:** 2025-11-17

**Location:**
- ~~`hooks/useScriptProcessor.ts` - complexity 40 (214 lines)~~ ✅ Refactored to <15
- ~~`pages/AI/ScriptFormatter/ScriptFormatter.tsx` - complexity 39 (717 lines)~~ ✅ Refactored to <15 (175 lines)
- ~~`components/Baker/TrelloCardsManager.tsx` - complexity 30 (539 lines)~~ ✅ Refactored to <15 (165 lines)
- ~~`components/Baker/VideoLinksManager.tsx` - complexity 29 (559 lines)~~ ✅ Refactored to <15 (169 lines)
- `components/BatchUpdateConfirmationDialog.tsx` - complexity 29
- `pages/UploadTrello.tsx` - complexity 19
- `components/BreadcrumbsViewerEnhanced.tsx` - complexity 18

**Description:**
Multiple functions exceed recommended cyclomatic complexity of 15, making them difficult to test, understand, and maintain. The highest complexity is in `ScriptFormatter.tsx` with complexity of 39.

**Impact:**
- **Business Impact:** Slower feature development, higher bug rate in these areas
- **Technical Impact:** Difficult to test, high cognitive load, increased maintenance cost
- **Risk:** Changes frequently introduce regressions

**Root Cause:**
Feature growth over time without refactoring. Functions accumulated responsibilities as requirements evolved.

**Proposed Solution:**
For each complex function:
1. Extract sub-functions for distinct responsibilities
2. Apply single responsibility principle
3. Introduce early returns to reduce nesting
4. Consider state machine pattern for complex conditional logic (especially useScriptProcessor)
5. Add comprehensive unit tests after refactoring

**Effort Estimate:** 5-7 days (1-1.5 days per major function)

**Priority Justification:**
High - These are high-churn areas that slow development and increase bug risk. Particularly useScriptProcessor and useCreateProject are critical business logic.

**Dependencies:**
- Related: DEBT-003 (deep nesting often correlates with complexity)

**Status:** In Progress

**Progress:**
- ✅ `useScriptProcessor.ts` refactored from complexity 32 to <15 (2025-11-18)
- ✅ `ScriptFormatter.tsx` refactored from complexity 39 to <15 (2025-11-18)
  - Extracted state management to `useScriptFormatterState` hook
  - Created step components: SelectModelStep, ProcessingStep, ReviewStep, DownloadCompleteStep, WorkflowIndicator
  - Reduced from 717 lines to 175 lines (76% reduction)
- ✅ `TrelloCardsManager.tsx` refactored from complexity 30 to <15 (2025-11-18)
  - Extracted state management to `useTrelloCardsManager` hook
  - Created `AddCardDialog` component for dialog logic
  - Reduced from 539 lines to 165 lines (69% reduction)
- ✅ `VideoLinksManager.tsx` refactored from complexity 29 to <15 (2025-11-18)
  - Extracted state management to `useVideoLinksManager` hook
  - Created `AddVideoDialog` component for dialog logic
  - Reduced from 559 lines to 169 lines (70% reduction)
- Remaining: 3 functions still above threshold

**Target Resolution:** Sprint 2026-Q1

---

### DEBT-003: Deep Nesting (88 instances, 16 critical with depth 7-8)

**Category:** Code Quality

**Severity:** High

**Created:** 2025-11-17

**Location:**
- `AppRouter.tsx` - depth 7-8
- `utils/breadcrumbsValidation.ts` - depth 7-8
- `hooks/useScriptProcessor.ts` - depth 7-8
- `hooks/useUpdateMutation.ts` - depth 7-8
- `hooks/useLiveBreadcrumbsReader.ts` - depth 7

**Description:**
88 instances of excessive nesting (>4 levels), with 16 critical cases reaching 7-8 levels deep. This makes code extremely difficult to follow and increases cognitive load.

**Impact:**
- **Business Impact:** Slower code reviews, harder to onboard new developers
- **Technical Impact:** Error-prone, difficult to test all code paths
- **Risk:** Hidden bugs in nested conditional logic

**Root Cause:**
Nested error handling, multiple conditional checks, and callback nesting without extraction.

**Proposed Solution:**
1. Extract nested blocks into named functions
2. Use early returns/guard clauses to flatten logic
3. Replace nested conditionals with strategy pattern where appropriate
4. For async code, use async/await instead of nested callbacks
5. Enable ESLint max-depth rule (limit to 4)

**Effort Estimate:** 3-4 days

**Priority Justification:**
High - Directly impacts code maintainability and bug rate. These files are frequently modified.

**Dependencies:**
- Related: DEBT-002 (complex functions often have deep nesting)

**Status:** Open

**Target Resolution:** Sprint 2026-Q1

---

### DEBT-004: Large Files (4 files >500 lines)

**Category:** Architecture

**Severity:** Medium

**Created:** 2025-11-17

**Location:**
- `components/ui/sidebar.tsx` - 722 lines
- ~~`pages/AI/ScriptFormatter/ScriptFormatter.tsx` - 717 lines~~ ✅ Reduced to 175 lines
- `utils/breadcrumbsComparison.ts` - 565 lines
- ~~`components/Baker/VideoLinksManager.tsx` - 559 lines~~ ✅ Reduced to 169 lines
- ~~`components/Baker/TrelloCardsManager.tsx` - 533 lines~~ ✅ Reduced to 165 lines
- `components/BreadcrumbsViewerEnhanced.tsx` - 524 lines
- `pages/AI/ExampleEmbeddings/UploadDialog.tsx` - 505 lines

**Description:**
Four files exceed the recommended 500-line limit (down from 7), indicating potential violation of single responsibility principle.

**Impact:**
- **Business Impact:** Slower code reviews, harder to understand business logic
- **Technical Impact:** Merge conflicts more likely, testing more difficult
- **Risk:** Changes in one area unexpectedly affect another

**Root Cause:**
Feature additions over time without decomposition. UI components grew to include business logic, state management, and presentation.

**Proposed Solution:**
For each large file:
1. **sidebar.tsx**: Extract sub-components, separate navigation logic
2. **ScriptFormatter.tsx**: Extract processing logic to hooks/services, split UI into sub-components
3. **breadcrumbsComparison.ts**: Split into comparison logic, diff calculation, and formatting
4. **VideoLinksManager/TrelloCardsManager**: Extract dialog components, extract business logic to hooks
5. **BreadcrumbsViewerEnhanced**: Split preview, comparison, and rendering concerns
6. **UploadDialog**: Extract validation, form logic, and upload handling

**Effort Estimate:** 4-5 days

**Priority Justification:**
Medium - Not immediately blocking but affects maintainability. Should be addressed when working in these areas.

**Status:** In Progress

**Progress:**
- ✅ `ScriptFormatter.tsx` reduced from 717 to 175 lines (2025-11-18)
- ✅ `TrelloCardsManager.tsx` reduced from 533 to 165 lines (2025-11-18)
- ✅ `VideoLinksManager.tsx` reduced from 559 to 169 lines (2025-11-18)
- Remaining: 4 files still exceed 500 lines

**Target Resolution:** Q2 2026 (opportunistic refactoring)

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

**Status:** Open

**Target Resolution:** Q1 2026

**Notes:**
- Consider Tauri's WebDriver integration
- May need headless testing setup for CI

---

### DEBT-010: BakerPage Component Tests Require Rewrite

**Category:** Test

**Severity:** Medium

**Created:** 2025-11-17

**Location:**
- `tests/component/BakerPage.test.tsx` - 9 tests skipped

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

**Priority Justification:**
Medium - Baker is a major feature but has good contract test coverage. Component tests would add confidence.

**Status:** Open

**Target Resolution:** Q1 2026

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
- Code Quality: 5 items (DEBT-001, 002, 003, 008, 011)
- Architecture: 1 item (DEBT-004)
- Test: 2 items (DEBT-009, 010)
- Documentation: 0 items
- Dependency: 1 item (DEBT-012)
- Performance: 0 items
- Security: 0 items
- Infrastructure: 0 items
- Design: 0 items

### By Severity
- Critical: 0 items
- High: 2 items (DEBT-002, 003)
- Medium: 4 items (DEBT-001, 004, 009, 010)
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
3. **Sprint Q1 2026**: Address high-priority complexity and nesting issues (DEBT-002, 003)
4. **Sprint Q1 2026**: Implement E2E testing infrastructure (DEBT-009)
5. **Q2 2026**: Opportunistic refactoring of large files and cleanup

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
   - [ ] Create tickets for top 3 high-priority items

2. **Next Sprint:**
   - [ ] Begin refactoring most complex functions (DEBT-002)
   - [ ] Implement no-console ESLint rule for production (DEBT-001)
   - [ ] Address deep nesting issues (DEBT-003)

3. **Next Quarter:**
   - [ ] Complete complexity reduction (DEBT-002, 003)
   - [ ] Set up E2E testing infrastructure (DEBT-009)
   - [ ] Rewrite BakerPage tests (DEBT-010)

---

## Notes

**Analysis Date:** 2025-11-17
**Analysis Method:** Automated script analysis + manual review
**Test Status:** 479 passing, 31 skipped (100% pass rate)
**Overall Code Health:** Good - codebase is functional with well-tested components. Primary debt is in code complexity and missing integration tests. No critical security issues identified.

**Positive Highlights:**
- Excellent test coverage with 100% pass rate
- No deprecated package dependencies
- Active development with recent refactoring
- Strong TypeScript usage (no `any` in production code) ✅
- Modern tech stack (React 18, TanStack Query, Tauri 2.0)
- Good parameter management using options interfaces ✅
- 3 debt items resolved since initial register

**Areas of Concern:**
- High cyclomatic complexity in core business logic functions
- Deep nesting making code hard to follow
- 247 console statements need cleanup
- Missing E2E test infrastructure
