# Phase 4: Test Error Analysis & Resolution Plan

**Date:** January 2025
**Status:** 139 failing tests, 12 critical errors
**Goal:** Achieve 88%+ pass rate (450+ passing tests)

---

## Error Categories & Counts

### 🔴 Critical Errors (Blocking Test Execution)

| Error Type | Count | Impact | Priority |
|------------|-------|--------|----------|
| `No QueryClient set` | 22 | High - Blocks 11 files | P0 |
| Module resolution errors | 2 | High - Test files can't run | P0 |
| `unlisten is not a function` | 10 | Medium - Event cleanup | P1 |
| Missing promise in `.rejects` | 13 | Medium - Wrong assertions | P1 |

**Total Critical: 47 errors**

### 🟡 High-Priority Failures (Test Logic Issues)

| Error Type | Count | Category | Priority |
|------------|-------|----------|----------|
| `expected true to be false` | 65 | Assertion mismatch | P1 |
| `expected undefined to be defined` | 7 | Missing mock data | P1 |
| `Target cannot be null or undefined` | 3 | Null checks | P2 |
| `Cannot read properties of undefined` | 14 | Missing props/mocks | P2 |
| `Cannot read properties of null` | 2 | Null reference | P2 |

**Total Logic Errors: 91 failures**

### 🟢 Low-Priority (UI/Component Specific)

| Error Type | Count | Category |
|------------|-------|----------|
| TestingLibrary element not found | 6 | UI component |
| Query key issues (`not a function`) | 2 | Config |

**Total UI Errors: 8 failures**

---

## Detailed Analysis by Category

### 1. QueryClient Provider Issues (22 errors) 🔴

**Root Cause:** Tests using React Query hooks without QueryClientProvider wrapper

**Affected Files:**
- Tests in component/integration directories
- Custom hook tests without proper setup

**Fix Pattern:**
```typescript
// Bad - Missing provider
render(<Component />)

// Good - Wrapped with provider
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)
render(<Component />, { wrapper })
```

**Action Items:**
- [ ] Identify all 11 files with QueryClient errors
- [ ] Add QueryClientProvider wrapper to each test file
- [ ] Create reusable test utility for common setup
- [ ] Verify fixes don't break existing tests

---

### 2. Module Resolution Errors (2 errors) 🔴

**Errors:**
```
Error: Failed to resolve import "../../src/components/baker/ScanProgress"
Error: Cannot find module 'hooks/useBreadcrumb'
```

**Root Cause:** Incorrect import paths or case sensitivity

**Affected Files:**
- `tests/component/ScanProgress.test.tsx`
- `tests/component/BakerPage.test.tsx`

**Fix:**
- [ ] Check actual file path for `ScanProgress` (case sensitivity: `baker` vs `Baker`)
- [ ] Update import to use path alias (`@/hooks/useBreadcrumb`)

---

### 3. Event Listener Cleanup (10 errors) 🟡

**Error:** `TypeError: unlisten is not a function`

**Root Cause:** Tauri `listen()` mock returning wrong type

**Fix Pattern:**
```typescript
// Bad mock
vi.mocked(listen).mockResolvedValue(undefined)

// Good mock
const mockUnlisten = vi.fn()
vi.mocked(listen).mockResolvedValue(mockUnlisten)
```

**Action Items:**
- [ ] Update all Tauri event listener mocks
- [ ] Ensure cleanup functions are properly mocked
- [ ] Add type checking for mock return values

---

### 4. Promise Assertion Errors (13 errors) 🟡

**Error:** `TypeError: You must provide a Promise to expect() when using .rejects`

**Root Cause:** Using `.rejects` on synchronous/undefined values

**Affected Pattern:**
```typescript
// Bad - invoke returns undefined in mock
await expect(invoke('command', { args })).rejects.toThrow()

// Good - invoke must return a rejected promise
vi.mocked(invoke).mockRejectedValue(new Error('Test error'))
await expect(invoke('command', { args })).rejects.toThrow('Test error')
```

**Action Items:**
- [ ] Find all `.rejects` usage in Baker contract tests
- [ ] Ensure mocks return proper promises
- [ ] Add validation for promise-based assertions

---

### 5. Boolean Assertion Mismatches (65 errors) 🟡

**Error:** `AssertionError: expected true to be false`

**Likely Causes:**
1. Integration test expectations not matching actual behavior
2. Mock return values inverted
3. Test logic checking opposite condition

**Affected Files:**
- `tests/integration/example-management.test.tsx` (12 tests)
- `tests/unit/useBakerScan.test.ts`
- `tests/unit/hooks/useExampleManagement.test.ts`

**Investigation Needed:**
- [ ] Review each failing assertion context
- [ ] Check if component/hook behavior changed
- [ ] Update test expectations to match current implementation

---

### 6. Missing Mock Data (7 errors) 🟡

**Error:** `AssertionError: expected undefined to be defined`

**Root Cause:** Tauri invoke commands returning undefined instead of mock data

**Fix Pattern:**
```typescript
// Bad
vi.mocked(invoke).mockResolvedValue(undefined)

// Good
vi.mocked(invoke).mockResolvedValue({
  endTime: Date.now(),
  successful: true,
  created: []
})
```

**Action Items:**
- [ ] Map all Tauri commands to expected return types
- [ ] Create mock data factories for common responses
- [ ] Ensure all invoke mocks return appropriate data

---

### 7. Query Key Function Errors (2 errors) 🟢

**Errors:**
```
TypeError: queryKeys.trello.all is not a function
TypeError: queryKeys.sprout.all is not a function
```

**Root Cause:** Query keys not properly exported or mocked

**Fix:**
- [ ] Check `lib/query-keys.ts` for proper exports
- [ ] Verify `trello.all()` and `sprout.all()` are functions
- [ ] Update cache-invalidation tests if needed

---

## Resolution Roadmap

### Phase 4.1: Critical Error Fixes (Days 1-2)

**Blockers - Must fix first:**

1. ✅ **Fix QueryClient Provider Issues** (22 errors)
   - Create reusable test utility
   - Apply to all affected files
   - Target: 0 QueryClient errors

2. ✅ **Fix Module Resolution** (2 errors)
   - Correct import paths
   - Use path aliases
   - Target: 0 import errors

3. ✅ **Fix Event Listener Mocks** (10 errors)
   - Update Tauri listen mocks
   - Ensure proper cleanup
   - Target: 0 unlisten errors

**Expected Outcome:** ~34 errors fixed, ~105 failures remaining

---

### Phase 4.2: High-Priority Fixes (Days 3-4)

**Tauri Mock Issues:**

1. ✅ **Fix Promise Assertion Errors** (13 errors)
   - Update invoke mocks to return promises
   - Fix contract test patterns
   - Target: 0 promise errors

2. ✅ **Fix Missing Mock Data** (7 errors)
   - Add proper return values for Tauri commands
   - Create mock data factories
   - Target: 0 undefined errors

**Expected Outcome:** ~20 errors fixed, ~85 failures remaining

---

### Phase 4.3: Test Logic Fixes (Days 5-7)

**Assertion Updates:**

1. ✅ **Fix Boolean Assertion Mismatches** (65 errors)
   - Review integration test logic
   - Update expectations to match implementation
   - Fix inverted conditions
   - Target: <10 assertion errors

2. ✅ **Fix Null Reference Errors** (19 errors)
   - Add null checks in tests
   - Update mocks for nullable fields
   - Target: 0 null errors

**Expected Outcome:** ~75 errors fixed, ~20 failures remaining

---

### Phase 4.4: Cleanup & Stabilization (Day 8)

**Final Polish:**

1. ✅ **Fix Component Test Issues** (8 errors)
   - Update BakerPage test selectors
   - Fix TestingLibrary queries
   - Target: 0 component errors

2. ✅ **Fix Query Key Issues** (2 errors)
   - Verify query-keys exports
   - Update cache-invalidation mocks
   - Target: 0 query key errors

3. ✅ **Final Verification**
   - Run full test suite
   - Verify no regressions
   - Document any remaining issues

**Expected Outcome:** <10 failures, 0 critical errors

---

## Success Metrics

### Targets:

| Metric | Current | Target | Success Criteria |
|--------|---------|--------|------------------|
| **Passing Tests** | 371/510 (73%) | 450+/510 (88%) | ✅ >88% pass rate |
| **Failing Tests** | 139 | <20 | ✅ <4% failure rate |
| **Critical Errors** | 12 | 0 | ✅ Zero blockers |
| **Passing Files** | 33/57 (58%) | 50+/57 (88%) | ✅ Most files green |

### Key Performance Indicators:

- 🎯 **Zero blocking errors** - All tests can execute
- 🎯 **<20 failing tests** - Manageable remaining issues
- 🎯 **450+ passing tests** - Strong coverage foundation
- 🎯 **88%+ pass rate** - Industry standard reliability

---

## Test Utilities to Create

### 1. QueryClient Test Helper

```typescript
// tests/utils/queryClientWrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
}

export const createQueryWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}
```

### 2. Tauri Mock Factory

```typescript
// tests/utils/tauriMocks.ts
export const createTauriMocks = () => {
  const mockUnlisten = vi.fn()

  return {
    invoke: vi.fn(),
    listen: vi.fn().mockResolvedValue(mockUnlisten),
    mockUnlisten
  }
}

export const mockTauriCommand = (command: string, response: any) => {
  vi.mocked(invoke).mockImplementation((cmd, args) => {
    if (cmd === command) {
      return Promise.resolve(response)
    }
    return Promise.resolve(undefined)
  })
}
```

### 3. Mock Data Factories

```typescript
// tests/utils/mockDataFactories.ts
export const createMockBreadcrumbs = (overrides = {}) => ({
  projectTitle: 'Test Project',
  numberOfCameras: 2,
  files: [],
  creationDateTime: new Date().toISOString(),
  ...overrides
})

export const createMockBakerScanResult = (overrides = {}) => ({
  endTime: Date.now(),
  successful: [],
  failed: [],
  created: [],
  ...overrides
})
```

---

## Next Steps

1. ✅ Start with Phase 4.1 (Critical Errors)
2. ✅ Create test utilities for reusable patterns
3. ✅ Fix errors in priority order
4. ✅ Run tests after each fix batch
5. ✅ Update this document with progress
6. ✅ Achieve 88%+ pass rate target

---

**Estimated Time:** 6-8 working hours across 8 days
**Risk Level:** Low - Most errors are systematic with clear fix patterns
**Impact:** High - Will stabilize test suite for ongoing development
