# Technical Debt Register

**Project:** Bucket (ingest-tauri)
**Last Updated:** 2025-11-19
**Maintained By:** Development Team

## Summary

- **Total Debt Items:** 1
- **Resolved:** 0
- **Open:** 1 (low priority, opportunistic - DEBT-008)
- **Estimated Remaining Effort:** 1-2 days

---

## Active Debt Items

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

**Status:** In Progress

**Progress:**
- ✅ Created `src/constants/timing.ts` with centralized timing constants (2025-11-19)
  - Time unit helpers (SECONDS, MINUTES, HOURS)
  - API timeouts (DEFAULT, SHORT, AI_GENERATION, etc.)
  - Retry configuration (MAX_DELAY_DEFAULT, MAX_DELAY_MUTATION, etc.)
  - Cache/query timing (REALTIME, SHORT, STANDARD, MEDIUM, LONG)
  - Validation limits (URL_MAX_LENGTH, FILE_MAX_SIZE, etc.)
  - Helper function `getBackoffDelay()` for exponential backoff
- ✅ Updated `src/lib/query-utils.ts` to use timing constants
  - QUERY_PROFILES now use CACHE and RETRY constants
  - Retry strategies use `getBackoffDelay()` helper
- ✅ Updated `src/utils/validation.ts` to use LIMITS constants
  - URL length validation uses LIMITS.URL_MAX_LENGTH

**Target Resolution:** Q2 2026 (opportunistic)

---

## Debt Trends

### By Category
- Code Quality: 1 item (DEBT-008)

### By Severity
- Low: 1 item (DEBT-008)

---

## Next Actions

- [ ] Continue migrating remaining magic numbers opportunistically (DEBT-008)

---

## Notes

**Analysis Date:** 2025-11-17
**Test Status:** 463 passing, 19 skipped (100% pass rate)
**Overall Code Health:** Excellent

**Highlights:**
- All critical, high, and medium severity items resolved
- Strong TypeScript usage
- Modern tech stack (React 18, TanStack Query, Tauri 2.0)
- E2E testing infrastructure with CI integration
- Comprehensive logging utility

**Remaining Work:**
Only DEBT-008 (magic numbers) remains as a low-priority opportunistic item. Can be addressed during related work in Q2 2026.
