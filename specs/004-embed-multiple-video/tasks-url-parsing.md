# Tasks: Sprout Video URL Parsing and API Fetching

**Feature**: 004-embed-multiple-video (Phase 2 - URL Auto-fetch)
**Input**: Design documents from `/specs/004-embed-multiple-video/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/tauri-commands.md
**User Requirement**: Users enter only Sprout Video URL → system parses video ID → fetches metadata from API → auto-populates form

## Execution Summary

This feature adds automatic metadata fetching for Sprout Video links in the Baker interface. The implementation follows TDD principles with frontend URL parsing, backend API integration via Tauri commands, and React Query hooks for state management.

**Tech Stack**:
- Frontend: TypeScript 5.7, React 18.3, TanStack React Query, Vitest
- Backend: Rust 1.75+, Tauri 2.0, reqwest, serde
- Testing: Vitest (frontend unit/integration), cargo test (backend)

**Project Structure**: Tauri app (frontend: `src/`, backend: `src-tauri/`)

---

## Phase 3.1: Setup & Dependencies

- [ ] **T001** [P] Add TypeScript types for SproutVideoDetails
  - File: `src/types/media.ts`
  - Add `SproutVideoDetails` interface matching Rust struct
  - Export from types barrel file

- [ ] **T002** [P] Verify Rust dependencies for HTTP requests
  - File: `src-tauri/Cargo.toml`
  - Ensure `reqwest` with JSON feature is present
  - Ensure `serde` and `serde_json` are present
  - No changes needed if already configured (just verification task)

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Frontend URL Parsing Tests

- [ ] **T003** [P] Unit test: parseSproutVideoUrl with public URL format
  - File: `src/utils/__tests__/parseSproutVideoUrl.test.ts` (NEW)
  - Test input: `"https://sproutvideo.com/videos/abc123xyz"`
  - Expected output: `"abc123xyz"`
  - Test MUST fail (function doesn't exist yet)

- [ ] **T004** [P] Unit test: parseSproutVideoUrl with embed URL format
  - File: `src/utils/__tests__/parseSproutVideoUrl.test.ts`
  - Test input: `"https://videos.sproutvideo.com/embed/abc123xyz/token"`
  - Expected output: `"abc123xyz"`
  - Test MUST fail

- [ ] **T005** [P] Unit test: parseSproutVideoUrl with invalid URL
  - File: `src/utils/__tests__/parseSproutVideoUrl.test.ts`
  - Test inputs: `"https://youtube.com/watch?v=123"`, `"not-a-url"`, `""`
  - Expected output: `null` for all invalid inputs
  - Test MUST fail

- [ ] **T006** [P] Unit test: parseSproutVideoUrl with malformed Sprout URLs
  - File: `src/utils/__tests__/parseSproutVideoUrl.test.ts`
  - Test inputs: `"https://sproutvideo.com/"`, `"https://sproutvideo.com/videos/"`
  - Expected output: `null`
  - Test MUST fail

### Backend Tauri Command Tests

- [ ] **T007** [P] Contract test: fetch_sprout_video_details with valid video ID
  - File: `src-tauri/src/commands/tests/sprout_video_tests.rs` (NEW)
  - Mock Sprout API with valid response
  - Assert: Returns `Ok(SproutVideoDetails)` with correct fields
  - Test MUST fail (command doesn't exist yet)

- [ ] **T008** [P] Contract test: fetch_sprout_video_details with 404 error
  - File: `src-tauri/src/commands/tests/sprout_video_tests.rs`
  - Mock Sprout API returning 404
  - Assert: Returns `Err` with message containing "404"
  - Test MUST fail

- [ ] **T009** [P] Contract test: fetch_sprout_video_details with network error
  - File: `src-tauri/src/commands/tests/sprout_video_tests.rs`
  - Mock network failure
  - Assert: Returns `Err` with connection error message
  - Test MUST fail

- [ ] **T010** [P] Contract test: fetch_sprout_video_details with invalid JSON
  - File: `src-tauri/src/commands/tests/sprout_video_tests.rs`
  - Mock API returning malformed JSON
  - Assert: Returns `Err` with parse error message
  - Test MUST fail

### Frontend React Hook Tests

- [ ] **T011** [P] Integration test: useSproutVideoApi hook success case
  - File: `src/hooks/__tests__/useSproutVideoApi.test.ts` (NEW)
  - Mock Tauri invoke to return valid SproutVideoDetails
  - Test calling `fetchVideoDetailsAsync` with valid URL
  - Assert: Hook returns data, isFetching states correct
  - Test MUST fail (hook doesn't exist yet)

- [ ] **T012** [P] Integration test: useSproutVideoApi hook with invalid URL
  - File: `src/hooks/__tests__/useSproutVideoApi.test.ts`
  - Test calling hook with `"https://youtube.com/watch"`
  - Assert: Hook throws error "Invalid Sprout Video URL format"
  - Test MUST fail

- [ ] **T013** [P] Integration test: useSproutVideoApi hook with API error
  - File: `src/hooks/__tests__/useSproutVideoApi.test.ts`
  - Mock Tauri invoke to reject with API error
  - Assert: Hook error state populated with error message
  - Test MUST fail

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

**Prerequisites**: All Phase 3.2 tests MUST be written and failing

### Frontend URL Parsing Implementation

- [ ] **T014** Implement parseSproutVideoUrl function
  - File: `src/utils/parseSproutVideoUrl.ts` (NEW)
  - Implement regex patterns for public and embed URLs
  - Return video ID string or null
  - Run tests → should now pass T003-T006

- [ ] **T015** Export parseSproutVideoUrl from utils barrel
  - File: `src/utils/index.ts`
  - Add export for `parseSproutVideoUrl`
  - Enables clean imports in other modules

### Backend Rust Implementation

- [ ] **T016** Create SproutVideoDetails struct in media module
  - File: `src-tauri/src/media.rs`
  - Define struct matching API response (id, title, description, duration, assets, created_at)
  - Add serde derives and field renames for camelCase/snake_case
  - Create SproutAssets nested struct for poster_frames

- [ ] **T017** Implement fetch_sprout_video_details Tauri command
  - File: `src-tauri/src/commands/sprout_video.rs` (or add to existing file)
  - Implement async function with reqwest HTTP GET
  - Add "SproutVideo-Api-Key" header
  - Parse JSON response to SproutVideoDetails
  - Error handling for network, HTTP status, JSON parsing
  - Run tests → should now pass T007-T010

- [ ] **T018** Register fetch_sprout_video_details in Tauri builder
  - File: `src-tauri/src/main.rs`
  - Add command to `.invoke_handler()` list
  - Ensures command is callable from frontend

### Frontend React Hook Implementation

- [ ] **T019** Create useSproutVideoApi hook
  - File: `src/hooks/useSproutVideoApi.ts` (NEW)
  - Import TanStack React Query `useMutation`
  - Import Tauri `invoke` and `parseSproutVideoUrl`
  - Implement `fetchVideoDetails` mutation with URL parsing + API call
  - Return mutation state (mutate, mutateAsync, isPending, error, data)
  - Run tests → should now pass T011-T013

- [ ] **T020** Export useSproutVideoApi from hooks barrel
  - File: `src/hooks/index.ts`
  - Add export for hook
  - Enables clean imports in components

---

## Phase 3.4: UI Integration

**Prerequisites**: Core implementation (T014-T020) complete

- [ ] **T021** Update VideoLinksManager to use URL auto-fetch
  - File: `src/components/Baker/VideoLinksManager.tsx`
  - Import `useSproutVideoApi` and `useSproutVideoApiKey`
  - Add "Fetch Details" button or auto-fetch on URL blur
  - Show loading state while fetching (`isFetching`)
  - Auto-populate title, thumbnailUrl, sproutVideoId on success
  - Display error message on failure
  - Allow manual override of auto-populated fields

- [ ] **T022** Add loading spinner for video fetch in dialog
  - File: `src/components/Baker/VideoLinksManager.tsx`
  - Use existing `Loader2` from lucide-react
  - Show inline spinner next to URL input when fetching
  - Disable form submission while fetching

- [ ] **T023** Add error alert for failed video fetch
  - File: `src/components/Baker/VideoLinksManager.tsx`
  - Use existing `Alert` component with destructive variant
  - Display API error message from hook
  - Include "Retry" option to re-fetch
  - Don't block manual entry if fetch fails

---

## Phase 3.5: Edge Cases & Polish

**Prerequisites**: UI integration (T021-T023) complete

- [ ] **T024** [P] Handle empty/whitespace URLs gracefully
  - File: `src/utils/parseSproutVideoUrl.ts`
  - Add trim() before regex matching
  - Update tests in `__tests__/parseSproutVideoUrl.test.ts`
  - Verify no API calls made for empty URLs

- [ ] **T025** [P] Add tooltip explaining supported URL formats
  - File: `src/components/Baker/VideoLinksManager.tsx`
  - Use Radix Tooltip primitive
  - Show example URLs on hover over "Video URL" label
  - "Supported: https://sproutvideo.com/videos/ID or embed URLs"

- [ ] **T026** [P] Unit test: Video form validation with fetched data
  - File: `src/components/Baker/__tests__/VideoLinksManager.test.tsx`
  - Mock successful API fetch
  - Assert: Form fields populated correctly
  - Assert: User can override auto-filled values
  - Test MUST pass (validates integration works)

- [ ] **T027** Add performance logging for API fetches
  - File: `src/hooks/useSproutVideoApi.ts`
  - Log fetch duration (performance.now() before/after)
  - Console.log if fetch exceeds 500ms threshold
  - Helps identify slow API responses

- [ ] **T028** Update CLAUDE.md with new feature
  - File: `CLAUDE.md` (repository root)
  - Add bullet point under "Phase 004" recent changes
  - Document `parseSproutVideoUrl` utility and `useSproutVideoApi` hook
  - Keep under 150 lines total

---

## Phase 3.6: Manual Testing & Validation

**Prerequisites**: All implementation tasks complete

- [ ] **T029** Manual test: Happy path URL fetch flow
  - Navigate to Baker page
  - Select test project with breadcrumbs
  - Click "Add Video" in Video Links section
  - Enter valid Sprout Video URL
  - Click outside URL input (blur)
  - **Expected**: Title, thumbnail auto-populate within 500ms
  - Click "Add Video" button
  - **Expected**: Video appears in list with correct metadata

- [ ] **T030** Manual test: Invalid URL handling
  - Click "Add Video" in Video Links section
  - Enter `"https://youtube.com/watch?v=123"`
  - Click outside URL input
  - **Expected**: Error message "Invalid Sprout Video URL format"
  - **Expected**: Form still functional, user can fix URL

- [ ] **T031** Manual test: API error handling (network offline)
  - Disconnect from internet
  - Click "Add Video"
  - Enter valid Sprout Video URL
  - Click outside URL input
  - **Expected**: Error message about network failure
  - **Expected**: Can still manually enter title and save

- [ ] **T032** Manual test: Manual override of auto-filled data
  - Click "Add Video"
  - Enter valid Sprout Video URL that auto-fills title "Original Title"
  - Change title to "Custom Title"
  - Click "Add Video"
  - **Expected**: Video saved with "Custom Title", not original

- [ ] **T033** Execute quickstart.md Workflow 1
  - File: `specs/004-embed-multiple-video/quickstart.md`
  - Follow complete workflow for multiple video upload
  - Verify each step completes successfully
  - Document any deviations or issues

---

## Dependencies

**Sequential Dependencies** (must complete in order):
1. Setup (T001-T002) → Tests (T003-T013)
2. Tests (T003-T013) → Implementation (T014-T020)
3. Implementation (T014-T020) → UI Integration (T021-T023)
4. UI Integration (T021-T023) → Polish (T024-T028)
5. All tasks → Manual Testing (T029-T033)

**Parallel Execution** (independent, can run concurrently):
- Within Phase 3.2: All test files (T003-T006 together, T007-T010 together, T011-T013 together)
- Within Phase 3.3: T014 (TypeScript) || T016-T018 (Rust) || T019-T020 (Hook)
- Within Phase 3.5: T024, T025, T026, T027, T028

---

## Parallel Execution Examples

### Run all frontend tests together (Phase 3.2):
```bash
# T003-T006: URL parsing tests
# T011-T013: Hook tests
npm run test src/utils/__tests__/parseSproutVideoUrl.test.ts src/hooks/__tests__/useSproutVideoApi.test.ts
```

### Run all Rust tests together (Phase 3.2):
```bash
# T007-T010: Tauri command tests
cd src-tauri && cargo test sprout_video_tests
```

### Implement in parallel (Phase 3.3):
```bash
# Terminal 1: Frontend URL parsing (T014-T015)
# Terminal 2: Backend Rust command (T016-T018)
# Terminal 3: Frontend hook (T019-T020)
# All three can be developed simultaneously
```

---

## Test Validation Checklist

**Gate: All must pass before proceeding to next phase**

Phase 3.2 → 3.3:
- [ ] All T003-T013 tests written and currently FAILING
- [ ] No implementation code exists yet
- [ ] Test coverage includes success, failure, edge cases

Phase 3.3 → 3.4:
- [ ] All T003-T013 tests now PASSING
- [ ] No test modifications made after implementation
- [ ] Code follows existing patterns (React Query, Tauri invoke)

Phase 3.5 → 3.6:
- [ ] T026 integration test passes
- [ ] No ESLint errors in modified files
- [ ] No TypeScript errors in project

---

## Task Completion Criteria

Each task is complete when:
1. **Code written**: Implementation matches specification
2. **Tests pass**: All related tests green (if applicable)
3. **Lint clean**: No ESLint/cargo clippy warnings
4. **Manual tested**: Functionality verified in running app
5. **Committed**: Git commit with descriptive message

---

## Notes

- **TDD Enforcement**: Phases 3.2 and 3.3 are strictly ordered. Do NOT implement before tests fail.
- **API Key Required**: Ensure Sprout Video API key is configured in Settings before manual testing
- **Mock Strategy**: Use `vi.mock('@tauri-apps/api/core')` for frontend tests, no real API calls
- **Error Messages**: Must be user-friendly, not raw API errors
- **Performance Target**: URL parsing <100ms, API fetch <500ms (log if exceeded)

---

## Validation Against Contracts

From `contracts/tauri-commands.md`:
- [x] Command #11 `fetch_sprout_video_details` - Tasks T007-T010, T016-T018
- [x] Hook `useSproutVideoApi` - Tasks T011-T013, T019-T020
- [x] URL parsing helper - Tasks T003-T006, T014-T015
- [x] UI integration in VideoLinksManager - Tasks T021-T023

All contract requirements covered by tasks ✅
