# Tasks: Multiple Video Links and Trello Cards in Breadcrumbs

**Feature**: 004-embed-multiple-video
**Branch**: `004-embed-multiple-video`
**Input**: Design documents from `/specs/004-embed-multiple-video/`

## Overview

This document breaks down the implementation of multiple video links and Trello cards support into 41 executable tasks following TDD principles (RED-GREEN-Refactor).

**Key Requirements**:
- Convert single `trelloCardUrl` string → `trelloCards[]` array
- Add `videoLinks[]` array with Sprout Video metadata
- Maintain backward compatibility (legacy migration)
- Enhance Baker preview with thumbnails and Trello titles
- Update UploadSprout workflow for video association

**Tech Stack**:
- Frontend: TypeScript 5.7 + React 18.3 + Vite 6.1 + TanStack Query
- Backend: Rust 2021 + Tauri 2.0 + serde + tokio
- Testing: Vitest + @tauri-apps/api/mocks + MSW

---

## Phase A: Foundation & Test Setup (TDD RED) 🔴

**CRITICAL**: All tests in this phase MUST be written and MUST FAIL before proceeding to Phase B.

### T001 [P] Create test infrastructure files

**Phase**: Setup
**Type**: Infrastructure
**Dependencies**: None
**Files Created**:
- `tests/setup/tauri-mocks.ts`
- `tests/setup/trello-handlers.ts`
- `tests/setup/sprout-handlers.ts`
- `tests/utils/test-helpers.ts`

**Description**:
Set up the testing infrastructure for mocking Tauri commands, Trello API, and Sprout Video API. Create factory functions for test data.

**Acceptance Criteria**:
- [ ] `tauri-mocks.ts` exports `setupTauriMocks()` with Map-based storage
- [ ] `trello-handlers.ts` exports MSW handlers for GET /1/cards/{cardId}
- [ ] `sprout-handlers.ts` exports MSW handlers for POST /v1/videos
- [ ] `test-helpers.ts` exports `createTestBreadcrumbs()`, `createMockVideoLink()`, `createMockTrelloCard()`
- [ ] MSW server extended in `tests/setup/msw-server.ts`

**Expected Test State**: N/A (infrastructure only)

---

### T002 [P] Write VideoLink validation contract tests

**Phase**: A (Foundation)
**Type**: Test
**Dependencies**: T001
**Files Created**:
- `tests/contract/video_link_validation.test.ts`

**Description**:
Write failing tests for VideoLink validation logic covering URL format, title requirements, optional fields, and array size limits (max 20 videos).

**Acceptance Criteria**:
- [ ] Test: Accept valid HTTPS video URL with title
- [ ] Test: Accept all optional fields (sproutVideoId, thumbnailUrl, uploadDate, sourceRenderFile)
- [ ] Test: Reject non-HTTPS URL
- [ ] Test: Reject empty title
- [ ] Test: Reject title exceeding 200 characters
- [ ] Test: Reject URL exceeding 2048 characters
- [ ] Test: Reject non-HTTPS thumbnail URL
- [ ] Test: Reject invalid ISO 8601 upload date
- [ ] Test: Reject adding 21st video link (max 20 enforced)
- [ ] All tests MUST FAIL (validation function does not exist yet)

**Expected Test State**: ❌ FAIL (no implementation yet)

---

### T003 [P] Write TrelloCard validation contract tests

**Phase**: A (Foundation)
**Type**: Test
**Dependencies**: T001
**Files Created**:
- `tests/contract/trello_card_validation.test.ts`

**Description**:
Write failing tests for TrelloCard validation including URL pattern matching, cardId extraction, and duplicate detection (max 10 cards).

**Acceptance Criteria**:
- [ ] Test: Accept valid Trello URL and extract cardId
- [ ] Test: Accept all optional fields (boardName, lastFetched)
- [ ] Test: Reject non-Trello URL
- [ ] Test: Reject mismatched cardId (not matching URL)
- [ ] Test: Reject empty title
- [ ] Test: Reject title exceeding 200 characters
- [ ] Test: Reject duplicate cardId within same breadcrumbs
- [ ] Test: Reject adding 11th Trello card (max 10 enforced)
- [ ] All tests MUST FAIL (validation function does not exist yet)

**Expected Test State**: ❌ FAIL (no implementation yet)

---

### T004 [P] Write backward compatibility migration tests

**Phase**: A (Foundation)
**Type**: Test
**Dependencies**: T001
**Files Created**:
- `tests/contract/backward_compatibility.test.ts`

**Description**:
Write failing tests for legacy breadcrumbs migration from single `trelloCardUrl` string to `trelloCards[]` array.

**Acceptance Criteria**:
- [ ] Test: Read legacy breadcrumbs with single `trelloCardUrl` → auto-migrate to `trelloCards[]` array (in-memory)
- [ ] Test: Write new format with both `trelloCards[]` and backward-compatible `trelloCardUrl`
- [ ] Test: Preserve `trelloCardUrl` when adding additional cards (first card remains in legacy field)
- [ ] Test: Handle breadcrumbs with only new array fields (no legacy field)
- [ ] Test: Original file remains unchanged during in-memory migration
- [ ] All tests MUST FAIL (migration logic does not exist yet)

**Expected Test State**: ❌ FAIL (no implementation yet)

---

### T005 [P] Define VideoLink TypeScript interface

**Phase**: A (Foundation)
**Type**: Implementation
**Dependencies**: None
**Files Modified**:
- `src/types/media.ts` (create new file)

**Description**:
Create TypeScript interface for VideoLink with all fields from data-model.md.

**Acceptance Criteria**:
- [ ] Interface exported with correct field types
- [ ] Optional fields marked with `?`
- [ ] JSDoc comments for each field
- [ ] Matches Rust struct naming convention (camelCase for TypeScript)

**Expected Test State**: N/A (type definition only)

---

### T006 [P] Define TrelloCard TypeScript interface

**Phase**: A (Foundation)
**Type**: Implementation
**Dependencies**: None
**Files Modified**:
- `src/types/media.ts`

**Description**:
Create TypeScript interface for TrelloCard with all fields from data-model.md.

**Acceptance Criteria**:
- [ ] Interface exported with correct field types
- [ ] Optional fields marked with `?`
- [ ] JSDoc comments for each field
- [ ] Matches Rust struct naming convention

**Expected Test State**: N/A (type definition only)

---

### T007 [P] Define VideoLink Rust struct with serde

**Phase**: A (Foundation)
**Type**: Implementation
**Dependencies**: None
**Files Created**:
- `src-tauri/src/media.rs`

**Description**:
Create Rust VideoLink struct with serde annotations for JSON serialization matching TypeScript interface.

**Acceptance Criteria**:
- [ ] Struct derives `Debug, Clone, Serialize, Deserialize`
- [ ] Uses `#[serde(rename = "camelCase")]` for field names
- [ ] Optional fields use `Option<T>` with `skip_serializing_if = "Option::is_none"`
- [ ] Matches TypeScript interface exactly

**Expected Test State**: N/A (data structure only)

---

### T008 [P] Define TrelloCard Rust struct with serde

**Phase**: A (Foundation)
**Type**: Implementation
**Dependencies**: None
**Files Modified**:
- `src-tauri/src/media.rs`

**Description**:
Create Rust TrelloCard struct with serde annotations for JSON serialization.

**Acceptance Criteria**:
- [ ] Struct derives `Debug, Clone, Serialize, Deserialize`
- [ ] Uses `#[serde(rename = "camelCase")]` for field names
- [ ] Optional fields use `Option<T>` with `skip_serializing_if`
- [ ] Matches TypeScript interface exactly

**Expected Test State**: N/A (data structure only)

---

### T009 Update BreadcrumbsFile types with new arrays

**Phase**: A (Foundation)
**Type**: Implementation
**Dependencies**: T005, T006, T007, T008
**Files Modified**:
- `src/types/baker.ts`
- `src-tauri/src/baker.rs`

**Description**:
Add `videoLinks?: VideoLink[]` and `trelloCards?: TrelloCard[]` fields to BreadcrumbsFile interface/struct. Keep legacy `trelloCardUrl?: string` for backward compatibility.

**Acceptance Criteria**:
- [ ] TypeScript: `videoLinks?: VideoLink[]` added to BreadcrumbsFile interface
- [ ] TypeScript: `trelloCards?: TrelloCard[]` added to BreadcrumbsFile interface
- [ ] TypeScript: Legacy `trelloCardUrl?: string` preserved
- [ ] Rust: `video_links: Option<Vec<VideoLink>>` added with serde rename
- [ ] Rust: `trello_cards: Option<Vec<TrelloCard>>` added with serde rename
- [ ] Rust: Legacy `trello_card_url` preserved
- [ ] Both use `skip_serializing_if` for optional arrays

**Expected Test State**: N/A (type extension only)

---

## Phase B: Validation & Migration (TDD GREEN) ✅

**Objective**: Make Phase A tests pass by implementing validation and migration logic.

### T010 Implement VideoLink validation logic

**Phase**: B (Validation)
**Type**: Implementation
**Dependencies**: T002, T005
**Files Created**:
- `src/utils/validation.ts`

**Description**:
Implement `validateVideoLink(link: VideoLink): string[]` function to make T002 tests pass.

**Acceptance Criteria**:
- [ ] Returns empty array for valid VideoLink
- [ ] Returns error array for invalid links
- [ ] Validates URL starts with `https://` and ≤2048 chars
- [ ] Validates title is non-empty and ≤200 chars
- [ ] Validates optional thumbnailUrl is HTTPS
- [ ] Validates optional uploadDate is ISO 8601 format
- [ ] All T002 tests now PASS

**Expected Test State**: ✅ PASS (T002 tests should pass)

---

### T011 Implement TrelloCard validation logic

**Phase**: B (Validation)
**Type**: Implementation
**Dependencies**: T003, T006
**Files Modified**:
- `src/utils/validation.ts`

**Description**:
Implement `validateTrelloCard(card: TrelloCard): string[]` and `extractTrelloCardId(url: string): string | null` to make T003 tests pass.

**Acceptance Criteria**:
- [ ] Returns empty array for valid TrelloCard
- [ ] Returns error array for invalid cards
- [ ] Validates URL matches `https://trello.com/c/[cardId]/.*` pattern
- [ ] Extracts cardId from URL (8-24 alphanumeric characters)
- [ ] Validates cardId matches extracted value from URL
- [ ] Validates title is non-empty and ≤200 chars
- [ ] All T003 tests now PASS

**Expected Test State**: ✅ PASS (T003 tests should pass)

---

### T012 [P] Implement TypeScript migration utilities

**Phase**: B (Validation)
**Type**: Implementation
**Dependencies**: T004, T005, T006
**Files Created**:
- `src/utils/breadcrumbsMigration.ts`

**Description**:
Create functions to migrate legacy breadcrumbs format to new array format (in-memory, non-destructive).

**Acceptance Criteria**:
- [ ] Function `migrateTrelloCardUrl(breadcrumbs: BreadcrumbsFile): TrelloCard[]`
  - If `trelloCards` exists, return it
  - If only `trelloCardUrl` exists, parse and return single-item array
  - If neither exists, return empty array
- [ ] Function `ensureBackwardCompatibleWrite(breadcrumbs: BreadcrumbsFile): BreadcrumbsFile`
  - Sets `trelloCardUrl` to first item in `trelloCards` array if present
  - Preserves existing behavior
- [ ] Partial T004 tests pass (TypeScript migration portion)

**Expected Test State**: ✅ PASS (partial - TypeScript tests)

---

### T013 [P] Implement Rust migration in baker.rs

**Phase**: B (Validation)
**Type**: Implementation
**Dependencies**: T004, T007, T008
**Files Modified**:
- `src-tauri/src/baker.rs`

**Description**:
Add helper methods to BreadcrumbsFile impl for migration: `get_trello_cards()` and `extract_trello_card_id()`.

**Acceptance Criteria**:
- [ ] Method `get_trello_cards(&self) -> Vec<TrelloCard>`:
  - Returns `trello_cards` if exists
  - Falls back to migrating `trello_card_url` if exists
  - Returns empty vec if neither exists
- [ ] Function `extract_trello_card_id(url: &str) -> Option<String>`:
  - Uses regex to extract cardId from Trello URL
  - Returns None for invalid URLs
- [ ] Rust portion of T004 tests pass

**Expected Test State**: ✅ PASS (all T004 tests should pass)

---

### T014 Verify Phase A tests pass

**Phase**: B (Validation)
**Type**: Verification
**Dependencies**: T010, T011, T012, T013
**Files Modified**: None

**Description**:
Run full test suite for Phase A (T002, T003, T004) and verify all tests pass.

**Acceptance Criteria**:
- [ ] `npm test tests/contract/video_link_validation.test.ts` → All PASS
- [ ] `npm test tests/contract/trello_card_validation.test.ts` → All PASS
- [ ] `npm test tests/contract/backward_compatibility.test.ts` → All PASS
- [ ] No test failures in contract tests

**Expected Test State**: ✅ PASS (all Phase A tests green)

---

### T015 Refactor: Extract common validation patterns

**Phase**: B (Validation)
**Type**: Refactor
**Dependencies**: T014
**Files Modified**:
- `src/utils/validation.ts`

**Description**:
Extract common validation patterns (URL validation, ISO date validation) into reusable helper functions.

**Acceptance Criteria**:
- [ ] Function `isValidHttpsUrl(url: string, maxLength?: number): boolean`
- [ ] Function `isValidIso8601(dateString: string): boolean`
- [ ] Function `isWithinLength(str: string, min: number, max: number): boolean`
- [ ] Refactor `validateVideoLink` and `validateTrelloCard` to use helpers
- [ ] All Phase A tests still pass after refactor

**Expected Test State**: ✅ PASS (no test changes)

---

## Phase C: Backend Tauri Commands (TDD RED → GREEN) 🔴→✅

### T016 Write Tauri command contract tests

**Phase**: C (Backend)
**Type**: Test
**Dependencies**: T015
**Files Created**:
- `tests/contract/tauri_commands.test.ts`

**Description**:
Write failing tests for all 10 Tauri commands defined in contracts/tauri-commands.md.

**Acceptance Criteria**:
- [ ] Test: `baker_associate_video_link` adds video to breadcrumbs
- [ ] Test: `baker_remove_video_link` removes video by index
- [ ] Test: `baker_update_video_link` updates video properties
- [ ] Test: `baker_reorder_video_links` reorders videos
- [ ] Test: `baker_associate_trello_card` adds Trello card
- [ ] Test: `baker_remove_trello_card` removes card
- [ ] Test: `baker_fetch_trello_card_details` fetches from Trello API (MSW mocked)
- [ ] Test: `baker_get_video_links` retrieves videos with migration
- [ ] Test: `baker_get_trello_cards` retrieves cards with migration
- [ ] Test: Error cases (invalid path, index out of bounds, API failures)
- [ ] Uses `setupTauriMocks()` from T001
- [ ] All tests MUST FAIL (commands not implemented yet)

**Expected Test State**: ❌ FAIL (no implementation yet)

---

### T017 Implement baker_associate_video_link command

**Phase**: C (Backend)
**Type**: Implementation
**Dependencies**: T016
**Files Modified**:
- `src-tauri/src/baker.rs`

**Description**:
Implement Tauri command to add a VideoLink to breadcrumbs.json file.

**Acceptance Criteria**:
- [ ] Function signature matches contract: `async fn baker_associate_video_link(project_path: String, video_link: VideoLink) -> Result<BreadcrumbsFile, String>`
- [ ] Validates project path exists and is directory
- [ ] Reads existing breadcrumbs.json
- [ ] Appends video_link to `video_links` array (creates if null)
- [ ] Validates total video links ≤20
- [ ] Sets `last_modified` timestamp
- [ ] Writes updated breadcrumbs to disk (pretty JSON)
- [ ] Returns updated BreadcrumbsFile
- [ ] T016 test for this command passes

**Expected Test State**: ✅ PASS (subset of T016)

---

### T018 Implement baker_remove_video_link command

**Phase**: C (Backend)
**Type**: Implementation
**Dependencies**: T016
**Files Modified**:
- `src-tauri/src/baker.rs`

**Description**:
Implement Tauri command to remove a VideoLink by index.

**Acceptance Criteria**:
- [ ] Function signature matches contract: `async fn baker_remove_video_link(project_path: String, video_index: usize) -> Result<BreadcrumbsFile, String>`
- [ ] Validates video_index is within bounds
- [ ] Removes item from `video_links` array
- [ ] Sets `last_modified` timestamp
- [ ] Writes updated breadcrumbs
- [ ] Returns updated BreadcrumbsFile
- [ ] T016 test for this command passes

**Expected Test State**: ✅ PASS (subset of T016)

---

### T019 Implement baker_update_video_link command

**Phase**: C (Backend)
**Type**: Implementation
**Dependencies**: T016
**Files Modified**:
- `src-tauri/src/baker.rs`

**Description**:
Implement Tauri command to update an existing VideoLink's properties.

**Acceptance Criteria**:
- [ ] Function signature matches contract: `async fn baker_update_video_link(project_path: String, video_index: usize, updated_link: VideoLink) -> Result<BreadcrumbsFile, String>`
- [ ] Validates video_index is within bounds
- [ ] Validates updated_link using validation rules
- [ ] Replaces item at video_index
- [ ] Sets `last_modified` timestamp
- [ ] Writes updated breadcrumbs
- [ ] T016 test passes

**Expected Test State**: ✅ PASS (subset of T016)

---

### T020 Implement baker_reorder_video_links command

**Phase**: C (Backend)
**Type**: Implementation
**Dependencies**: T016
**Files Modified**:
- `src-tauri/src/baker.rs`

**Description**:
Implement Tauri command to reorder video links within breadcrumbs.

**Acceptance Criteria**:
- [ ] Function signature matches contract: `async fn baker_reorder_video_links(project_path: String, from_index: usize, to_index: usize) -> Result<BreadcrumbsFile, String>`
- [ ] Validates both indices are within bounds
- [ ] Reorders `video_links` array (move from_index to to_index)
- [ ] Sets `last_modified` timestamp
- [ ] Writes updated breadcrumbs
- [ ] T016 test passes

**Expected Test State**: ✅ PASS (subset of T016)

---

### T021 Implement baker_associate_trello_card command

**Phase**: C (Backend)
**Type**: Implementation
**Dependencies**: T016
**Files Modified**:
- `src-tauri/src/baker.rs`

**Description**:
Implement Tauri command to add a TrelloCard to breadcrumbs.json.

**Acceptance Criteria**:
- [ ] Function signature matches contract: `async fn baker_associate_trello_card(project_path: String, trello_card: TrelloCard) -> Result<BreadcrumbsFile, String>`
- [ ] Appends trello_card to `trello_cards` array (creates if null)
- [ ] Validates total cards ≤10
- [ ] Validates no duplicate cardId
- [ ] Updates `trello_card_url` to first card in array (backward compatibility)
- [ ] Sets `last_modified` timestamp
- [ ] Writes updated breadcrumbs
- [ ] T016 test passes

**Expected Test State**: ✅ PASS (subset of T016)

---

### T022 Implement baker_remove_trello_card command

**Phase**: C (Backend)
**Type**: Implementation
**Dependencies**: T016
**Files Modified**:
- `src-tauri/src/baker.rs`

**Description**:
Implement Tauri command to remove a TrelloCard by index.

**Acceptance Criteria**:
- [ ] Function signature matches contract: `async fn baker_remove_trello_card(project_path: String, card_index: usize) -> Result<BreadcrumbsFile, String>`
- [ ] Validates card_index is within bounds
- [ ] Removes item from `trello_cards` array
- [ ] Updates `trello_card_url` (new first card or null)
- [ ] Sets `last_modified` timestamp
- [ ] Writes updated breadcrumbs
- [ ] T016 test passes

**Expected Test State**: ✅ PASS (subset of T016)

---

### T023 Implement baker_fetch_trello_card_details command

**Phase**: C (Backend)
**Type**: Implementation
**Dependencies**: T016
**Files Created**:
- `src-tauri/src/trello_integration.rs`

**Description**:
Implement Tauri command to fetch card details from Trello REST API (GET /1/cards/{cardId}).

**Acceptance Criteria**:
- [ ] Function signature matches contract: `async fn baker_fetch_trello_card_details(card_url: String, api_key: String, api_token: String) -> Result<TrelloCard, String>`
- [ ] Extracts cardId from URL using `extract_trello_card_id`
- [ ] Makes HTTP GET request: `https://api.trello.com/1/cards/{cardId}?key={key}&token={token}`
- [ ] Parses response JSON for `name` (title) and `idBoard`
- [ ] Optionally fetches board name via GET `/1/boards/{idBoard}`
- [ ] Sets `last_fetched` to current timestamp
- [ ] Handles 401 (unauthorized), 404 (not found) errors
- [ ] T016 test passes (MSW mocks API)

**Expected Test State**: ✅ PASS (subset of T016)

---

### T024 Implement baker_get_video_links / baker_get_trello_cards

**Phase**: C (Backend)
**Type**: Implementation
**Dependencies**: T016
**Files Modified**:
- `src-tauri/src/baker.rs`

**Description**:
Implement read-only Tauri commands to retrieve videos/cards with automatic legacy migration.

**Acceptance Criteria**:
- [ ] Function `async fn baker_get_video_links(project_path: String) -> Result<Vec<VideoLink>, String>`
  - Reads breadcrumbs.json
  - Returns `video_links` if exists, else empty array
- [ ] Function `async fn baker_get_trello_cards(project_path: String) -> Result<Vec<TrelloCard>, String>`
  - Reads breadcrumbs.json
  - Calls `get_trello_cards()` method (handles migration)
  - Returns array
- [ ] No writes to disk (read-only)
- [ ] T016 tests pass

**Expected Test State**: ✅ PASS (subset of T016)

---

### T025 Verify all Phase C tests pass

**Phase**: C (Backend)
**Type**: Verification
**Dependencies**: T017-T024
**Files Modified**: None

**Description**:
Run full test suite for Tauri commands (T016) and verify all tests pass.

**Acceptance Criteria**:
- [ ] `npm test tests/contract/tauri_commands.test.ts` → All PASS
- [ ] All 10 commands have passing tests
- [ ] Error cases (invalid paths, out of bounds, API failures) handled correctly

**Expected Test State**: ✅ PASS (all T016 tests green)

---

## Phase D: Frontend Hooks & Components (Parallel) ⚙️

**Objective**: Create React components and custom hooks for UI. Tasks are parallel (different files).

### T026 [P] Implement useBreadcrumbsVideoLinks hook

**Phase**: D (Frontend)
**Type**: Implementation
**Dependencies**: T025
**Files Created**:
- `src/hooks/useBreadcrumbsVideoLinks.ts`

**Description**:
Create custom hook using TanStack React Query for managing video links with CRUD operations.

**Acceptance Criteria**:
- [ ] Hook accepts `{ projectPath: string }`
- [ ] useQuery to fetch video links via `baker_get_video_links`
- [ ] useMutation for `addVideoLink` (calls `baker_associate_video_link`)
- [ ] useMutation for `removeVideoLink` (calls `baker_remove_video_link`)
- [ ] useMutation for `updateVideoLink` (calls `baker_update_video_link`)
- [ ] useMutation for `reorderVideoLinks` (calls `baker_reorder_video_links`)
- [ ] Invalidates queries on success
- [ ] Returns `{ videoLinks, isLoading, addVideoLink, removeVideoLink, updateVideoLink, reorderVideoLinks, isUpdating }`

**Expected Test State**: N/A (will be tested in T032)

---

### T027 [P] Implement useBreadcrumbsTrelloCards hook

**Phase**: D (Frontend)
**Type**: Implementation
**Dependencies**: T025
**Files Created**:
- `src/hooks/useBreadcrumbsTrelloCards.ts`

**Description**:
Create custom hook for managing Trello cards with API fetch capability.

**Acceptance Criteria**:
- [ ] Hook accepts `{ projectPath: string }`
- [ ] useQuery to fetch cards via `baker_get_trello_cards`
- [ ] useMutation for `addTrelloCard` (calls `baker_associate_trello_card`)
- [ ] useMutation for `removeTrelloCard` (calls `baker_remove_trello_card`)
- [ ] useMutation for `fetchCardDetails` (calls `baker_fetch_trello_card_details`)
- [ ] Invalidates queries on success
- [ ] Returns `{ trelloCards, isLoading, addTrelloCard, removeTrelloCard, fetchCardDetails, isUpdating, isFetchingDetails }`

**Expected Test State**: N/A (will be tested in T032)

---

### T028 [P] Create VideoLinkCard component

**Phase**: D (Frontend)
**Type**: Implementation
**Dependencies**: T026
**Files Created**:
- `src/components/Baker/VideoLinkCard.tsx`

**Description**:
Create presentational component to display a single video link with thumbnail, title, and action buttons.

**Acceptance Criteria**:
- [ ] Props: `{ videoLink: VideoLink, onRemove: () => void, onMoveUp: () => void, onMoveDown: () => void, canMoveUp: boolean, canMoveDown: boolean }`
- [ ] Displays thumbnail image (or placeholder if missing)
- [ ] Shows video title and optional metadata (uploadDate, sourceRenderFile)
- [ ] External link to Sprout Video (opens in browser)
- [ ] Action buttons: Remove (trash icon), Move Up (arrow), Move Down (arrow)
- [ ] Uses Radix UI Button + Lucide icons
- [ ] Styled with TailwindCSS

**Expected Test State**: N/A (will be tested in T032)

---

### T029 [P] Create TrelloCardItem component

**Phase**: D (Frontend)
**Type**: Implementation
**Dependencies**: T027
**Files Created**:
- `src/components/Baker/TrelloCardItem.tsx`

**Description**:
Create presentational component to display a single Trello card with title, board name, and actions.

**Acceptance Criteria**:
- [ ] Props: `{ trelloCard: TrelloCard, onRemove: () => void, onRefresh: () => void }`
- [ ] Shows card title and optional board name
- [ ] Displays `lastFetched` timestamp (relative time, e.g., "2 days ago")
- [ ] External link to Trello card (opens in browser)
- [ ] Action buttons: Remove (trash), Refresh (if stale >7 days)
- [ ] Uses Radix UI + Lucide icons
- [ ] Styled with TailwindCSS

**Expected Test State**: N/A (will be tested in T032)

---

### T030 [P] Create VideoLinksManager component

**Phase**: D (Frontend)
**Type**: Implementation
**Dependencies**: T026, T028
**Files Created**:
- `src/components/Baker/VideoLinksManager.tsx`

**Description**:
Create container component for managing video links with add/remove/reorder UI.

**Acceptance Criteria**:
- [ ] Props: `{ projectPath: string }`
- [ ] Uses `useBreadcrumbsVideoLinks(projectPath)` hook
- [ ] Displays list of VideoLinkCard components
- [ ] "Add Video Link" button opens dialog with URL/title inputs
- [ ] Validates inputs using `validateVideoLink` before adding
- [ ] Handles reordering via VideoLinkCard up/down buttons
- [ ] Shows loading state during mutations
- [ ] Displays error toasts on validation failures
- [ ] Empty state message when no videos

**Expected Test State**: N/A (will be tested in T032)

---

### T031 [P] Create TrelloCardsManager component

**Phase**: D (Frontend)
**Type**: Implementation
**Dependencies**: T027, T029
**Files Created**:
- `src/components/Baker/TrelloCardsManager.tsx`

**Description**:
Create container component for managing Trello cards with add/remove/fetch UI.

**Acceptance Criteria**:
- [ ] Props: `{ projectPath: string, apiKey: string, apiToken: string }`
- [ ] Uses `useBreadcrumbsTrelloCards(projectPath)` hook
- [ ] Displays list of TrelloCardItem components
- [ ] "Add Trello Card" button opens dialog with URL input
- [ ] Automatically fetches card details via API when URL pasted
- [ ] Validates URL using `validateTrelloCard` before adding
- [ ] Shows loading state during API fetch
- [ ] Handles refresh action for stale cards (>7 days)
- [ ] Displays error toasts on failures
- [ ] Empty state message when no cards

**Expected Test State**: N/A (will be tested in T032)

---

### T032 Write component unit tests

**Phase**: D (Frontend)
**Type**: Test
**Dependencies**: T026-T031
**Files Created**:
- `tests/unit/components/VideoLinkCard.test.tsx`
- `tests/unit/components/TrelloCardItem.test.tsx`
- `tests/unit/components/VideoLinksManager.test.tsx`
- `tests/unit/components/TrelloCardsManager.test.tsx`

**Description**:
Write unit tests for all Phase D components and hooks using Vitest + Testing Library.

**Acceptance Criteria**:
- [ ] VideoLinkCard: Test rendering, button clicks, thumbnail display
- [ ] TrelloCardItem: Test rendering, external link, refresh logic
- [ ] VideoLinksManager: Test add video dialog, validation, CRUD operations
- [ ] TrelloCardsManager: Test add card dialog, API fetch, validation
- [ ] Use Tauri mocks from T001 for command invocations
- [ ] Use MSW for Trello API mocks
- [ ] All tests PASS

**Expected Test State**: ✅ PASS (all component tests green)

---

### T033 Add validation UI feedback (toast notifications)

**Phase**: D (Frontend)
**Type**: Enhancement
**Dependencies**: T032
**Files Modified**:
- `src/components/Baker/VideoLinksManager.tsx`
- `src/components/Baker/TrelloCardsManager.tsx`

**Description**:
Add user-friendly toast notifications for validation errors and success messages.

**Acceptance Criteria**:
- [ ] Import toast library (assuming existing toast system, e.g., Radix Toast)
- [ ] Show error toast for validation failures (e.g., "Video URL must use HTTPS")
- [ ] Show success toast on successful add/remove/update
- [ ] Show error toast for API failures (e.g., "Failed to fetch Trello card: 401 Unauthorized")
- [ ] Toasts auto-dismiss after 5 seconds
- [ ] Component tests updated to verify toast calls

**Expected Test State**: ✅ PASS (updated tests)

---

## Phase E: Integration (Serial) 🔗

**Objective**: Integrate components into existing app features (Baker, UploadSprout).

### T034 Update Baker preview to show videos/cards

**Phase**: E (Integration)
**Type**: Implementation
**Dependencies**: T033
**Files Modified**:
- `src/components/Baker/BreadcrumbsViewer.tsx`

**Description**:
Enhance BreadcrumbsViewer to display VideoLinksManager and TrelloCardsManager in tabs/sections.

**Acceptance Criteria**:
- [ ] Add "Videos" tab/section to BreadcrumbsViewer
- [ ] Render VideoLinksManager with projectPath
- [ ] Add "Trello Cards" tab/section
- [ ] Render TrelloCardsManager with projectPath and API credentials
- [ ] Tabs use Radix UI Tabs component
- [ ] Existing "Files" section remains functional
- [ ] Preview modal remains functional

**Expected Test State**: N/A (manual testing in T038)

---

### T035 Update UploadSprout workflow to associate videos

**Phase**: E (Integration)
**Type**: Implementation
**Dependencies**: T033
**Files Modified**:
- `src/pages/UploadSprout.tsx`

**Description**:
Add UI to associate uploaded Sprout Video with a project's breadcrumbs after upload completes.

**Acceptance Criteria**:
- [ ] After successful upload, show "Associate with Project" button
- [ ] Button opens dialog to select project folder (Tauri folder picker)
- [ ] On selection, calls `baker_associate_video_link` with:
  - `url`: Sprout Video URL from response
  - `sproutVideoId`: Extracted from response.id
  - `title`: From user input or response.title
  - `thumbnailUrl`: From response.assets.poster_frames[0]
  - `uploadDate`: From response.created_at
  - `sourceRenderFile`: Original filename
- [ ] Shows success/error toast
- [ ] Optional: Checkbox "Associate on upload" to auto-associate

**Expected Test State**: N/A (manual testing in T038)

---

### T036 Implement upload_video_and_associate command

**Phase**: E (Integration)
**Type**: Implementation
**Dependencies**: T025
**Files Created/Modified**:
- `src-tauri/src/commands/sprout_upload.rs` (modify existing upload logic)

**Description**:
Create combined Tauri command that uploads video to Sprout AND associates with breadcrumbs in one operation.

**Acceptance Criteria**:
- [ ] Function signature: `async fn upload_video_and_associate(file_path: String, api_key: String, folder_id: Option<String>, project_path: String, video_title: String) -> Result<(SproutUploadResponse, BreadcrumbsFile), String>`
- [ ] Uploads video to Sprout Video API (existing logic)
- [ ] On success, creates VideoLink from response
- [ ] Calls internal `baker_associate_video_link` logic
- [ ] Returns tuple of (SproutUploadResponse, updated BreadcrumbsFile)
- [ ] Emits progress events during upload
- [ ] Handles errors at each stage

**Expected Test State**: N/A (integration test in T037)

---

### T037 Write integration tests

**Phase**: E (Integration)
**Type**: Test
**Dependencies**: T034, T035, T036
**Files Created**:
- `tests/integration/video_upload_association.test.ts`

**Description**:
Write integration test for end-to-end video upload + association workflow.

**Acceptance Criteria**:
- [ ] Test: Upload video to Sprout (MSW mocked) + associate with breadcrumbs
- [ ] Verify SproutUploadResponse contains id, thumbnailUrl
- [ ] Verify BreadcrumbsFile updated with VideoLink
- [ ] Test: Handle Sprout API authentication failure (401)
- [ ] Test: Handle invalid project path
- [ ] All tests PASS

**Expected Test State**: ✅ PASS (integration tests green)

---

### T038 Write Baker preview integration tests

**Phase**: E (Integration)
**Type**: Test
**Dependencies**: T034
**Files Created**:
- `tests/integration/baker_preview.test.tsx`

**Description**:
Write integration test for Baker preview displaying multiple videos and Trello cards.

**Acceptance Criteria**:
- [ ] Test: Render BreadcrumbsViewer with breadcrumbs containing 2 videos
- [ ] Verify 2 video thumbnails displayed
- [ ] Verify external links to Sprout Video functional
- [ ] Test: Render with 3 Trello cards
- [ ] Verify card titles and board names displayed
- [ ] Verify external links to Trello functional
- [ ] All tests PASS

**Expected Test State**: ✅ PASS (integration tests green)

---

### T039 Execute quickstart.md manual validation

**Phase**: E (Integration)
**Type**: Validation
**Dependencies**: T037, T038
**Files Modified**: None

**Description**:
Execute all 6 user workflows from quickstart.md manually to verify end-to-end functionality.

**Acceptance Criteria**:
- [ ] Workflow 1: Upload multiple videos and associate with project ✅
- [ ] Workflow 2: Associate multiple Trello cards with project ✅
- [ ] Workflow 3: Reorder and remove videos ✅
- [ ] Workflow 4: Baker scan and preview multiple media ✅
- [ ] Workflow 5: Backward compatibility with legacy breadcrumbs ✅
- [ ] Workflow 6: Error handling and edge cases ✅
- [ ] All verification checklist items completed
- [ ] No critical bugs found

**Expected Test State**: N/A (manual validation)

---

## Phase F: Polish & Documentation 🎨

**Objective**: Optimize, improve UX, and document changes.

### T040 Performance optimization

**Phase**: F (Polish)
**Type**: Optimization
**Dependencies**: T039
**Files Modified**:
- `src/components/Baker/VideoLinksManager.tsx`
- `src/components/Baker/TrelloCardsManager.tsx`
- `src-tauri/src/baker.rs`

**Description**:
Review and optimize array operations, cache invalidation, and rendering performance.

**Acceptance Criteria**:
- [ ] Baker UI renders 20 videos + 10 cards in <100ms
- [ ] Query cache invalidation only affects relevant queries
- [ ] Lazy load video thumbnails (only when visible)
- [ ] Debounce validation on input fields
- [ ] No unnecessary re-renders in VideoLinksManager/TrelloCardsManager
- [ ] Rust file I/O uses buffered writes for breadcrumbs

**Expected Test State**: N/A (performance measured)

---

### T041 Error message improvement

**Phase**: F (Polish)
**Type**: Enhancement
**Dependencies**: T039
**Files Modified**:
- `src/utils/validation.ts`
- `src-tauri/src/baker.rs`
- All component files

**Description**:
Improve user-facing error messages to be clearer and more actionable.

**Acceptance Criteria**:
- [ ] Replace technical errors with user-friendly messages
- [ ] Example: "Failed to parse breadcrumbs" → "This project's breadcrumbs file is corrupted. Would you like to regenerate it?"
- [ ] Validation errors include suggestions (e.g., "Video URL must start with https://")
- [ ] API errors include retry actions (e.g., "Failed to fetch Trello card. [Retry]")
- [ ] All error messages reviewed and improved

**Expected Test State**: N/A (UX improvement)

---

### T042 Update user documentation in app

**Phase**: F (Polish)
**Type**: Documentation
**Dependencies**: T041
**Files Modified**:
- `src/components/Baker/VideoLinksManager.tsx`
- `src/components/Baker/TrelloCardsManager.tsx`
- `src/pages/UploadSprout.tsx`

**Description**:
Add help tooltips, placeholder text, and in-app guidance for new features.

**Acceptance Criteria**:
- [ ] "Add Video Link" button has tooltip: "Upload and associate Sprout Videos with this project"
- [ ] "Add Trello Card" input has placeholder: "Paste Trello card URL (https://trello.com/c/...)"
- [ ] Empty state messages are helpful (e.g., "No videos yet. Upload a video to get started.")
- [ ] Baker preview has info icon explaining multi-media support
- [ ] All new UI elements have accessible labels (aria-label)

**Expected Test State**: N/A (accessibility/UX improvement)

---

## Dependencies Graph

```
Setup & Foundation (Phase A):
T001 (Test Infrastructure)
├─→ T002 [P] (VideoLink Tests)
├─→ T003 [P] (TrelloCard Tests)
└─→ T004 [P] (Backward Compat Tests)

T005 [P] (VideoLink TS) ─┐
T006 [P] (TrelloCard TS) ─┤
T007 [P] (VideoLink Rust) ─┼─→ T009 (Update BreadcrumbsFile)
T008 [P] (TrelloCard Rust) ─┘

Validation & Migration (Phase B):
T002 + T005 ─→ T010 (VideoLink Validation)
T003 + T006 ─→ T011 (TrelloCard Validation)
T004 + T005-T008 ─→ T012 [P] (TS Migration) ─┐
T004 + T007-T008 ─→ T013 [P] (Rust Migration) ─┼─→ T014 (Verify Tests) ─→ T015 (Refactor)
                                                 ┘

Backend Commands (Phase C):
T015 ─→ T016 (Command Tests) ─┐
                               ├─→ T017-T024 (Implement Commands) ─→ T025 (Verify)
                               ┘

Frontend (Phase D - All [P]):
T025 ─→ T026 [P] (useVideoLinks Hook) ──────────┐
T025 ─→ T027 [P] (useTrelloCards Hook) ─────────┤
T026 ─→ T028 [P] (VideoLinkCard) ───────────────┤
T027 ─→ T029 [P] (TrelloCardItem) ──────────────┼─→ T032 (Component Tests) ─→ T033 (Toasts)
T026 + T028 ─→ T030 [P] (VideoLinksManager) ────┤
T027 + T029 ─→ T031 [P] (TrelloCardsManager) ───┘

Integration (Phase E - Serial):
T033 ─→ T034 (Baker Preview) ─────┐
T033 ─→ T035 (UploadSprout) ──────┤
T025 ─→ T036 (Combined Command) ──┼─→ T037 (Integration Tests) ─┐
T034 ─→ T038 (Baker Tests) ───────┘                              ├─→ T039 (Manual Validation)
                                                                  ┘

Polish (Phase F):
T039 ─→ T040 (Performance) ─→ T041 (Error Messages) ─→ T042 (Documentation)
```

---

## Parallel Execution Examples

### Phase A Foundation (7 parallel tasks):
```bash
# Launch T002-T008 together (all independent files):
npm test tests/contract/video_link_validation.test.ts &
npm test tests/contract/trello_card_validation.test.ts &
npm test tests/contract/backward_compatibility.test.ts &
# (Then implement T005-T008 in parallel)
```

### Phase D Frontend (6 parallel tasks):
```bash
# After T025 passes, launch T026-T031 together:
# Each task modifies a different file
```

---

## Task Execution Order

**Strict TDD Order**:
1. **Phase A** (T001-T009): Setup + Write failing tests + Define types
2. **Phase B** (T010-T015): Implement validation to make tests pass
3. **Phase C** (T016-T025): Write command tests → Implement commands
4. **Phase D** (T026-T033): Build UI components (parallel where possible)
5. **Phase E** (T034-T039): Integrate into app + validate
6. **Phase F** (T040-T042): Polish UX

**Checkpoints**:
- ✅ After T014: All Phase A tests pass (validation works)
- ✅ After T025: All Phase C tests pass (backend commands work)
- ✅ After T032: All component tests pass (UI works)
- ✅ After T038: All integration tests pass (end-to-end works)
- ✅ After T039: Manual validation complete (ready for PR)

---

## Notes

- **[P] Tasks**: Can run in parallel (different files, no dependencies)
- **TDD Critical**: Tests T002-T004, T016 MUST fail before implementing
- **Commit After Each Task**: Keep commits atomic for easy rollback
- **Backward Compatibility**: Test legacy breadcrumbs throughout
- **MSW Mocking**: All Trello/Sprout API calls mocked in tests
- **Performance**: Measure Baker rendering time in T040

---

## Validation Checklist

- [x] All contracts have corresponding tests (T016 covers 10 commands)
- [x] All entities have model tasks (T005-T008 for VideoLink, TrelloCard)
- [x] All tests come before implementation (Phases A-C follow TDD)
- [x] Parallel tasks truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

**Tasks Ready**: 42 tasks (T001-T042) across 6 phases
**Estimated Duration**: 3-5 days for experienced developer following TDD
**Next Step**: Begin with T001 to set up test infrastructure