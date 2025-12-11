# Performance Optimization Plan - Bucket App

> **Methodology**: Test-Driven Development (TDD)
> **Quality Gates**: All changes must pass tests, eslint, and prettier before completion

---

## Phase 1: Critical List Rendering Optimizations
**Goal**: Eliminate unnecessary re-renders in list components
**Impact**: 🔴 HIGH - Immediate improvement in UI responsiveness
**Status**: ⬜ Not Started

### 1.1 Memoize ProjectListPanel Component
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/components/Baker/ProjectListPanel.test.tsx`
  - Add test for memo behavior (component doesn't re-render when props unchanged)
  - Test callback stability
- [ ] **Implementation**: Wrap `ProjectListPanel` with `React.memo()` in `src/components/Baker/ProjectListPanel.tsx`
- [ ] **Verify**: Tests pass (`bun test`)
- [ ] **Quality Gates**:
  - [ ] `bun run eslint:fix`
  - [ ] `bun run prettier:fix`
  - [ ] Manual test: Verify list performance with 50+ projects

### 1.2 Memoize ProjectList Component
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/components/Baker/ProjectList.test.tsx`
- [ ] **Implementation**: Wrap `ProjectList` with `React.memo()` in `src/components/Baker/ProjectList.tsx`
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 1.3 Memoize VideoLinkCard Component
- [ ] **Test First**: Use `test-specialist` to create/update tests for `VideoLinkCard`
- [ ] **Implementation**: Wrap component with `React.memo()` in `src/components/Baker/VideoLinksManager.tsx`
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 1.4 Memoize TrelloCardItem Component
- [ ] **Test First**: Use `test-specialist` to create/update tests for `TrelloCardItem`
- [ ] **Implementation**: Wrap component with `React.memo()` in `src/components/Baker/TrelloCardsManager.tsx`
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 1.5 Memoize ProjectFileList Items
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/pages/BuildProject/ProjectFileList.test.tsx`
- [ ] **Implementation**: Extract list item to separate memoized component in `src/pages/BuildProject/ProjectFileList.tsx`
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 1.6 Ensure Stable Callback References
- [ ] **Test First**: Use `test-specialist` to add tests for callback stability in parent components
- [ ] **Implementation**: Wrap callbacks with `useCallback` in `Baker.tsx` and `BuildProject.tsx`
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

**Phase 1 Complete**: [ ] All tasks done, tests passing, no linting errors

---

## Phase 2: Concurrency Control for File Operations
**Goal**: Prevent system overload during batch operations
**Impact**: 🔴 CRITICAL - Prevents UI freezes and file system throttling
**Status**: ⬜ Not Started

### 2.1 Install Concurrency Control Package
- [ ] **Action**: `bun add p-limit`
- [ ] **Verify**: Package installed successfully

### 2.2 Add Concurrency Limiter to useBreadcrumbsPreview
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/hooks/useBreadcrumbsPreview.test.ts`
  - Add test for concurrent operation limiting (max 5-10 concurrent)
  - Add test for progress tracking during batch operations
  - Mock `invoke` to track concurrent calls
- [ ] **Implementation**: Update `src/hooks/useBreadcrumbsPreview.ts`
  - Import `pLimit` from `p-limit`
  - Create limiter with `const limit = pLimit(5)` (or configurable)
  - Wrap preview operations in `limit(() => generatePreview(...))`
  - Add progress state/callbacks
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**:
  - [ ] `bun run eslint:fix`
  - [ ] `bun run prettier:fix`
  - [ ] Manual test: Scan 50+ projects, verify no system freeze

### 2.3 Add Progress Tracking UI
- [ ] **Test First**: Use `test-specialist` to add tests for progress UI components
- [ ] **Implementation**: Update Baker page to show batch progress
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

**Phase 2 Complete**: [ ] All tasks done, tests passing, no linting errors

---

## Phase 3: Virtual Scrolling for Large Lists
**Goal**: Reduce DOM nodes for large file/project lists
**Impact**: 🔴 HIGH - Better performance with 100+ items
**Status**: ⬜ Not Started

### 3.1 Install Virtual Scrolling Library
- [ ] **Action**: `bun add @tanstack/react-virtual`
- [ ] **Verify**: Package installed successfully

### 3.2 Add Virtual Scrolling to ProjectFileList
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/pages/BuildProject/ProjectFileList.test.tsx`
  - Test virtual scrolling behavior
  - Test that only visible items render
  - Test scroll position preservation
- [ ] **Implementation**: Update `src/pages/BuildProject/ProjectFileList.tsx`
  - Import `useVirtualizer` from `@tanstack/react-virtual`
  - Implement virtual scrolling for file list (when files.length > 50)
  - Preserve existing animations and interactions
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**:
  - [ ] `bun run eslint:fix`
  - [ ] `bun run prettier:fix`
  - [ ] Manual test: Load 200+ files, verify smooth scrolling

### 3.3 Add Virtual Scrolling to ProjectListPanel
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/components/Baker/ProjectListPanel.test.tsx`
- [ ] **Implementation**: Update `src/components/Baker/ProjectListPanel.tsx`
  - Implement virtual scrolling for project list (when projects.length > 50)
  - Preserve selection and hover states
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier
- [ ] Manual test: Load 100+ projects, verify smooth scrolling

**Phase 3 Complete**: [ ] All tasks done, tests passing, no linting errors

---

## Phase 4: Debouncing and Optimization
**Goal**: Reduce unnecessary computations and API calls
**Impact**: 🟡 MEDIUM-HIGH - Smoother user experience
**Status**: ⬜ Not Started

### 4.1 Debounce Posterframe Canvas Redraws
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/hooks/usePosterframeAutoRedraw.test.ts`
  - Test debouncing behavior (300ms delay)
  - Test that rapid title changes only trigger one redraw
- [ ] **Implementation**: Update `src/hooks/usePosterframeAutoRedraw.ts`
  - Add debounce utility or use `lodash.debounce`
  - Debounce the draw call with 300ms delay
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 4.2 Optimize Font Loading in Posterframe Canvas
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/hooks/usePosterframeCanvas.test.ts`
  - Test font loads only once on mount
- [ ] **Implementation**: Update `src/hooks/usePosterframeCanvas.ts`
  - Move font loading to component mount (useEffect with empty deps)
  - Remove font loading from draw callback
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 4.3 Remove Baker Scan Polling
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/hooks/useBakerScan.test.ts`
  - Test event-based updates work correctly
  - Remove polling-related tests
- [ ] **Implementation**: Update `src/hooks/useBakerScan.ts`
  - Remove 500ms polling interval (lines 109-125)
  - Rely solely on event-based updates (already exist)
  - Add manual refresh button if needed
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 4.4 Optimize Deep Equality Checks
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/utils/breadcrumbs/comparison.test.ts`
  - Test fast-path for primitive fields
  - Test shallow comparison where appropriate
- [ ] **Implementation**: Update `src/utils/breadcrumbs/comparison.ts`
  - Replace expensive `deepEqual` with optimized version
  - Use shallow comparison for known primitive fields
  - Add fast-path for common cases (same reference, null/undefined)
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

**Phase 4 Complete**: [ ] All tasks done, tests passing, no linting errors

---

## Phase 5: API and Data Fetching Optimizations
**Goal**: Reduce network requests and improve data loading
**Impact**: 🟡 MEDIUM - Faster external integrations
**Status**: ⬜ Not Started

### 5.1 Batch Trello API Requests
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/hooks/useTrelloCardDetails.test.ts`
  - Test single combined API call
  - Test response parsing for combined data
- [ ] **Implementation**: Update `src/hooks/useTrelloCardDetails.ts`
  - Combine card + members queries into single request
  - Use `?fields=all&members=true` parameter
  - Update type definitions if needed
  - Remove separate members query
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 5.2 Optimize Fuse.js Instance Stability
- [ ] **Test First**: Use `test-specialist` to update tests in `tests/unit/hooks/useFuzzySearch.test.ts`
  - Test Fuse instance doesn't rebuild with same data
  - Test deep comparison for items array
- [ ] **Implementation**: Update `src/hooks/useFuzzySearch.ts`
  - Add deep comparison for items array
  - Memoize Fuse instance more aggressively
  - Consider useMemo with stable dependencies
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

**Phase 5 Complete**: [ ] All tasks done, tests passing, no linting errors

---

## Phase 6: Animation Performance
**Goal**: Replace expensive animations with performant alternatives
**Impact**: 🟡 MEDIUM - Reduce layout thrashing
**Status**: ⬜ Not Started

### 6.1 Replace Framer Motion with CSS Transforms
- [ ] **Test First**: Use `test-specialist` to update tests for hover animations
  - Test CSS hover states apply correctly
  - Test accessibility (focus states)
- [ ] **Implementation**: Update `src/components/Baker/ProjectListPanel.tsx`
  - Replace framer-motion hover animations with CSS
  - Use CSS transforms and transitions
  - Add `will-change` hints for animated properties
  - Remove framer-motion dependency if no longer needed elsewhere
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**:
  - [ ] `bun run eslint:fix`
  - [ ] `bun run prettier:fix`
  - [ ] Manual test: Hover over 100+ projects, verify no jank

**Phase 6 Complete**: [ ] All tasks done, tests passing, no linting errors

---

## Phase 7: Final Polish and Best Practices
**Goal**: Fix remaining React best practices
**Impact**: 🟢 LOW - Code quality and minor performance gains
**Status**: ⬜ Not Started

### 7.1 Replace Index-based Keys with Stable IDs
- [ ] **Test First**: Use `test-specialist` to update tests for components with key issues
- [ ] **Implementation**: Update files with index-based keys
  - `src/components/Baker/ProjectDetailPanel.tsx` (line 321)
  - Any other components using `key={index}`
  - Use stable IDs (file path, unique identifier)
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 7.2 Add Missing useCallback Dependencies
- [ ] **Test First**: Use `test-specialist` to add tests for callback dependencies
- [ ] **Implementation**: Fix exhaustive-deps warnings
  - `src/hooks/useBuildProjectMachine.ts` (line 56 - add 'send' dependency)
  - Review other useCallback/useMemo hooks
- [ ] **Verify**: Tests pass
- [ ] **Quality Gates**: ESLint + Prettier

### 7.3 Final Performance Audit
- [ ] **Run comprehensive tests**: `bun test`
- [ ] **Run linting**: `bun run eslint:fix`
- [ ] **Run formatting**: `bun run prettier:fix`
- [ ] **Manual testing**: All workflows with large datasets
- [ ] **Performance measurements**: Document improvements

**Phase 7 Complete**: [ ] All tasks done, tests passing, no linting errors

---

## Success Metrics

Track these metrics before and after optimization:

### Before Optimization
- [ ] **List rendering time** (100+ items): ___ ms
- [ ] **Batch preview generation** (50 projects): ___ seconds
- [ ] **Canvas redraw frequency**: ___ per second
- [ ] **Memory usage during scans**: ___ MB
- [ ] **UI responsiveness**: User-reported issues

### After Optimization (Target)
- [ ] **List rendering time** (100+ items): < 100ms ✅
- [ ] **Batch preview generation** (50 projects): < 10 seconds ✅
- [ ] **Canvas redraw frequency**: < 1 per 300ms ✅
- [ ] **Memory usage during scans**: Stable (no leaks) ✅
- [ ] **UI responsiveness**: Smooth during all operations ✅

---

## Implementation Guidelines

### TDD Workflow for Each Task
1. **Red**: Use `test-specialist` to write/update tests first
2. **Red**: Run tests, verify they fail appropriately
3. **Green**: Implement production code changes
4. **Green**: Run tests, verify they pass
5. **Refactor**: Run eslint + prettier
6. **Commit**: Only when all checks pass

### Quality Gates Checklist
Every implementation must pass:
- [ ] `bun test` - All tests passing
- [ ] `bun run eslint:fix` - No linting errors
- [ ] `bun run prettier:fix` - Code formatted
- [ ] Manual testing with realistic data

### Commands Reference
```bash
# Run tests
bun test                    # All tests
bun test [pattern]          # Specific test file

# Code quality
bun run eslint:fix          # Fix linting issues
bun run prettier:fix        # Format code

# Development
bun run dev:tauri           # Test changes in dev mode

# Build (final verification)
bun run build:tauri         # Ensure production build works
```

---

## Notes

- **Prioritize user-facing workflows**: Focus on Baker scans and BuildProject file operations first
- **Test with realistic data**: Use 100+ files/projects for manual testing
- **Monitor performance**: Use browser DevTools Performance tab to verify improvements
- **Incremental commits**: Commit after each completed task with passing tests
- **Documentation**: Update component comments with performance considerations

---

## Progress Tracking

**Overall Progress**: 0 / 7 phases complete

- [ ] Phase 1: Critical List Rendering Optimizations
- [ ] Phase 2: Concurrency Control for File Operations
- [ ] Phase 3: Virtual Scrolling for Large Lists
- [ ] Phase 4: Debouncing and Optimization
- [ ] Phase 5: API and Data Fetching Optimizations
- [ ] Phase 6: Animation Performance
- [ ] Phase 7: Final Polish and Best Practices

**Last Updated**: 2025-12-11
