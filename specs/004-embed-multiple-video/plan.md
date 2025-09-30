# Implementation Plan: Multiple Video Links and Trello Cards in Breadcrumbs

**Branch**: `004-embed-multiple-video` | **Date**: 2025-09-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-embed-multiple-video/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ COMPLETE: Spec loaded and analyzed
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ COMPLETE: All clarifications resolved with user input
   → Detect Project Type: Tauri desktop app (React frontend + Rust backend)
   → Structure Decision: Hybrid (src/ for frontend, src-tauri/ for backend)
3. Evaluate Constitution Check section below
   → ✅ COMPLETE: Deviations documented and justified
   → Update Progress Tracking: Initial Constitution Check - PASS WITH JUSTIFICATION
4. Execute Phase 0 → research.md
   → IN PROGRESS
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → PENDING
6. Re-evaluate Constitution Check section
   → PENDING: After Phase 1 design complete
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → PENDING
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
This feature extends the breadcrumbs system to support multiple video links and Trello cards per project. Final rendered videos from the 'renders' folder are uploaded to Sprout Video and manually associated with Trello cards. Baker displays all attached videos with cached thumbnails and fetches Trello card titles via API.

**Primary Requirements**:
- Convert `trelloCardUrl` (string) → `trelloCards` (array of {url, cardId, title})
- Add `videoLinks` array: {url, title, thumbnailUrl, sproutVideoId, uploadDate}
- Maintain backward compatibility (string → array migration)
- Enhance UploadSprout to associate videos with projects
- Baker preview with thumbnails and fetched Trello titles

**Technical Approach**:
- TypeScript interface extensions with backward-compatible migration
- Rust serde for JSON array serialization
- React components for link management UI
- Trello API integration (GET /1/cards/{id}) for card titles
- Cached thumbnail URLs (no real-time fetching)

## Technical Context
**Language/Version**:
- Frontend: TypeScript 5.7 + React 18.3
- Backend: Rust 2021 edition with Tauri 2.0

**Primary Dependencies**:
- Frontend: Vite 6.1, TailwindCSS, Radix UI, Zustand, TanStack Query
- Backend: tokio (async), serde (JSON), tauri plugins
- APIs: Trello REST API, Sprout Video (URLs only, no API calls)

**Storage**: JSON files (breadcrumbs.json) in project folders

**Testing**:
- Frontend: Vitest + Testing Library
- Backend: cargo test
- Integration: Tauri command tests with real file system

**Target Platform**: macOS desktop (Tauri cross-platform)

**Project Type**: Hybrid Tauri (src/ React, src-tauri/ Rust)

**Performance Goals**:
- Breadcrumb file read/write <50ms
- Baker UI render for 20 videos <100ms
- No impact on existing Baker scan performance

**Constraints**:
- Must not break existing breadcrumbs files (backward compatibility critical)
- Trello API rate limits (existing integration handles this)
- No hard limits on videos/cards (reasonable UX guidance only)

**Scale/Scope**:
- Typical: 2-5 videos, 2-3 Trello cards per project
- Maximum tested: 20 videos, 10 cards
- Baker scans 100s of projects simultaneously

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Tauri monolithic app)
- Using framework directly? YES (Tauri IPC, React hooks, no abstractions)
- Single data model? YES (BreadcrumbsFile with JSON serde)
- Avoiding patterns? YES (no Repository/UoW, direct file I/O)

**Architecture**:
- EVERY feature as library? **DEVIATION**: Tauri architecture requires integrated frontend/backend
- Libraries listed: N/A (Tauri monolithic structure)
- CLI per library: N/A (GUI desktop app)
- Library docs: N/A (internal feature)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES
- Git commits show tests before implementation? YES
- Order: Contract→Integration→E2E→Unit? YES
- Real dependencies used? YES (actual file system)
- Integration tests for: schema changes, Tauri command contracts
- FORBIDDEN: Implementation before failing tests

**Observability**:
- Structured logging? YES (console.log frontend, println! backend)
- Frontend logs → backend? PARTIAL (Tauri events)
- Error context sufficient? YES (Result types, UI error states)

**Versioning**:
- Version assigned? YES (0.8.3 → 0.9.0, MINOR bump)
- BUILD increments? YES
- Breaking changes handled? YES (migration logic for compatibility)

## Project Structure

### Documentation (this feature)
```
specs/004-embed-multiple-video/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── breadcrumbs-schema.json
│   └── tauri-commands.md
└── tasks.md             # Phase 2 (/tasks command)
```

### Source Code (repository root - Tauri structure)
```
src/                           # React frontend
├── types/
│   └── baker.ts              # MODIFY: BreadcrumbsFile, add VideoLink, TrelloCard
├── pages/
│   ├── Baker/                # MODIFY: Multi-link preview UI
│   └── UploadSprout.tsx      # MODIFY: Associate video with project
├── components/
│   ├── VideoLinksManager.tsx # NEW: Manage video array
│   ├── TrelloCardsManager.tsx # NEW: Manage Trello array
│   └── Baker/                # MODIFY: Enhanced preview
├── hooks/
│   ├── useVideoLinks.ts      # NEW: Video CRUD operations
│   ├── useTrelloCards.ts     # NEW: Trello CRUD + API fetch
│   └── useTrelloBoard.ts     # EXISTS: Reuse for API calls
└── utils/
    └── breadcrumbsMigration.ts # NEW: String→array migration

src-tauri/                     # Rust backend
├── src/
│   ├── baker.rs              # MODIFY: Handle array-based breadcrumbs
│   ├── breadcrumbs.rs        # NEW: Migration + validation
│   └── commands.rs           # MODIFY: Add video/Trello commands
└── Cargo.toml                # No changes

tests/
├── unit/
│   ├── breadcrumbsMigration.test.ts
│   └── videoLinks.test.ts
└── integration/
    └── multiLinkBreadcrumbs.test.ts
```

**Structure Decision**: Hybrid Tauri (React in src/, Rust in src-tauri/)

## Phase 0: Outline & Research

### Unknowns to Research:
1. **Sprout Video URLs**: What format? How to extract video ID? Thumbnail URL patterns?
2. **Trello API**: Parse card ID from URL, GET /1/cards/{id} response schema
3. **JSON Migration**: Best practices for backward-compatible schema evolution in Rust serde
4. **Array Management UI**: React patterns for drag-and-drop reordering

### Research Tasks:
```
Task 1: Analyze Sprout Video URL structure
  - Examine existing UploadSprout.tsx for URL patterns
  - Determine thumbnail URL format
  - Document metadata available at upload time

Task 2: Trello API Integration
  - Review /1/cards/{id} endpoint documentation
  - Test with existing useTrelloBoard credentials
  - Define TrelloCard type from API response

Task 3: Serde Migration Patterns
  - Research #[serde(default)] and #[serde(alias)]
  - Test string-or-array deserialization
  - Plan migration function approach

Task 4: React Array Management
  - Research dnd-kit or react-beautiful-dnd for reordering
  - Plan add/remove/reorder UI patterns
  - Consider Radix UI components for modals
```

### Output: research.md
Document decisions on:
- Sprout Video URL/thumbnail patterns
- Trello API integration approach
- Serde migration strategy (string | string[])
- UI component library choices

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

### 1. Data Model (data-model.md)

**Entities**:

```typescript
// NEW: Video link with metadata
interface VideoLink {
  url: string                    // Sprout Video URL
  sproutVideoId?: string         // Extracted ID
  title: string                  // User-provided or from upload
  thumbnailUrl?: string          // Cached from Sprout Video
  uploadDate?: string            // ISO timestamp
  sourceRenderFile?: string      // Original file in renders/
}

// NEW: Trello card with fetched metadata
interface TrelloCard {
  url: string                    // Full Trello card URL
  cardId: string                 // Extracted from URL
  title: string                  // Fetched from API
  boardName?: string             // Fetched from API
  lastFetched?: string           // ISO timestamp of last API call
}

// MODIFIED: BreadcrumbsFile with arrays
interface BreadcrumbsFile {
  // ... existing fields ...

  // DEPRECATED (but supported for migration):
  trelloCardUrl?: string

  // NEW:
  videoLinks?: VideoLink[]
  trelloCards?: TrelloCard[]
}
```

**Migration Rules**:
- If `trelloCardUrl` exists (string) and `trelloCards` is null → migrate to array
- If both exist → use `trelloCards`, ignore old field
- Write always uses new array format

**Validation Rules**:
- VideoLink.url must be valid HTTPS URL
- TrelloCard.url must match pattern `/c/{cardId}/`
- Arrays can be empty (valid state)

### 2. API Contracts (contracts/)

**Tauri Commands**:

```typescript
// contracts/tauri-commands.md

Command: add_video_link
Input: { projectPath: string, videoLink: VideoLink }
Output: Result<(), string>
Errors: "Project not found", "Invalid breadcrumbs", "Invalid video URL"

Command: remove_video_link
Input: { projectPath: string, index: number }
Output: Result<(), string>
Errors: "Project not found", "Index out of bounds"

Command: reorder_video_links
Input: { projectPath: string, fromIndex: number, toIndex: number }
Output: Result<(), string>

Command: add_trello_card
Input: { projectPath: string, cardUrl: string }
Output: Result<TrelloCard, string>
Note: Extracts card ID, fetches title from API, returns full TrelloCard

Command: remove_trello_card
Input: { projectPath: string, index: number }
Output: Result<(), string>

Command: get_breadcrumbs_with_videos
Input: { projectPath: string }
Output: Result<BreadcrumbsFile, string>
Note: Performs migration if needed, returns updated format
```

**JSON Schema** (contracts/breadcrumbs-schema.json):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "videoLinks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["url", "title"],
        "properties": {
          "url": { "type": "string", "format": "uri" },
          "sproutVideoId": { "type": "string" },
          "title": { "type": "string" },
          "thumbnailUrl": { "type": "string", "format": "uri" },
          "uploadDate": { "type": "string", "format": "date-time" },
          "sourceRenderFile": { "type": "string" }
        }
      }
    },
    "trelloCards": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["url", "cardId", "title"],
        "properties": {
          "url": { "type": "string", "format": "uri" },
          "cardId": { "type": "string" },
          "title": { "type": "string" },
          "boardName": { "type": "string" },
          "lastFetched": { "type": "string", "format": "date-time" }
        }
      }
    },
    "trelloCardUrl": {
      "type": "string",
      "description": "DEPRECATED: Use trelloCards array"
    }
  }
}
```

### 3. Contract Tests (to be written first, must FAIL)

```typescript
// tests/contract/videoLinks.test.ts
describe('Video Links Tauri Commands', () => {
  test('add_video_link adds to array', async () => {
    // WILL FAIL: Command doesn't exist yet
  })

  test('remove_video_link removes by index', async () => {
    // WILL FAIL: Command doesn't exist yet
  })
})

// tests/integration/breadcrumbsMigration.test.ts
describe('Breadcrumbs Migration', () => {
  test('reads old trelloCardUrl as array', async () => {
    // Create old format file
    // Read with new code
    // Assert migrated to array
    // WILL FAIL: Migration not implemented
  })
})
```

### 4. User Story Tests (quickstart.md)

```markdown
# Quickstart: Multiple Videos and Trello Cards

## Story 1: Add Multiple Videos
1. Open project in Baker
2. Click "Add Video" button
3. Enter Sprout Video URL and title
4. Verify video appears in list with thumbnail
5. Repeat for 2 more videos
6. Verify all 3 videos saved in breadcrumbs.json

## Story 2: Associate Trello Cards
1. In same project, click "Add Trello Card"
2. Paste Trello card URL
3. Verify card title fetched automatically from API
4. Add second card
5. Verify both cards saved

## Story 3: Baker Preview
1. Navigate to Baker
2. Scan folder containing test project
3. Expand project breadcrumbs
4. Verify all 3 videos displayed with thumbnails
5. Verify both Trello cards displayed with titles
6. Click video link → opens Sprout Video
7. Click Trello card → opens Trello

## Story 4: Upload and Associate
1. In UploadSprout page
2. Select video file from renders/ folder
3. Upload to Sprout Video
4. After upload, see "Associate with Project" button
5. Select project from dropdown
6. Verify video added to project's breadcrumbs

## Story 5: Migration
1. Create old-format breadcrumbs with trelloCardUrl (string)
2. Open in Baker
3. Add second Trello card
4. Verify both cards now in array
5. Verify old trelloCardUrl field removed
```

### 5. Update CLAUDE.md

Add to existing CLAUDE.md:
```markdown
## Feature: Multiple Video Links and Trello Cards (004)

**Context**: Projects can now have multiple Sprout Video links and Trello cards in a single breadcrumbs file.

**Key Changes**:
- `BreadcrumbsFile.videoLinks[]` - Array of video metadata
- `BreadcrumbsFile.trelloCards[]` - Array of Trello card info
- Migration: Old `trelloCardUrl` (string) → `trelloCards` (array)
- Trello API: Fetch card titles using GET /1/cards/{id}
- Cached thumbnails: Store URL in breadcrumbs, no real-time fetching

**UI Components**:
- `VideoLinksManager` - Add/remove/reorder videos
- `TrelloCardsManager` - Add/remove Trello cards with API fetch
- Baker preview - Display all videos and cards

**Testing**: TDD required - write failing tests first, then implement
```

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

### Task Generation Strategy

The /tasks command will generate numbered, ordered tasks by:

1. **Extracting from Phase 1 artifacts**:
   - Parse `data-model.md` for entity definitions → Create model implementation tasks
   - Parse `contracts/tauri-commands.md` for command signatures → Create Tauri command tasks
   - Parse `contracts/test-scenarios.md` for test cases → Create test implementation tasks
   - Parse `quickstart.md` for user workflows → Create integration test tasks

2. **Following TDD order** (RED-GREEN-Refactor):
   - Contract test tasks BEFORE implementation tasks
   - Each test task marked with expected failure (RED)
   - Each implementation task references which test it makes pass (GREEN)
   - Refactor tasks at end of each phase

3. **Grouping by architectural layer**:
   - **Data Layer**: TypeScript interfaces, Rust structs, validation logic
   - **Backend Layer**: Tauri commands, API integrations, file operations
   - **Frontend Layer**: React hooks, UI components, state management
   - **Integration Layer**: Baker preview, UploadSprout workflow, E2E tests

4. **Marking parallelizable tasks**:
   - Tasks that modify different files can be marked [P]
   - Tasks within same phase but different modules can run in parallel
   - Example: Writing VideoLink tests [P] can be parallel with TrelloCard tests [P]

### Expected Task Breakdown

**Phase A: Foundation (TDD RED) - 8 tasks**
1. [P] Write VideoLink validation contract tests → `tests/contract/video_link_validation.test.ts` (MUST FAIL)
2. [P] Write TrelloCard validation contract tests → `tests/contract/trello_card_validation.test.ts` (MUST FAIL)
3. [P] Write backward compatibility tests → `tests/contract/backward_compatibility.test.ts` (MUST FAIL)
4. [P] Define VideoLink TypeScript interface → `src/types/media.ts`
5. [P] Define TrelloCard TypeScript interface → `src/types/media.ts`
6. [P] Define VideoLink Rust struct with serde → `src-tauri/src/media.rs`
7. [P] Define TrelloCard Rust struct with serde → `src-tauri/src/media.rs`
8. Update BreadcrumbsFile types (TypeScript + Rust) → `src/types/baker.ts`, `src-tauri/src/baker.rs`

**Phase B: Validation & Migration (TDD GREEN for Phase A) - 6 tasks**
9. Implement VideoLink validation logic → Make tests from task 1 pass
10. Implement TrelloCard validation logic → Make tests from task 2 pass
11. [P] Implement TypeScript migration utilities → `src/utils/breadcrumbsMigration.ts`
12. [P] Implement Rust migration in baker.rs → Update `baker_read_breadcrumbs`
13. Verify all Phase A tests pass → Run test suite, fix failures
14. Refactor: Extract common validation patterns

**Phase C: Backend Commands (TDD RED then GREEN) - 10 tasks**
15. Write Tauri command contract tests → `tests/contract/tauri_commands.test.ts` (MUST FAIL)
16. Implement `baker_associate_video_link` command → `src-tauri/src/baker.rs`
17. Implement `baker_remove_video_link` command → `src-tauri/src/baker.rs`
18. Implement `baker_update_video_link` command → `src-tauri/src/baker.rs`
19. Implement `baker_reorder_video_links` command → `src-tauri/src/baker.rs`
20. Implement `baker_associate_trello_card` command → `src-tauri/src/baker.rs`
21. Implement `baker_remove_trello_card` command → `src-tauri/src/baker.rs`
22. Implement `baker_fetch_trello_card_details` (with API) → `src-tauri/src/trello_integration.rs`
23. Implement `baker_get_video_links` / `baker_get_trello_cards` → `src-tauri/src/baker.rs`
24. Verify all Phase C tests pass → Run contract tests, fix failures

**Phase D: Frontend Hooks & Components (Parallel after Phase C) - 8 tasks**
25. [P] Implement `useBreadcrumbsVideoLinks` hook → `src/hooks/useBreadcrumbsVideoLinks.ts`
26. [P] Implement `useBreadcrumbsTrelloCards` hook → `src/hooks/useBreadcrumbsTrelloCards.ts`
27. [P] Create VideoLinkCard component → `src/components/Baker/VideoLinkCard.tsx`
28. [P] Create TrelloCardItem component → `src/components/Baker/TrelloCardItem.tsx`
29. [P] Create VideoLinksManager component → `src/components/Baker/VideoLinksManager.tsx`
30. [P] Create TrelloCardsManager component → `src/components/Baker/TrelloCardsManager.tsx`
31. Add validation UI feedback (toast notifications) → Update components
32. Write component unit tests → `tests/unit/components/`

**Phase E: Integration (Serial, after Phase D) - 6 tasks**
33. Update Baker preview to show videos/cards → `src/components/Baker/BreadcrumbsViewer.tsx`
34. Update UploadSprout workflow to associate videos → `src/pages/UploadSprout.tsx`
35. Implement `upload_video_and_associate` command → `src-tauri/src/commands/sprout_upload.rs`
36. Write integration tests → `tests/integration/video_upload_association.test.ts`
37. Write Baker preview integration tests → `tests/integration/baker_preview.test.tsx`
38. Execute quickstart.md manual validation → All 6 workflows

**Phase F: Polish & Documentation - 3 tasks**
39. Performance optimization (review array operations, cache invalidation)
40. Error message improvement (user-facing messages)
41. Update user documentation in app (help tooltips, placeholder text)

**Total Estimated Tasks**: 41 tasks

### Ordering Constraints

**Dependencies**:
- Tasks 9-14 depend on tasks 1-8 (models must exist before validation)
- Tasks 16-24 depend on tasks 9-14 (validation must work before commands)
- Tasks 25-32 depend on tasks 16-24 (backend must exist before frontend)
- Tasks 33-38 depend on tasks 25-32 (components must exist before integration)
- Tasks 39-41 depend on tasks 33-38 (polish after integration works)

**Parallelization Opportunities**:
- Within Phase A: Tasks 1-7 all [P]
- Within Phase D: Tasks 25-30 all [P]
- Tests can be written in parallel to implementation (different files)

### Task Format (tasks.md)

Each task will be formatted as:
```markdown
### Task N: [Title] [P if parallelizable]

**Phase**: [A/B/C/D/E/F]
**Type**: [Test/Implementation/Integration/Refactor]
**Dependencies**: Tasks [list of task numbers]
**Files Modified**: [list of file paths]

**Description**:
[What needs to be done]

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

**Expected Test State**: [FAIL/PASS/N/A]
```

**IMPORTANT**: This phase description is complete. The /tasks command will execute this strategy to generate tasks.md.

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (TDD execution following tasks.md)
**Phase 5**: Validation (quickstart.md, all tests passing, performance checks)

## Complexity Tracking
*Justified deviations from Constitution*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| No library-per-feature | Tauri monolithic architecture | Tauri requires single app build; splitting frontend/backend would break IPC |
| No CLI per library | GUI desktop application | CLI doesn't apply to Tauri desktop apps with React UI |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command) - tasks.md NOT YET CREATED
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (with justified deviations)
- [x] Post-Design Constitution Check: PASS (no new violations introduced)
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

**Phase 1 Outputs** (Created):
- ✅ `specs/004-embed-multiple-video/research.md` (5 research areas resolved)
- ✅ `specs/004-embed-multiple-video/data-model.md` (VideoLink, TrelloCard, BreadcrumbsFile schemas)
- ✅ `specs/004-embed-multiple-video/contracts/tauri-commands.md` (10 Tauri commands + TypeScript hooks)
- ✅ `specs/004-embed-multiple-video/contracts/test-scenarios.md` (6 test suites, TDD approach, complete mocking strategy)
  - Tauri command mocks using @tauri-apps/api/mocks
  - API mocks for Trello + Sprout Video using MSW
  - Test utilities and factory functions
  - Rust unit tests using tempfile crate
- ✅ `specs/004-embed-multiple-video/quickstart.md` (6 user workflows with verification)
- ✅ `CLAUDE.md` updated with Phase 004 context

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*