# Tasks: Baker

**Input**: Design documents from `/specs/003-a-new-feature/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Tech stack: TypeScript 5.7 + React 18.3 + Tauri 2.0 + Rust
   → ✅ Structure: Tauri desktop app (src/ with pages, hooks, services, components)
2. Load optional design documents:
   → ✅ data-model.md: ProjectFolder, BreadcrumbsFile, ScanResult, ScanPreferences entities
   → ✅ contracts/: Tauri commands (6), React hooks (3), components (4)
   → ✅ research.md: Async scanning, Zustand state management, error handling strategies
3. Generate tasks by category:
   → ✅ Setup: TypeScript types, navigation integration, test setup
   → ✅ Tests: Contract tests for Tauri commands, integration tests for workflows
   → ✅ Core: Rust backend commands, React hooks, UI components
   → ✅ Integration: Navigation, sidebar, routing, state management
   → ✅ Polish: Error handling, performance optimization, documentation
4. Apply task rules:
   → ✅ Different files = mark [P] for parallel execution
   → ✅ Same file = sequential (no [P])
   → ✅ Tests before implementation (TDD order)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✅ All contracts have tests (6 Tauri commands → 6 contract tests)
   → ✅ All entities have models (4 entities → 4 TypeScript interfaces)
   → ✅ All user stories implemented (quickstart scenarios covered)
9. Return: SUCCESS (42 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
Tauri desktop application structure:
- **Frontend**: `src/` (TypeScript/React components, hooks, pages)
- **Backend**: `src-tauri/src/` (Rust Tauri commands)
- **Types**: `src/types/` (TypeScript interfaces)
- **Tests**: `tests/` (contract, integration, unit test files)

## Phase 3.1: Setup

- [ ] T001 Create Baker TypeScript type definitions in `src/types/baker.ts`
- [ ] T002 [P] Set up Baker test data structure in `tests/fixtures/baker-test-data/`
- [ ] T003 [P] Configure Baker-specific linting rules in `.eslintrc.js` and `tsconfig.json`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Tauri Command Contract Tests
- [ ] T004 [P] Contract test for `baker_start_scan` command in `tests/contract/baker-start-scan.test.ts`
- [ ] T005 [P] Contract test for `baker_get_scan_status` command in `tests/contract/baker-get-scan-status.test.ts`
- [ ] T006 [P] Contract test for `baker_cancel_scan` command in `tests/contract/baker-cancel-scan.test.ts`
- [ ] T007 [P] Contract test for `baker_validate_folder` command in `tests/contract/baker-validate-folder.test.ts`
- [ ] T008 [P] Contract test for `baker_read_breadcrumbs` command in `tests/contract/baker-read-breadcrumbs.test.ts`
- [ ] T009 [P] Contract test for `baker_update_breadcrumbs` command in `tests/contract/baker-update-breadcrumbs.test.ts`

### React Hook Tests
- [ ] T010 [P] Unit test for `useBakerScan` hook in `tests/unit/useBakerScan.test.ts`
- [ ] T011 [P] Unit test for `useBreadcrumbsManager` hook in `tests/unit/useBreadcrumbsManager.test.ts`
- [ ] T012 [P] Unit test for `useBakerPreferences` hook in `tests/unit/useBakerPreferences.test.ts`

### Component Tests
- [ ] T013 [P] Component test for `BakerPage` in `tests/component/BakerPage.test.tsx`
- [ ] T014 [P] Component test for `ScanProgress` in `tests/component/ScanProgress.test.tsx`
- [ ] T015 [P] Component test for `ProjectResults` in `tests/component/ProjectResults.test.tsx`
- [ ] T016 [P] Component test for `BatchActions` in `tests/component/BatchActions.test.tsx`

### Integration Tests
- [ ] T017 [P] Integration test for complete scan workflow in `tests/integration/baker-scan-workflow.test.ts`
- [ ] T018 [P] Integration test for breadcrumbs update workflow in `tests/integration/baker-update-workflow.test.ts`
- [ ] T019 [P] Integration test for error handling scenarios in `tests/integration/baker-error-handling.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### TypeScript Type Definitions
- [ ] T020 Create `ProjectFolder` interface in `src/types/baker.ts`
- [ ] T021 Create `BreadcrumbsFile` interface in `src/types/baker.ts`
- [ ] T022 Create `ScanResult` and `ScanError` interfaces in `src/types/baker.ts`
- [ ] T023 Create `ScanOptions` and `ScanPreferences` interfaces in `src/types/baker.ts`

### Rust Backend Implementation
- [ ] T024 Implement `baker_start_scan` command in `src-tauri/src/baker.rs`
- [ ] T025 Implement `baker_get_scan_status` command in `src-tauri/src/baker.rs`
- [ ] T026 Implement `baker_cancel_scan` command in `src-tauri/src/baker.rs`
- [ ] T027 Implement `baker_validate_folder` command in `src-tauri/src/baker.rs`
- [ ] T028 Implement `baker_read_breadcrumbs` command in `src-tauri/src/baker.rs`
- [ ] T029 Implement `baker_update_breadcrumbs` command in `src-tauri/src/baker.rs`
- [ ] T030 Add Baker module registration in `src-tauri/src/main.rs`

### React Hooks Implementation
- [ ] T031 [P] Implement `useBakerScan` custom hook in `src/hooks/useBakerScan.ts`
- [ ] T032 [P] Implement `useBreadcrumbsManager` custom hook in `src/hooks/useBreadcrumbsManager.ts`
- [ ] T033 [P] Implement `useBakerPreferences` custom hook in `src/hooks/useBakerPreferences.ts`

### UI Components Implementation
- [ ] T034 [P] Implement `ScanProgress` component in `src/components/baker/ScanProgress.tsx`
- [ ] T035 [P] Implement `ProjectResults` component in `src/components/baker/ProjectResults.tsx`
- [ ] T036 [P] Implement `BatchActions` component in `src/components/baker/BatchActions.tsx`
- [ ] T037 Implement main `BakerPage` component in `src/pages/Baker/Baker.tsx`

## Phase 3.4: Integration

- [ ] T038 Add Baker route to `src/AppRouter.tsx` with path `/ingest/baker`
- [ ] T039 Add Baker navigation item to sidebar in `src/components/app-sidebar.tsx`
- [ ] T040 Create Baker store with Zustand in `src/store/useBakerStore.ts`
- [ ] T041 Export Baker types from `src/hooks/index.ts` barrel file

## Phase 3.5: Polish

- [ ] T042 [P] Add comprehensive error boundaries in Baker components
- [ ] T043 [P] Implement performance optimization (React.memo, useMemo) in Baker components
- [ ] T044 [P] Add Baker-specific logging and telemetry
- [ ] T045 [P] Update main `CLAUDE.md` with Baker implementation details
- [ ] T046 Execute quickstart guide validation scenarios from `specs/003-a-new-feature/quickstart.md`

## Dependencies

**Setup Dependencies**:
- T001 (types) blocks T020-T023 (type implementations)

**Test Dependencies**: 
- T002 (test data) blocks T004-T019 (all tests need test fixtures)
- Tests T004-T019 must complete and FAIL before T024-T037 (implementation)

**Implementation Dependencies**:
- T020-T023 (type definitions) block T031-T037 (frontend implementation)
- T024-T030 (Rust commands) block T031-T033 (hooks using those commands)
- T031-T033 (hooks) block T037 (BakerPage using hooks)
- T034-T037 (components) block T038-T039 (navigation integration)

**Integration Dependencies**:
- T037 (BakerPage) blocks T038 (routing)
- T031-T033 (hooks) block T040 (store integration)

**Polish Dependencies**:
- T037-T041 (complete implementation) block T042-T046 (polish tasks)

## Parallel Execution Examples

### Phase 3.2: Tauri Contract Tests (can run together)
```bash
# Launch T004-T009 together:
Task: "Contract test for baker_start_scan command in tests/contract/baker-start-scan.test.ts"
Task: "Contract test for baker_get_scan_status command in tests/contract/baker-get-scan-status.test.ts"
Task: "Contract test for baker_cancel_scan command in tests/contract/baker-cancel-scan.test.ts"
Task: "Contract test for baker_validate_folder command in tests/contract/baker-validate-folder.test.ts"
Task: "Contract test for baker_read_breadcrumbs command in tests/contract/baker-read-breadcrumbs.test.ts"
Task: "Contract test for baker_update_breadcrumbs command in tests/contract/baker-update-breadcrumbs.test.ts"
```

### Phase 3.2: React Hook Tests (can run together)
```bash
# Launch T010-T012 together:
Task: "Unit test for useBakerScan hook in tests/unit/useBakerScan.test.ts"
Task: "Unit test for useBreadcrumbsManager hook in tests/unit/useBreadcrumbsManager.test.ts"
Task: "Unit test for useBakerPreferences hook in tests/unit/useBakerPreferences.test.ts"
```

### Phase 3.2: Component Tests (can run together)
```bash
# Launch T013-T016 together:
Task: "Component test for BakerPage in tests/component/BakerPage.test.tsx"
Task: "Component test for ScanProgress in tests/component/ScanProgress.test.tsx"
Task: "Component test for ProjectResults in tests/component/ProjectResults.test.tsx"
Task: "Component test for BatchActions in tests/component/BatchActions.test.tsx"
```

### Phase 3.3: React Hook Implementation (can run together after types)
```bash
# Launch T031-T033 together (after T020-T023 complete):
Task: "Implement useBakerScan custom hook in src/hooks/useBakerScan.ts"
Task: "Implement useBreadcrumbsManager custom hook in src/hooks/useBreadcrumbsManager.ts"
Task: "Implement useBakerPreferences custom hook in src/hooks/useBakerPreferences.ts"
```

### Phase 3.3: UI Components (can run together after hooks)
```bash
# Launch T034-T036 together (after T031-T033 complete):
Task: "Implement ScanProgress component in src/components/baker/ScanProgress.tsx"
Task: "Implement ProjectResults component in src/components/baker/ProjectResults.tsx"
Task: "Implement BatchActions component in src/components/baker/BatchActions.tsx"
```

### Phase 3.5: Polish Tasks (can run together after implementation)
```bash
# Launch T042-T045 together (after T037-T041 complete):
Task: "Add comprehensive error boundaries in Baker components"
Task: "Implement performance optimization (React.memo, useMemo) in Baker components"
Task: "Add Baker-specific logging and telemetry"
Task: "Update main CLAUDE.md with Baker implementation details"
```

## Notes

- **[P] tasks** = different files, no shared dependencies, can run in parallel
- **Sequential tasks** = modify same files or have direct dependencies, must run in order
- **TDD Critical**: Verify ALL tests T004-T019 fail before starting ANY implementation (T020+)
- **Commit strategy**: Commit after each completed task for clean history
- **Error handling**: All tasks should include proper error handling and logging
- **Performance**: UI tasks must not block the main thread, use background processing for file operations

## Task Generation Rules Applied

1. **From Contracts** (6 Tauri commands):
   - Each command → contract test task [P] (T004-T009)
   - Each command → Rust implementation task (T024-T029)

2. **From Data Model** (4 entities):
   - Each entity → TypeScript interface task (T020-T023)
   - Zustand store for state management (T040)

3. **From User Stories** (quickstart scenarios):
   - Complete scan workflow → integration test (T017)
   - Update breadcrumbs workflow → integration test (T018)
   - Error handling scenarios → integration test (T019)
   - End-to-end validation → quickstart execution (T046)

4. **From Component Contracts** (4 components + 3 hooks):
   - Each component → test + implementation tasks (T013-T016, T034-T037)
   - Each hook → test + implementation tasks (T010-T012, T031-T033)

## Validation Checklist

- [x] All contracts have corresponding tests (6 commands → T004-T009)
- [x] All entities have model tasks (4 entities → T020-T023)
- [x] All tests come before implementation (T004-T019 before T020+)
- [x] Parallel tasks truly independent (marked [P] only for different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Integration tests cover all user workflows
- [x] Setup tasks provide necessary foundations
- [x] Polish tasks ensure production readiness

## Total Task Count: 46 tasks
- **Setup**: 3 tasks (T001-T003)
- **Tests**: 16 tasks (T004-T019)  
- **Implementation**: 18 tasks (T020-T037)
- **Integration**: 4 tasks (T038-T041)
- **Polish**: 5 tasks (T042-T046)

**Estimated Timeline**: 8-12 developer days with parallel execution of [P] tasks