# Tasks: BuildProject Trello Cards Array Migration

**Feature**: 004-embed-multiple-video - BuildProject Migration
**Input**: Design documents from `/specs/004-embed-multiple-video/`
**Prerequisites**: Baker implementation complete ✅, plan.md, data-model.md, contracts/, quickstart.md
**Context**: Migrate BuildProject from single `trelloCardUrl` to array-based `trelloCards[]` using existing Baker components

## Execution Status
- ✅ Baker implementation (TrelloCardsManager, VideoLinksManager) complete
- ✅ Backend Tauri commands implemented and tested
- ✅ TypeScript/Rust data models defined
- 🎯 **Current Phase**: BuildProject component integration

## Path Conventions
**Tauri Desktop App Structure**:
- Frontend: `src/` (TypeScript/React)
- Backend: `src-tauri/src/` (Rust)
- Tests: `src/__tests__/` (Vitest)

---

## Phase 3.1: Prerequisites Verification ✅ COMPLETE
All setup tasks already completed in Baker phase:
- ✅ Dependencies installed (@radix-ui/react-tabs, TanStack React Query)
- ✅ Backend Tauri commands implemented
- ✅ TypeScript types defined
- ✅ Linting and formatting configured

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Component Integration Tests
- [ ] **T001 [P]** Integration test: BuildProject creates project → TrelloCardsManager displays → Add card → Verify breadcrumbs
  - **File**: `src/__tests__/integration/BuildProjectTrelloIntegration.test.tsx`
  - **Test**:
    1. Mock project creation completion state
    2. Render BuildProject component with `completed=true`
    3. Verify TrelloCardsManager component is rendered
    4. Simulate adding a Trello card
    5. Assert breadcrumbs.json updated with trelloCards[] array
  - **Expected**: Test FAILS (TrelloCardsManager not yet integrated)

- [ ] **T002 [P]** Integration test: BuildProject → Baker cross-page data display
  - **File**: `src/__tests__/integration/BuildProjectBakerSync.test.tsx`
  - **Test**:
    1. Create project via BuildProject workflow
    2. Add Trello card to breadcrumbs via BuildProject
    3. Navigate to Baker page
    4. Open same project in Baker
    5. Assert Trello card appears in Baker's TrelloCardsManager
  - **Expected**: Test FAILS (BuildProject not using array format yet)

- [ ] **T003 [P]** Component test: VideoLinksManager renders in BuildProject success banner
  - **File**: `src/__tests__/components/BuildProject.test.tsx`
  - **Test**:
    1. Render BuildProject with `completed=true`
    2. Assert VideoLinksManager component exists
    3. Assert "Add Video" button is clickable
    4. Assert projectPath prop passed correctly
  - **Expected**: Test FAILS (VideoLinksManager not yet added)

### Backward Compatibility Tests
- [ ] **T004 [P]** Migration test: Legacy trelloCardUrl → trelloCards[] array conversion
  - **File**: `src/__tests__/integration/LegacyBreadcrumbsMigration.test.tsx`
  - **Test**:
    1. Create breadcrumbs.json with single `trelloCardUrl` field
    2. Open project in BuildProject (post-creation state)
    3. Render TrelloCardsManager
    4. Assert legacy URL migrated to trelloCards[0]
    5. Assert trelloCardUrl field preserved for backward compat
  - **Expected**: Test FAILS (migration logic not implemented)

### State Management Tests
- [ ] **T005 [P]** Hook test: useBreadcrumbsTrelloCards works with BuildProject paths
  - **File**: `src/__tests__/hooks/useBreadcrumbsTrelloCards.test.tsx`
  - **Test**:
    1. Mock BuildProject breadcrumbs path format
    2. Call useBreadcrumbsTrelloCards({ projectPath })
    3. Invoke addTrelloCard mutation
    4. Assert Tauri command called with correct path
    5. Assert query cache invalidates correctly
  - **Expected**: Test PASSES (hook is generic, already works)

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Component Integration
- [ ] **T006** Import Baker components into BuildProject
  - **File**: `src/pages/BuildProject/BuildProject.tsx`
  - **Changes**:
    ```typescript
    // Add imports at top
    import { TrelloCardsManager } from '../../components/Baker/TrelloCardsManager'
    import { VideoLinksManager } from '../../components/Baker/VideoLinksManager'
    import { useTrelloApiKeys } from 'hooks/useApiKeys'
    ```
  - **Verify**: No TypeScript errors, components resolve correctly
  - **Blocks**: T007, T008

- [ ] **T007** Remove TrelloIntegrationModal from BuildProject success UI
  - **File**: `src/pages/BuildProject/BuildProject.tsx`
  - **Changes**:
    1. Remove `import TrelloIntegrationButton` (line 11)
    2. Remove `import TrelloIntegrationModal` (line 12)
    3. Remove `showTrelloModal` state (line 32)
    4. Delete TrelloIntegrationButton render (lines 170-171)
    5. Delete TrelloIntegrationModal render (lines 179-182)
  - **Verify**: Component still compiles, no unused imports
  - **Depends on**: T006

- [ ] **T008** Add TrelloCardsManager to BuildProject success banner
  - **File**: `src/pages/BuildProject/BuildProject.tsx`
  - **Changes**:
    Replace success banner section (lines 160-174) with:
    ```tsx
    {completed && !loading && (
      <div className="pt-6 text-center space-y-4 animate-fadeIn">
        <div className="mx-4 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-xs">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            Project Created Successfully! 🎉
          </h3>

          {/* Trello Cards Section */}
          <div className="mb-6">
            <TrelloCardsManager
              projectPath={`${selectedFolder}/${title}`}
              trelloApiKey={trelloApiKey}
              trelloApiToken={trelloApiToken}
            />
          </div>

          {/* Video Links Section */}
          <div>
            <VideoLinksManager
              projectPath={`${selectedFolder}/${title}`}
            />
          </div>
        </div>
      </div>
    )}
    ```
  - **Verify**: Components render, no console errors
  - **Depends on**: T006, T007

- [ ] **T009** Add Trello API credentials hook to BuildProject
  - **File**: `src/pages/BuildProject/BuildProject.tsx`
  - **Changes**:
    ```typescript
    // Add after other hooks (around line 43)
    const { apiKey: trelloApiKey, apiToken: trelloApiToken } = useTrelloApiKeys()
    ```
  - **Verify**: Credentials passed to TrelloCardsManager correctly
  - **Depends on**: T006

### State Management Integration
- [ ] **T010** Verify appStore breadcrumbs updates on project creation
  - **File**: `src/hooks/useCreateProject.ts` (verify, no changes needed)
  - **Verification Steps**:
    1. Find where breadcrumbs are set after project creation
    2. Confirm `appStore.getState().setBreadcrumbs()` is called
    3. Confirm breadcrumbs include `parentFolder` and `projectTitle`
    4. If missing, add breadcrumbs update after project creation completes
  - **Expected**: appStore already updates correctly (verify only)

- [ ] **T011** Test projectPath construction matches expected format
  - **File**: Manual verification in dev environment
  - **Steps**:
    1. Create test project via BuildProject
    2. Console.log projectPath: `${selectedFolder}/${title}`
    3. Verify matches breadcrumbs.parentFolder + projectTitle format
    4. Test TrelloCardsManager can read/write breadcrumbs
  - **Fix if needed**: Adjust path construction in T008

---

## Phase 3.4: Integration & Polish

### UI/UX Refinements
- [ ] **T012** Update success banner layout and styling
  - **File**: `src/pages/BuildProject/BuildProject.tsx`
  - **Changes**:
    - Add section dividers between Trello and Video sections
    - Add descriptive text: "Link project management cards" and "Associate video uploads"
    - Ensure spacing matches Baker's layout (4-6 units between sections)
    - Test responsive behavior (component width limits)
  - **Depends on**: T008

- [ ] **T013 [P]** Add empty state messaging to BuildProject components
  - **Files**: Already implemented in TrelloCardsManager and VideoLinksManager
  - **Verification**:
    - Render BuildProject with new project (no cards/videos)
    - Verify "No Trello cards added yet" message appears
    - Verify "No video links added yet" message appears
    - Verify messages are helpful and actionable
  - **No changes needed if Baker components already have empty states** ✅

### Testing & Validation
- [ ] **T014** Run all integration tests and verify they pass
  - **Command**: `npm test -- BuildProjectTrelloIntegration BuildProjectBakerSync`
  - **Expected**: All tests from T001-T004 now PASS
  - **Fix if failing**: Debug and resolve before proceeding
  - **Depends on**: T006-T011

- [ ] **T015** Manual testing: Complete Workflow 4 from quickstart.md
  - **File**: Follow `specs/004-embed-multiple-video/quickstart.md` Workflow 4
  - **Steps**:
    1. Create new project via BuildProject
    2. Wait for success banner
    3. Add 2 Trello cards via TrelloCardsManager
    4. Add 1 video link via VideoLinksManager
    5. Open breadcrumbs.json, verify trelloCards[] array exists
    6. Open same project in Baker, verify cards/videos display
  - **Document** any issues in task notes

- [ ] **T016 [P]** Update BuildProject component tests for new UI
  - **File**: `src/__tests__/components/BuildProject.test.tsx`
  - **Changes**:
    - Update snapshot tests if using snapshots
    - Add test: "renders TrelloCardsManager when project completes"
    - Add test: "renders VideoLinksManager when project completes"
    - Remove test: "renders TrelloIntegrationButton" (obsolete)
    - Remove test: "opens TrelloIntegrationModal" (obsolete)
  - **Verify**: All tests pass, coverage maintained

### Documentation
- [ ] **T017 [P]** Update CLAUDE.md with BuildProject migration notes
  - **File**: `CLAUDE.md`
  - **Changes** (in "Recent Features" section):
    ```markdown
    #### Phase 004: Multiple Video Links and Trello Cards (Branch: 004-embed-multiple-video)
    - **Status**: BuildProject Migration Complete
    - **Summary**: Migrated BuildProject from single trelloCardUrl to array-based trelloCards[]
    - **Changes**:
      - Replaced TrelloIntegrationModal with TrelloCardsManager component
      - Added VideoLinksManager to post-creation success UI
      - Backward compatible: preserves legacy trelloCardUrl field
      - Reuses Baker components (no duplication)
    - **Components**: TrelloCardsManager, VideoLinksManager (from Baker)
    - **User Benefit**: Can link multiple Trello cards and videos per project
    ```
  - **Verify**: Under 150 lines total in CLAUDE.md

- [ ] **T018 [P]** Mark TrelloIntegrationModal as deprecated
  - **File**: `src/components/trello/TrelloIntegrationModal.tsx`
  - **Changes**:
    Add deprecation notice at top of file:
    ```typescript
    /**
     * @deprecated This component is deprecated as of Phase 004.
     * Use TrelloCardsManager from src/components/Baker/ instead.
     * Supports multiple Trello cards per project.
     *
     * This file is kept for backward compatibility only.
     * Do not use in new code.
     */
    ```
  - **Verify**: IDE shows deprecation warning when importing

---

## Dependencies

**Sequential Dependencies**:
- T006 (imports) → T007 (remove old) → T008 (add new) → T009 (credentials)
- T001-T005 (tests) → T006-T011 (implementation) → T014 (verify tests pass)
- T011 (path verification) → T015 (manual testing)
- T014 (tests pass) → T015 (manual testing)

**Parallel Opportunities**:
- T001, T002, T003, T004, T005 can run in parallel (different test files)
- T013 (verification), T016 (tests), T017 (docs), T018 (deprecation) can run in parallel

---

## Parallel Execution Example

**Phase 3.2 - Write All Tests in Parallel**:
```bash
# Launch 5 test writing tasks concurrently
Task 1: "Integration test BuildProject→TrelloCardsManager in BuildProjectTrelloIntegration.test.tsx"
Task 2: "Integration test BuildProject→Baker sync in BuildProjectBakerSync.test.tsx"
Task 3: "Component test VideoLinksManager in BuildProject.test.tsx"
Task 4: "Migration test legacy breadcrumbs in LegacyBreadcrumbsMigration.test.tsx"
Task 5: "Hook test useBreadcrumbsTrelloCards in useBreadcrumbsTrelloCards.test.tsx"
```

**Phase 3.4 - Polish in Parallel**:
```bash
# Launch documentation and cleanup tasks concurrently
Task 1: "Update CLAUDE.md with BuildProject migration notes"
Task 2: "Add deprecation notice to TrelloIntegrationModal.tsx"
Task 3: "Update BuildProject component tests"
```

---

## Validation Checklist
*GATE: Verify before marking feature complete*

- [x] All Baker components (TrelloCardsManager, VideoLinksManager) completed ✅
- [x] All backend Tauri commands implemented and tested ✅
- [x] All TypeScript/Rust data models defined ✅
- [ ] BuildProject integration tests written and pass (T001-T005, T014)
- [ ] TrelloIntegrationModal removed from BuildProject UI (T007)
- [ ] TrelloCardsManager renders in success banner (T008)
- [ ] VideoLinksManager renders in success banner (T008)
- [ ] Trello API credentials passed correctly (T009)
- [ ] projectPath construction verified (T011)
- [ ] Manual testing workflow completed successfully (T015)
- [ ] Component tests updated for new UI (T016)
- [ ] Documentation updated (T017, T018)
- [ ] All tests pass, no regressions
- [ ] Backward compatibility verified (legacy trelloCardUrl still works)

---

## Notes

**Why so few tasks?**: Baker implementation (50+ tasks) already complete. This is a focused migration reusing existing components.

**Estimated Time**: 2-4 hours total
- T001-T005 (tests): 1 hour
- T006-T011 (implementation): 1 hour
- T012-T018 (polish): 1-2 hours

**Key Files Modified**:
1. `src/pages/BuildProject/BuildProject.tsx` (main integration)
2. Test files (5 new/updated integration tests)
3. `CLAUDE.md` (documentation)
4. `src/components/trello/TrelloIntegrationModal.tsx` (deprecation notice)

**Commit Strategy**:
- Commit after T005: "test: Add BuildProject Trello array migration tests"
- Commit after T009: "feat: Integrate TrelloCardsManager into BuildProject"
- Commit after T014: "test: Verify BuildProject integration tests pass"
- Commit after T018: "docs: Update docs and deprecate TrelloIntegrationModal"

**Risk Mitigation**:
- Tests written first (TDD) ensure correctness
- Backward compatibility tests prevent breaking existing projects
- Manual testing catches UX issues
- Component reuse minimizes new bugs

---

## Task Execution Order

**Recommended sequence for solo developer**:
1. **Day 1 Morning**: T001-T005 (write all tests, verify they fail)
2. **Day 1 Afternoon**: T006-T009 (component integration)
3. **Day 1 Evening**: T010-T011 (verify state management)
4. **Day 2 Morning**: T012-T014 (UI refinement, run tests)
5. **Day 2 Afternoon**: T015-T018 (manual testing, documentation)

**For parallel execution** (if using multiple agents/developers):
- **Agent 1**: T001, T002, T003 (integration tests)
- **Agent 2**: T004, T005 (backward compat + hook tests)
- **Agent 3**: T006-T011 (after tests complete - implementation)
- **Agent 4**: T017, T018 (documentation - can start early)

---

*Generated: 2025-10-01*
*Based on plan.md, data-model.md, contracts/, quickstart.md*
*Feature: 004-embed-multiple-video - BuildProject Migration*
