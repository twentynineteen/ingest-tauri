# Technical Debt Register

**Project:** Bucket (ingest-tauri)
**Last Updated:** 2025-11-19
**Maintained By:** Development Team

## Summary

- **Total Debt Items:** 1
- **Resolved:** 1
- **Open:** 0
- **Estimated Remaining Effort:** None

---

## Active Debt Items

### DEBT-008: Magic Numbers (170 instances) ✅

**Category:** Code Quality

**Severity:** Low

**Created:** 2025-11-17

**Resolved:** 2025-11-19

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
  - Cache/query timing (REALTIME, SHORT, BRIEF, QUICK, STANDARD, MEDIUM, LONG, EXTENDED, PERSISTENT)
  - Validation limits (URL_MAX_LENGTH, FILE_MAX_SIZE, etc.)
  - Helper function `getBackoffDelay()` for exponential backoff
- ✅ Updated `src/lib/query-utils.ts` to use timing constants
  - QUERY_PROFILES now use CACHE and RETRY constants
  - Retry strategies use `getBackoffDelay()` helper
- ✅ Updated `src/utils/validation.ts` to use LIMITS constants
  - URL length validation uses LIMITS.URL_MAX_LENGTH
- ✅ Updated `src/App.tsx` to use timing constants (2025-11-19)
  - QueryClient staleTime, gcTime, retry, and retryDelay use constants
  - Uses `getBackoffDelay()` helper for exponential backoff
- ✅ Updated `src/lib/query-client-config.ts` to use timing constants (2025-11-19)
  - TauriStorePersister uses CACHE.PERSISTENT for maxAge
  - DEFAULT_PERSISTENCE_CONFIG uses timing constants
  - createPersistedQueryClient uses CACHE, RETRY, and getBackoffDelay
  - QueryClientOptimizer cleanup thresholds use CACHE constants
  - QueryClientProfiles use CACHE and RETRY constants
- ✅ Updated `src/lib/prefetch-strategies.ts` to use timing constants (2025-11-19)
  - All prefetch methods use CACHE constants for staleTime and gcTime
  - cleanupExpiredPrefetches uses CACHE.EXTENDED
- ✅ Updated 12 hooks to use timing constants (2025-11-19)
  - useImageRefresh, useAutoFileSelection, useUploadEvents
  - useCameraAutoRemap, useVersionCheck, useTrelloBoard
  - useZoomPan, useAuthCheck, useAIModels
  - useBreadcrumb, usePosterframeAutoRedraw, useApiKeys
- ✅ Updated 2 pages to use timing constants (2025-11-19)
  - FolderTreeNavigator, Settings
- ✅ Updated 1 component to use timing constants (2025-11-19)
  - nav-user
- ✅ Updated 3 services to use timing constants (2025-11-19)
  - ai/providerConfig, cache-invalidation, UserFeedbackService

**Status:** Completed ✅

**Target Resolution:** Q2 2026 (opportunistic)

---

## Debt Trends

### By Category
- Code Quality: 0 items (all resolved)

### By Severity
- All items resolved

---

## Next Actions

- [x] Complete migration of magic numbers to timing constants (DEBT-008) ✅

---

## Notes

**Analysis Date:** 2025-11-17
**Test Status:** 463 passing, 19 skipped (100% pass rate)
**Overall Code Health:** Excellent

**Highlights:**
- All critical, high, medium, and low severity items resolved
- Strong TypeScript usage
- Modern tech stack (React 18, TanStack Query, Tauri 2.0)
- E2E testing infrastructure with CI integration
- Comprehensive logging utility
- Centralized timing constants in `src/constants/timing.ts`

**Remaining Work:**
All technical debt items have been resolved. The codebase is in excellent health with no outstanding debt items.
