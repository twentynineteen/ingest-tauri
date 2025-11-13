# Tasks: AI Script Example Embedding Management

**Feature**: 007-frontend-script-example
**Input**: Design documents from `/specs/007-frontend-script-example/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: TypeScript 5.7, Rust (Tauri 2.0), React 18.3, rusqlite
   → Structure: Frontend (src/), Backend (src-tauri/)
2. Load design documents ✅
   → data-model.md: 5 entities (ExampleScript, Embedding, ExampleMetadata, etc.)
   → contracts/tauri-commands.md: 4 Tauri commands
   → contracts/react-components.md: 5 React components
   → research.md: Database migration, embedding workflow
3. Generate tasks by category ✅
   → Setup: 4 tasks (schema migration, types, dependencies)
   → Tests: 16 tasks (backend contract tests, frontend component tests)
   → Core: 15 tasks (Tauri commands, hooks, components)
   → Integration: 3 tasks (routing, navigation, E2E)
   → Polish: 3 tasks (docs, performance, validation)
4. Apply task rules ✅
   → Tests before implementation (TDD order)
   → [P] for parallel tasks (different files, no dependencies)
5. Total: 41 numbered tasks (T001-T041)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Database Migration

- [ ] **T001** Add `source` column to database schema
  - **File**: `src-tauri/resources/embeddings/examples.db`
  - **Action**: Execute migration SQL:
    ```sql
    ALTER TABLE example_scripts ADD COLUMN source TEXT DEFAULT 'bundled';
    CREATE INDEX IF NOT EXISTS idx_source ON example_scripts(source);
    UPDATE example_scripts SET source = 'bundled' WHERE source IS NULL;
    ```
  - **Verification**: Run `sqlite3 examples.db ".schema example_scripts"` to confirm
  - **Dependencies**: None (run first)

- [ ] **T002** [P] Create TypeScript types for example management
  - **File**: `src/types/exampleEmbeddings.ts` (new file)
  - **Action**: Define interfaces:
    - `ExampleWithMetadata`
    - `ExampleMetadata`
    - `ExampleCategory` enum
    - `UploadRequest`
    - `UploadError` type
    - `DeleteError` type
  - **Reference**: [data-model.md](./data-model.md#entity-definitions)
  - **Dependencies**: None

- [ ] **T003** [P] Add Rust types for example management
  - **File**: `src-tauri/src/commands/rag.rs`
  - **Action**: Add struct definitions at top of file:
    - `ExampleWithMetadata` (extends existing SimilarExample)
    - `ExampleMetadataInput`
    - `UploadRequest` (if needed)
  - **Reference**: [contracts/tauri-commands.md](./contracts/tauri-commands.md#command-definitions)
  - **Dependencies**: None

- [ ] **T004** Update build script to handle source column
  - **File**: `scripts/embed-examples.js`
  - **Action**: Modify INSERT statement to include `source='bundled'` for all examples
  - **Line**: ~line 105 (INSERT INTO example_scripts)
  - **Verification**: Run `npm run embed:examples` and check database
  - **Dependencies**: T001 (schema migration)

---

## Phase 3.2: Backend Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Backend Contract Tests (Rust)

- [ ] **T005** [P] Contract test for `get_all_examples_with_metadata`
  - **File**: `src-tauri/src/commands/tests/rag_tests.rs` (new file or extend existing)
  - **Action**: Write test that:
    - Sets up test database with bundled + user-uploaded examples
    - Calls `get_all_examples_with_metadata()`
    - Asserts correct number of examples returned
    - Asserts `source` field correctly set
    - Asserts tags converted from comma-separated to array
    - Asserts ordering by quality_score DESC, title ASC
  - **Expected**: Test FAILS (function not implemented yet)
  - **Dependencies**: T001, T003

- [ ] **T006** [P] Contract test for `upload_example` success case
  - **File**: `src-tauri/src/commands/tests/rag_tests.rs`
  - **Action**: Write test that:
    - Creates valid upload request with 384-dimension embedding
    - Calls `upload_example()`
    - Asserts UUID returned
    - Asserts example inserted into database
    - Asserts embedding inserted with correct dimensions
    - Asserts `source='user-uploaded'`
  - **Expected**: Test FAILS (function not implemented)
  - **Dependencies**: T001, T003

- [ ] **T007** [P] Contract test for `upload_example` validation errors
  - **File**: `src-tauri/src/commands/tests/rag_tests.rs`
  - **Action**: Write tests for validation failures:
    - Title too long (>200 chars) → validation error
    - Invalid category → validation error
    - Empty before_text → validation error
    - Wrong embedding dimensions (<> 384) → error message
    - before_text too short (<50 chars) → validation error
  - **Expected**: All tests FAIL
  - **Dependencies**: T001, T003

- [ ] **T008** [P] Contract test for `replace_example`
  - **File**: `src-tauri/src/commands/tests/rag_tests.rs`
  - **Action**: Write test that:
    - Creates user-uploaded example in test DB
    - Calls `replace_example()` with new content + embedding
    - Asserts example updated (before_text, after_text, word_count)
    - Asserts embedding updated
    - Asserts example ID unchanged
  - **Expected**: Test FAILS
  - **Dependencies**: T001, T003

- [ ] **T009** [P] Contract test for `replace_example` bundled rejection
  - **File**: `src-tauri/src/commands/tests/rag_tests.rs`
  - **Action**: Write test that:
    - Attempts to replace bundled example (source='bundled')
    - Asserts error: "Cannot replace bundled example: {id}"
  - **Expected**: Test FAILS
  - **Dependencies**: T001, T003

- [ ] **T010** [P] Contract test for `delete_example`
  - **File**: `src-tauri/src/commands/tests/rag_tests.rs`
  - **Action**: Write test that:
    - Creates user-uploaded example in test DB
    - Calls `delete_example(id)`
    - Asserts example removed from `example_scripts`
    - Asserts embedding removed from `embeddings` (CASCADE)
  - **Expected**: Test FAILS
  - **Dependencies**: T001, T003

- [ ] **T011** [P] Contract test for `delete_example` bundled rejection
  - **File**: `src-tauri/src/commands/tests/rag_tests.rs`
  - **Action**: Write test that:
    - Attempts to delete bundled example (source='bundled')
    - Asserts error: "Cannot delete bundled example: {id}"
  - **Expected**: Test FAILS
  - **Dependencies**: T001, T003

### Frontend Component Tests

- [ ] **T012** [P] Component test for ExampleEmbeddings page
  - **File**: `tests/pages/AI/ExampleEmbeddings/ExampleEmbeddings.test.tsx` (new file)
  - **Action**: Write tests that:
    - Renders page title and description
    - Shows upload button
    - Renders tab navigation (All, Bundled, Uploaded)
    - Opens upload dialog when button clicked
    - Opens delete dialog when example deleted
  - **Expected**: Tests FAIL (component not created)
  - **Dependencies**: T002

- [ ] **T013** [P] Component test for ExampleList
  - **File**: `tests/pages/AI/ExampleEmbeddings/ExampleList.test.tsx` (new file)
  - **Action**: Write tests that:
    - Renders loading skeleton when isLoading=true
    - Renders empty state when examples.length === 0
    - Renders grid of ExampleCards when examples provided
    - Calls onDelete when delete action triggered
    - Calls onReplace when replace action triggered
  - **Expected**: Tests FAIL
  - **Dependencies**: T002

- [ ] **T014** [P] Component test for ExampleCard
  - **File**: `tests/pages/AI/ExampleEmbeddings/ExampleCard.test.tsx` (new file)
  - **Action**: Write tests that:
    - Displays example title, category, source badge
    - Shows preview text (truncated to ~200 chars)
    - Displays tags as badges
    - Hides delete/replace buttons for bundled examples
    - Shows delete/replace buttons for user-uploaded examples
    - Calls onDelete when delete button clicked
  - **Expected**: Tests FAIL
  - **Dependencies**: T002

- [ ] **T015** [P] Component test for UploadDialog
  - **File**: `tests/pages/AI/ExampleEmbeddings/UploadDialog.test.tsx` (new file)
  - **Action**: Write tests that:
    - Renders form fields when open=true
    - Validates required fields (before file, after file, title, category)
    - Shows loading state during embedding generation
    - Calls onUpload with correct data structure
    - Closes on cancel
    - Shows validation errors for invalid inputs
  - **Expected**: Tests FAIL
  - **Dependencies**: T002

- [ ] **T016** [P] Component test for DeleteConfirm dialog
  - **File**: `tests/pages/AI/ExampleEmbeddings/DeleteConfirm.test.tsx` (new file)
  - **Action**: Write tests that:
    - Shows example title in warning message
    - Calls onConfirm when delete button clicked
    - Calls onClose when cancel button clicked
    - Shows loading state when isDeleting=true
  - **Expected**: Tests FAIL
  - **Dependencies**: T002

### Frontend Hook Tests

- [ ] **T017** [P] Hook test for useExampleManagement
  - **File**: `tests/hooks/useExampleManagement.test.ts` (new file)
  - **Action**: Write tests that:
    - Fetches examples using TanStack Query
    - Uploads example via mutation
    - Replaces example via mutation
    - Deletes example via mutation
    - Invalidates cache after mutations
    - Handles errors correctly
  - **Mock**: `invoke` from `@tauri-apps/api/core`
  - **Expected**: Tests FAIL (hook not created)
  - **Dependencies**: T002

- [ ] **T018** [P] Hook test for useFileUpload
  - **File**: `tests/hooks/useFileUpload.test.ts` (new file)
  - **Action**: Write tests that:
    - Reads file content from File object
    - Validates file extension (.txt only)
    - Validates file size (<1MB)
    - Validates UTF-8 encoding
    - Returns error for invalid files
  - **Expected**: Tests FAIL (hook not created)
  - **Dependencies**: T002

### Integration Tests

- [ ] **T019** [P] Integration test for upload → list workflow
  - **File**: `tests/integration/example-management.test.tsx` (new file)
  - **Action**: Write E2E test that:
    - Renders ExampleEmbeddings page
    - Opens upload dialog
    - Fills form with valid data
    - Submits upload
    - Verifies new example appears in list with "Uploaded" badge
    - Verifies tab counts updated
  - **Mock**: Tauri commands with mock data
  - **Expected**: Test FAILS
  - **Dependencies**: T002

- [ ] **T020** [P] Integration test for delete workflow
  - **File**: `tests/integration/example-management.test.tsx`
  - **Action**: Write E2E test that:
    - Renders page with user-uploaded example
    - Clicks delete button
    - Confirms deletion in dialog
    - Verifies example removed from list
    - Verifies tab counts updated
  - **Expected**: Test FAILS
  - **Dependencies**: T002

---

## Phase 3.3: Backend Implementation (ONLY after tests are failing)

**VERIFY BEFORE STARTING**: Run `cargo test` - all tests T005-T011 must FAIL

- [ ] **T021** Implement `get_all_examples_with_metadata` command
  - **File**: `src-tauri/src/commands/rag.rs`
  - **Action**: Implement function:
    - Open database connection to `embeddings/examples.db`
    - Query: `SELECT id, title, category, before_text, after_text, tags, word_count, quality_score, source, created_at FROM example_scripts ORDER BY quality_score DESC, title ASC`
    - Map rows to `ExampleWithMetadata` struct
    - Convert comma-separated tags to Vec<String>
    - Handle errors with descriptive messages
  - **Verification**: Run `cargo test` - T005 should now PASS
  - **Dependencies**: T005 (test must fail first)

- [ ] **T022** Implement validation helper functions
  - **File**: `src-tauri/src/commands/rag.rs`
  - **Action**: Add validation functions:
    - `validate_title(title: &str) -> Result<(), String>` (1-200 chars, no newlines)
    - `validate_category(category: &str) -> Result<(), String>` (enum check)
    - `validate_text_content(text: &str) -> Result<(), String>` (50-100k chars)
    - `validate_embedding_dimensions(embedding: &[f32]) -> Result<(), String>` (exactly 384)
    - `calculate_word_count(text: &str) -> i32`
  - **Verification**: Tests T007 should use these validators
  - **Dependencies**: T007 (test must exist)

- [ ] **T023** Implement `upload_example` command
  - **File**: `src-tauri/src/commands/rag.rs`
  - **Action**: Implement function:
    - Validate all inputs using T022 validators
    - Generate UUID v4 for new example ID
    - Calculate word count
    - Convert tags Vec<String> to comma-separated String
    - Begin transaction
    - INSERT INTO example_scripts with `source='user-uploaded'`
    - Convert Vec<f32> to BLOB (little-endian)
    - INSERT INTO embeddings
    - Commit transaction
    - Return new ID
  - **Verification**: Run `cargo test` - T006, T007 should PASS
  - **Dependencies**: T006, T007, T022 (tests and validators)

- [ ] **T024** Implement `replace_example` command
  - **File**: `src-tauri/src/commands/rag.rs`
  - **Action**: Implement function:
    - Validate inputs (same as upload)
    - Query example to check exists and source != 'bundled'
    - If bundled, return error: "Cannot replace bundled example"
    - Calculate new word count
    - Begin transaction
    - UPDATE example_scripts SET before_text, after_text, word_count
    - UPDATE embeddings SET embedding
    - Commit transaction
  - **Verification**: Run `cargo test` - T008, T009 should PASS
  - **Dependencies**: T008, T009, T022

- [ ] **T025** Implement `delete_example` command
  - **File**: `src-tauri/src/commands/rag.rs`
  - **Action**: Implement function:
    - Query example to check exists and source != 'bundled'
    - If bundled, return error: "Cannot delete bundled example"
    - Begin transaction
    - DELETE FROM embeddings WHERE script_id = ? (CASCADE handles this)
    - DELETE FROM example_scripts WHERE id = ?
    - Commit transaction
  - **Verification**: Run `cargo test` - T010, T011 should PASS
  - **Dependencies**: T010, T011

- [ ] **T026** Register new commands in Tauri
  - **File**: `src-tauri/src/main.rs`
  - **Action**: Add commands to `.invoke_handler()`:
    - `get_all_examples_with_metadata`
    - `upload_example`
    - `replace_example`
    - `delete_example`
  - **Verification**: Build runs without errors
  - **Dependencies**: T021, T023, T024, T025

---

## Phase 3.4: Frontend Hooks Implementation

**VERIFY BEFORE STARTING**: Run `npm test` - hook tests T017-T018 must FAIL

- [ ] **T027** [P] Implement useExampleManagement hook
  - **File**: `src/hooks/useExampleManagement.ts` (new file)
  - **Action**: Create hook with:
    - `useQuery` for fetching examples (calls `get_all_examples_with_metadata`)
    - `useMutation` for upload (calls `upload_example`, invalidates cache)
    - `useMutation` for replace (calls `replace_example`, invalidates cache)
    - `useMutation` for delete (calls `delete_example`, invalidates cache)
    - Query key: `['examples', 'list']`
    - Proper TypeScript types from T002
  - **Verification**: Run `npm test` - T017 should PASS
  - **Dependencies**: T017 (test), T002 (types)

- [ ] **T028** [P] Implement useFileUpload hook
  - **File**: `src/hooks/useFileUpload.ts` (new file)
  - **Action**: Create hook with:
    - `selectFile()` - Opens Tauri file dialog (.txt only)
    - `readFileContent(path: string)` - Reads file using Tauri FS
    - `validateFile(file: File)` - Checks size, extension, encoding
    - Returns: `{ selectFile, readContent, validateFile, error, isReading }`
  - **Verification**: Run `npm test` - T018 should PASS
  - **Dependencies**: T018 (test), T002 (types)

---

## Phase 3.5: Frontend Components Implementation

**VERIFY BEFORE STARTING**: Run `npm test` - component tests T012-T016 must FAIL

- [ ] **T029** [P] Implement ExampleCard component
  - **File**: `src/pages/AI/ExampleEmbeddings/ExampleCard.tsx` (new file)
  - **Action**: Create component:
    - Props: `example: ExampleWithMetadata, onDelete: () => void, onReplace: () => void`
    - Use Radix UI Card, Badge, Button components
    - Display: title, category, source badge, preview text, tags
    - Conditional rendering: show delete/replace only if source='user-uploaded'
    - Use Lucide icons: RefreshCw (replace), Trash2 (delete)
  - **Reference**: [contracts/react-components.md](./contracts/react-components.md#3-examplecard)
  - **Verification**: Run `npm test` - T014 should PASS
  - **Dependencies**: T014 (test), T002 (types)

- [ ] **T030** [P] Implement DeleteConfirm component
  - **File**: `src/pages/AI/ExampleEmbeddings/DeleteConfirm.tsx` (new file)
  - **Action**: Create component:
    - Props: `open, onClose, onConfirm, exampleTitle, isDeleting`
    - Use Radix UI AlertDialog
    - Show warning with example title
    - Disable buttons during deletion
    - Loading state with Loader2 icon
  - **Reference**: [contracts/react-components.md](./contracts/react-components.md#5-deleteconfirm)
  - **Verification**: Run `npm test` - T016 should PASS
  - **Dependencies**: T016 (test), T002 (types)

- [ ] **T031** Implement UploadDialog component
  - **File**: `src/pages/AI/ExampleEmbeddings/UploadDialog.tsx` (new file)
  - **Action**: Create component:
    - Props: `open, onClose, onUpload`
    - Use Radix UI Dialog, Form elements
    - Form fields: before file, after file, title, category, tags, quality score
    - Use `useFileUpload` hook (T028)
    - Use `useEmbedding` hook (existing) for embedding generation
    - Validation with zod schema
    - Loading state during embedding generation
  - **Reference**: [contracts/react-components.md](./contracts/react-components.md#4-uploaddialog)
  - **Verification**: Run `npm test` - T015 should PASS
  - **Dependencies**: T015, T028, T002

- [ ] **T032** Implement ExampleList component
  - **File**: `src/pages/AI/ExampleEmbeddings/ExampleList.tsx` (new file)
  - **Action**: Create component:
    - Props: `examples, onDelete, onReplace, isLoading`
    - Responsive grid layout (1-3 columns)
    - Loading skeleton using Radix Skeleton
    - Empty state with FileText icon
    - Map examples to ExampleCard components (T029)
  - **Reference**: [contracts/react-components.md](./contracts/react-components.md#2-examplelist)
  - **Verification**: Run `npm test` - T013 should PASS
  - **Dependencies**: T013, T029, T002

- [ ] **T033** Implement ExampleEmbeddings page component
  - **File**: `src/pages/AI/ExampleEmbeddings/ExampleEmbeddings.tsx` (new file)
  - **Action**: Create page component:
    - Use `useBreadcrumb` hook for navigation
    - Use `useExampleManagement` hook (T027) for data
    - Local state: uploadDialogOpen, deleteDialogOpen, selectedExampleId, filterSource
    - Use Radix UI Tabs for filtering (All, Bundled, Uploaded)
    - Render ExampleList (T032), UploadDialog (T031), DeleteConfirm (T030)
    - Handle upload workflow: file selection → embedding generation → upload
    - Handle delete workflow: confirmation → delete → refresh list
  - **Reference**: [contracts/react-components.md](./contracts/react-components.md#1-exampleembeddings-page-component)
  - **Verification**: Run `npm test` - T012, T019, T020 should PASS
  - **Dependencies**: T012, T019, T020, T027, T029-T032

---

## Phase 3.6: Integration & Routing

- [ ] **T034** Add route for ExampleEmbeddings page
  - **File**: `src/App.tsx` or routing config file
  - **Action**:
    - Add route: `/ai-tools/example-embeddings` → `<ExampleEmbeddings />`
    - Import ExampleEmbeddings component
  - **Verification**: Navigate to `/ai-tools/example-embeddings` in app
  - **Dependencies**: T033

- [ ] **T035** Add navigation link to ExampleEmbeddings
  - **File**: Sidebar navigation component (find existing nav for AI Tools)
  - **Action**:
    - Add menu item: "Example Embeddings" with link to `/ai-tools/example-embeddings`
    - Use FileText or Database icon from Lucide
    - Place under "AI Tools" section near "Script Formatter"
  - **Verification**: Click nav link, page loads
  - **Dependencies**: T034

- [ ] **T036** Integration test: full upload-to-RAG workflow
  - **File**: `tests/integration/rag-integration.test.tsx` (new file)
  - **Action**: Write E2E test that:
    - Uploads custom example via ExampleEmbeddings page
    - Navigates to ScriptFormatter page
    - Formats a script similar to uploaded example
    - Verifies uploaded example appears in RAG retrieval results
  - **Note**: May need to mock Tauri commands or use test database
  - **Dependencies**: T033, T034, T035

---

## Phase 3.7: Polish & Documentation

- [ ] **T037** [P] Update CLAUDE.md with new feature
  - **File**: `CLAUDE.md`
  - **Action**: Add to Recent Features section:
    - Phase 007: Example Embeddings Management
    - Page location: `src/pages/AI/ExampleEmbeddings/`
    - New hooks: `useExampleManagement`, `useFileUpload`
    - Tauri commands: `get_all_examples_with_metadata`, `upload_example`, etc.
    - Integration with existing RAG system
  - **Reference**: [plan.md](./plan.md) summary
  - **Dependencies**: T033 (feature complete)

- [ ] **T038** [P] Performance validation
  - **File**: N/A (manual testing)
  - **Action**: Verify performance targets from plan.md:
    - Upload example <5s end-to-end
    - List query <50ms for 100 examples
    - Delete example <100ms
    - Filter switching <100ms
    - UI responsive 60fps during interactions
  - **Reference**: [quickstart.md](./quickstart.md#performance-tests)
  - **Dependencies**: T033

- [ ] **T039** [P] Accessibility audit
  - **File**: N/A (manual testing)
  - **Action**: Verify accessibility requirements:
    - Keyboard navigation (Tab, Enter, Escape, Arrow keys)
    - Screen reader support (ARIA labels, announcements)
    - Focus management in dialogs
    - Color contrast WCAG AA (4.5:1)
    - Form labels associated with inputs
  - **Reference**: [quickstart.md](./quickstart.md#accessibility-tests)
  - **Dependencies**: T033

- [ ] **T040** Execute quickstart validation
  - **File**: N/A (manual testing)
  - **Action**: Follow all 6 workflows in quickstart.md:
    - Workflow 1: View existing examples
    - Workflow 2: Upload new example
    - Workflow 3: Filter examples
    - Workflow 4: Replace example
    - Workflow 5: Delete example
    - Workflow 6: Verify RAG integration
  - **Reference**: [quickstart.md](./quickstart.md#user-workflows)
  - **Checklist**: Complete all items in Manual QA Checklist
  - **Dependencies**: T033, T034, T035

- [ ] **T041** Update package.json version
  - **File**: `package.json`
  - **Action**: Increment version from 0.8.6 to 0.8.7
  - **Commit Message**: "feat: AI Script Example Embedding Management (007)"
  - **Dependencies**: T040 (all validation passed)

---

## Dependencies Graph

```
Setup:
T001 (DB migration) → T004, T005-T011
T002 (TS types) → T012-T020
T003 (Rust types) → T005-T011

Backend Tests:
T005-T011 [P] (all independent, different test cases)

Backend Implementation:
T021 requires T005
T022 requires T007
T023 requires T006, T007, T022
T024 requires T008, T009, T022
T025 requires T010, T011
T026 requires T021, T023-T025

Frontend Tests:
T012-T020 [P] (all independent, different test files)

Frontend Hooks:
T027, T028 [P] (different files)

Frontend Components:
T029, T030 [P] → T032 → T033
T031 requires T028 → T033

Integration:
T034 requires T033
T035 requires T034
T036 requires T033, T034, T035

Polish:
T037, T038, T039 [P] require T033
T040 requires T033-T035
T041 requires T040
```

## Parallel Execution Examples

### Backend Tests (after T001-T003)
```bash
# Run all backend contract tests in parallel
cargo test --package bucket --lib commands::rag::tests -- --test-threads=7
```

### Frontend Component Tests (after T002)
```bash
# Run all component tests in parallel
npm test -- tests/pages/AI/ExampleEmbeddings/ tests/hooks/
```

### Independent Components (after tests pass)
```bash
# Can implement these components in parallel:
# - Terminal 1: T029 (ExampleCard)
# - Terminal 2: T030 (DeleteConfirm)
# - Terminal 3: T027 (useExampleManagement)
# - Terminal 4: T028 (useFileUpload)
```

---

## Task Execution Order

### Phase 1: Setup (Sequential)
1. T001 → T002, T003 [P] → T004

### Phase 2: Tests (All must FAIL before Phase 3)
2. T005-T011 [P] (backend tests)
3. T012-T020 [P] (frontend tests)

### Phase 3: Backend Implementation (Sequential)
4. T021 → T022 → T023, T024, T025 → T026

### Phase 4: Frontend Implementation
5. T027, T028 [P] (hooks)
6. T029, T030 [P] → T031 → T032 → T033

### Phase 5: Integration (Sequential)
7. T034 → T035 → T036

### Phase 6: Polish (Parallel possible)
8. T037, T038, T039 [P] → T040 → T041

---

## Validation Checklist

**GATE: Verify before marking feature complete**

- [x] All contracts have corresponding tests (T005-T011, T012-T020)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (verified via dependency graph)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD order enforced (tests fail, then implement, then pass)
- [x] All 4 Tauri commands tested and implemented
- [x] All 5 React components tested and implemented
- [x] Database migration included (T001)
- [x] Types defined for both frontend and backend (T002, T003)

---

## Notes

- **TDD Enforcement**: T005-T020 MUST fail before starting T021+
- **Commit Strategy**: Commit after each task completion
- **Test Verification**: Run tests after each implementation task
- **[P] Tasks**: Can be executed in parallel to save time
- **Sequential Tasks**: Must wait for dependencies to complete
- **Database**: Use in-memory SQLite for tests, real database for integration

---

**Total Tasks**: 41
**Estimated Time**: 3-5 days (depends on parallel execution)
**Ready for Execution**: ✅

---

*Generated from [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [research.md](./research.md)*
