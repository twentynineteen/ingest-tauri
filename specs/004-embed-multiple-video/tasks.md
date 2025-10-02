# Tasks: Video Upload Toggle for VideoLinksManager

**Feature**: 004-embed-multiple-video (Enhancement)
**Branch**: `004-embed-multiple-video`
**Input**: Design documents from `/specs/004-embed-multiple-video/`
**Prerequisites**: plan.md, research.md, contracts/tauri-commands.md, quickstart.md

## Execution Summary

This enhancement adds direct video upload capability to the VideoLinksManager component via a toggle interface (URL entry OR file upload), mirroring the TrelloCardsManager pattern. The implementation reuses existing hooks (`useFileUpload`, `useUploadEvents`) and Tauri commands (`upload_video`), making this a focused UI enhancement with no backend changes required.

**Estimated Complexity**: 20 tasks (additive feature, ~2-3 days)
**Key Files Modified**:
- `src/components/Baker/VideoLinksManager.tsx` (primary)
- `src/components/Baker/VideoLinksManager.test.tsx` (new)

---

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All paths are relative to repository root unless specified

---

## Phase 3.1: Setup & Verification

### T001 Verify existing dependencies and hooks
**File**: N/A (verification only)
**Dependencies**: None
**Parallel**: Yes [P]

**Actions**:
1. Verify `src/hooks/useFileUpload.ts` exists and exports `useFileUpload` hook
2. Verify `src/hooks/useUploadEvents.ts` exists and exports `useUploadEvents` hook
3. Verify `src/components/ui/tabs.tsx` exists (ShadCN Tabs component)
4. Verify `src/components/ui/progress.tsx` exists (ShadCN Progress component)
5. Verify `src-tauri/src/commands/sprout_upload.rs` contains `upload_video` command
6. Verify `src/utils/validation.ts` contains `validateVideoLink` function

**Expected Outcome**: All dependencies confirmed available, no installation needed

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### T002 [P] Component test: Tab switching behavior
**File**: `src/components/Baker/VideoLinksManager.test.tsx` (new)
**Dependencies**: T001
**Parallel**: Yes (different test file)

**Test Cases**:
1. Dialog opens with "Enter URL" tab active by default
2. Clicking "Upload File" tab switches to upload interface
3. Tab switch clears validation errors
4. Tab switch resets upload state (selectedFile, progress)

**Expected Outcome**: Tests written, all FAIL (component not updated yet)

---

### T003 [P] Component test: File selection workflow
**File**: `src/components/Baker/VideoLinksManager.test.tsx`
**Dependencies**: T001
**Parallel**: Yes (different test file)

**Test Cases**:
1. "Select Video File" button opens file picker with video filters
2. Selected filename displays below button after selection
3. "Upload and Add" button disabled when no file selected
4. "Upload and Add" button enabled after file selection
5. File picker defaults to `{projectPath}/Renders/` when folder exists

**Expected Outcome**: Tests written, all FAIL (upload tab not implemented yet)

---

### T004 [P] Component test: Upload button disabled states
**File**: `src/components/Baker/VideoLinksManager.test.tsx`
**Dependencies**: T001
**Parallel**: Yes (different test file)

**Test Cases**:
1. "Upload and Add" disabled when no file selected
2. "Upload and Add" disabled when API key missing
3. "Upload and Add" disabled during upload (uploading = true)
4. Button shows "Uploading... X%" during upload
5. Button re-enabled after upload completes or errors

**Expected Outcome**: Tests written, all FAIL (upload logic not integrated yet)

---

### T005 [P] Component test: Progress bar updates
**File**: `src/components/Baker/VideoLinksManager.test.tsx`
**Dependencies**: T001
**Parallel**: Yes (different test file)

**Test Cases**:
1. Progress bar hidden when not uploading
2. Progress bar appears when upload starts
3. Progress bar updates with percentage (0-100%)
4. Progress bar shows smooth updates (mocked progress events)

**Expected Outcome**: Tests written, all FAIL (progress UI not added yet)

---

### T006 [P] Component test: Successful upload auto-adds VideoLink
**File**: `src/components/Baker/VideoLinksManager.test.tsx`
**Dependencies**: T001
**Parallel**: Yes (different test file)

**Test Cases**:
1. Mock successful upload response (SproutUploadResponse)
2. Verify `createVideoLinkFromUpload` called with response + filePath
3. Verify `addVideoLink` mutation called with created VideoLink
4. Verify dialog closes after successful add
5. Verify upload state reset after successful add
6. Verify VideoLink fields correctly populated:
   - url: from response.embedded_url or constructed
   - sproutVideoId: from response.id
   - title: from response.title or filename fallback
   - thumbnailUrl: from response.assets.poster_frames[0]
   - uploadDate: from response.created_at
   - sourceRenderFile: filename only (no path)

**Expected Outcome**: Tests written, all FAIL (helper function not created yet)

---

### T007 [P] Component test: Error states and retry
**File**: `src/components/Baker/VideoLinksManager.test.tsx`
**Dependencies**: T001
**Parallel**: Yes (different test file)

**Test Cases**:
1. Show error alert when upload fails (network error)
2. Show error alert when upload times out
3. Show error alert when API key missing
4. File remains selected after error (for retry)
5. "Upload and Add" button re-enabled after error
6. Validation error shown when VideoLink validation fails

**Expected Outcome**: Tests written, all FAIL (error handling not implemented yet)

---

### T008 [P] Component test: Dialog cleanup
**File**: `src/components/Baker/VideoLinksManager.test.tsx`
**Dependencies**: T001
**Parallel**: Yes (different test file)

**Test Cases**:
1. Closing dialog resets upload state (selectedFile = null, progress = 0)
2. Closing dialog resets form data (url, title, etc.)
3. Closing dialog resets validation errors
4. Closing dialog resets addMode to 'url'
5. Opening dialog again shows clean state

**Expected Outcome**: Tests written, all FAIL (cleanup logic not implemented yet)

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### T009 Add Tabs import and wrap existing URL form
**File**: `src/components/Baker/VideoLinksManager.tsx`
**Dependencies**: T002-T008 (tests must be failing)
**Parallel**: No (same file as other implementation tasks)

**Changes**:
1. Import Tabs components:
   ```typescript
   import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
   ```
2. Add state for tab mode:
   ```typescript
   const [addMode, setAddMode] = useState<'url' | 'upload'>('url')
   ```
3. Wrap dialog content in Tabs:
   ```tsx
   <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'url' | 'upload')}>
     <TabsList className="grid w-full grid-cols-2">
       <TabsTrigger value="url">Enter URL</TabsTrigger>
       <TabsTrigger value="upload">Upload File</TabsTrigger>
     </TabsList>
     {/* Move existing URL form into TabsContent */}
   </Tabs>
   ```
4. Wrap existing URL form in `<TabsContent value="url">...</TabsContent>`
5. Update dialog description to mention both options

**Expected Outcome**: T002 tests start passing (tab switching works)

---

### T010 Integrate upload hooks
**File**: `src/components/Baker/VideoLinksManager.tsx`
**Dependencies**: T009
**Parallel**: No (same file)

**Changes**:
1. Import upload hooks:
   ```typescript
   import { useFileUpload } from '../../hooks/useFileUpload'
   import { useUploadEvents } from '../../hooks/useUploadEvents'
   ```
2. Import Progress component:
   ```typescript
   import { Progress } from '@/components/ui/progress'
   ```
3. Import Upload icon:
   ```typescript
   import { Upload } from 'lucide-react'
   ```
4. Add hooks in component:
   ```typescript
   const { selectedFile, uploading, response, selectFile, uploadFile, resetUploadState } = useFileUpload()
   const { progress, message } = useUploadEvents()
   ```

**Expected Outcome**: Hooks available for upload tab (no UI change yet)

---

### T011 Create upload tab UI structure
**File**: `src/components/Baker/VideoLinksManager.tsx`
**Dependencies**: T010
**Parallel**: No (same file)

**Changes**:
1. Add `<TabsContent value="upload">` after URL tab
2. Add "Select Video File" button:
   ```tsx
   <Button onClick={selectFile} className="w-full" disabled={uploading}>
     <Upload className="mr-2 h-4 w-4" />
     Select Video File
   </Button>
   ```
3. Show selected filename:
   ```tsx
   {selectedFile && (
     <p className="text-sm text-gray-600">
       Selected: {selectedFile.split('/').pop()}
     </p>
   )}
   ```
4. Add progress bar (conditional):
   ```tsx
   {uploading && (
     <div className="space-y-2">
       <p className="text-sm text-gray-500">Uploading: {progress}%</p>
       <Progress value={progress} />
     </div>
   )}
   ```
5. Show message/error alerts:
   ```tsx
   {message && (
     <Alert variant={message.includes('failed') ? 'destructive' : 'default'}>
       <AlertDescription>{message}</AlertDescription>
     </Alert>
   )}
   ```
6. Show API key warning:
   ```tsx
   {!apiKey && (
     <Alert>
       <AlertCircle className="h-4 w-4" />
       <AlertDescription>
         Sprout Video API key not configured. Go to Settings to add it.
       </AlertDescription>
     </Alert>
   )}
   ```
7. Add DialogFooter with Cancel and "Upload and Add" buttons:
   ```tsx
   <Button
     onClick={handleUploadAndAdd}
     disabled={!selectedFile || uploading || !apiKey}
   >
     {uploading ? (
       <>
         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
         Uploading... {progress}%
       </>
     ) : (
       <>
         <Upload className="mr-2 h-4 w-4" />
         Upload and Add
       </>
     )}
   </Button>
   ```

**Expected Outcome**: T003, T004, T005 tests start passing (upload UI visible and functional)

---

### T012 Implement createVideoLinkFromUpload helper function
**File**: `src/components/Baker/VideoLinksManager.tsx`
**Dependencies**: T011
**Parallel**: No (same file)

**Changes**:
1. Add helper function at top of file (outside component):
   ```typescript
   function createVideoLinkFromUpload(
     response: SproutUploadResponse,
     filePath: string
   ): VideoLink {
     const filename = filePath.split('/').pop() || 'video'
     const titleFallback = filename.replace(/\.[^/.]+$/, '') // Remove extension

     return {
       url: response.embedded_url || `https://sproutvideo.com/videos/${response.id}`,
       sproutVideoId: response.id,
       title: response.title || titleFallback,
       thumbnailUrl: response.assets?.poster_frames?.[0],
       uploadDate: response.created_at,
       sourceRenderFile: filename
     }
   }
   ```
2. Import `SproutUploadResponse` type from `../../utils/types`

**Expected Outcome**: Helper function available for upload workflow

---

### T013 Implement handleUploadAndAdd event handler
**File**: `src/components/Baker/VideoLinksManager.tsx`
**Dependencies**: T012
**Parallel**: No (same file)

**Changes**:
1. Add handler function:
   ```typescript
   const handleUploadAndAdd = async () => {
     if (!selectedFile || !apiKey) return

     // Reset states
     setValidationErrors([])

     // Check limit before uploading
     if (videoLinks.length >= 20) {
       setValidationErrors(['Maximum of 20 videos per project reached'])
       return
     }

     try {
       // Upload file
       await uploadFile(apiKey)
       // Response handled by useEffect watching response state
     } catch (error) {
       setValidationErrors([error instanceof Error ? error.message : 'Upload failed'])
     }
   }
   ```
2. Add useEffect to watch for upload completion:
   ```typescript
   useEffect(() => {
     if (response && selectedFile) {
       // Create VideoLink from upload response
       const videoLink = createVideoLinkFromUpload(response, selectedFile)

       // Validate
       const errors = validateVideoLink(videoLink)
       if (errors.length > 0) {
         setValidationErrors(errors)
         return
       }

       // Add to breadcrumbs
       addVideoLink(videoLink)

       // Reset and close
       resetUploadState()
       setIsDialogOpen(false)
     }
   }, [response, selectedFile, addVideoLink, resetUploadState])
   ```

**Expected Outcome**: T006 tests start passing (upload workflow complete)

---

### T014 Implement tab change and dialog cleanup handlers
**File**: `src/components/Baker/VideoLinksManager.tsx`
**Dependencies**: T013
**Parallel**: No (same file)

**Changes**:
1. Update Tabs onValueChange to call cleanup:
   ```typescript
   <Tabs
     value={addMode}
     onValueChange={(v) => {
       setAddMode(v as 'url' | 'upload')
       setValidationErrors([])
       resetUploadState()
     }}
   >
   ```
2. Update Dialog onOpenChange to handle cleanup:
   ```typescript
   <Dialog
     open={isDialogOpen}
     onOpenChange={(open) => {
       setIsDialogOpen(open)
       if (!open) {
         resetUploadState()
         setFormData({ url: '', title: '', thumbnailUrl: '', sproutVideoId: '' })
         setValidationErrors([])
         setAddMode('url')
       }
     }}
   >
   ```

**Expected Outcome**: T007, T008 tests start passing (cleanup and error handling complete)

---

## Phase 3.4: Integration Testing

### T015 Integration test: End-to-end upload workflow
**File**: `tests/integration/VideoLinksManager.integration.test.tsx` (new)
**Dependencies**: T014 (all component tests passing)
**Parallel**: Yes [P]

**Test Steps**:
1. Setup: Create test project with Renders/ folder
2. Setup: Mock Sprout Video API response
3. Open VideoLinksManager in Baker
4. Click "Add Video" → "Upload File" tab
5. Select video file from Renders/
6. Click "Upload and Add"
7. Wait for upload completion
8. Verify breadcrumbs.json updated with correct VideoLink
9. Verify video appears in VideoLinksManager list
10. Cleanup: Delete test project

**Expected Outcome**: Full workflow works end-to-end

---

### T016 [P] Integration test: Baker preview shows uploaded video
**File**: `tests/integration/Baker.integration.test.tsx`
**Dependencies**: T015
**Parallel**: Yes (different test file)

**Test Steps**:
1. Setup: Create breadcrumbs.json with videoLinks array (from upload)
2. Open Baker
3. Scan folder containing test project
4. Click "Preview" on project
5. Verify video appears in preview with:
   - Thumbnail from thumbnailUrl
   - Title from VideoLink
   - External link to Sprout Video
   - Upload date displayed
6. Cleanup: Delete test project

**Expected Outcome**: Uploaded videos display correctly in Baker preview

---

## Phase 3.5: Polish

### T017 Run component tests and verify all pass
**File**: N/A (test execution)
**Dependencies**: T014
**Parallel**: No

**Actions**:
1. Run: `npm run test src/components/Baker/VideoLinksManager.test.tsx`
2. Verify all tests pass (GREEN phase)
3. Check test coverage for VideoLinksManager.tsx
4. Add any missing edge case tests

**Expected Outcome**: All component tests passing, coverage >80%

---

### T018 Manual testing via quickstart.md
**File**: `specs/004-embed-multiple-video/quickstart.md`
**Dependencies**: T017
**Parallel**: No

**Actions**:
1. Execute Workflow 1 steps 1-8 (upload multiple videos)
2. Execute Workflow 6 steps 2-4 (error handling)
3. Verify all expected outcomes match actual behavior
4. Test edge cases:
   - Very large file (>1GB)
   - Network interruption during upload
   - Missing API key
   - Invalid file format
5. Document any issues found

**Expected Outcome**: Manual testing passes, user workflows validated

---

### T019 [P] Code cleanup and refactoring
**File**: `src/components/Baker/VideoLinksManager.tsx`
**Dependencies**: T018
**Parallel**: Yes (independent)

**Actions**:
1. Remove any console.log statements
2. Add JSDoc comments to helper functions
3. Extract magic numbers to constants (e.g., MAX_VIDEOS = 20)
4. Ensure consistent error message formatting
5. Run eslint and fix any warnings: `npm run eslint:fix`
6. Run prettier: `npm run prettier:fix`

**Expected Outcome**: Code clean, formatted, no linting errors

---

### T020 [P] Update component documentation
**File**: `src/components/Baker/VideoLinksManager.tsx` (JSDoc)
**Dependencies**: T019
**Parallel**: Yes (documentation only)

**Actions**:
1. Add JSDoc comment to component:
   ```typescript
   /**
    * VideoLinksManager - Manages video links associated with a project's breadcrumbs
    *
    * Features:
    * - Add videos via URL entry or direct file upload
    * - Fetch video metadata from Sprout Video API
    * - Upload videos with real-time progress tracking
    * - Reorder, remove, and update video links
    *
    * @param {string} projectPath - Absolute path to project folder
    */
   ```
2. Add JSDoc to helper functions
3. Add inline comments for complex logic

**Expected Outcome**: Component well-documented for future maintainers

---

## Dependencies Graph

```
T001 (Verify dependencies)
  ├─→ T002 [P] (Tab switching test)
  ├─→ T003 [P] (File selection test)
  ├─→ T004 [P] (Button states test)
  ├─→ T005 [P] (Progress bar test)
  ├─→ T006 [P] (Upload success test)
  ├─→ T007 [P] (Error handling test)
  └─→ T008 [P] (Cleanup test)

T002-T008 (All tests failing)
  └─→ T009 (Add Tabs wrapper)
       └─→ T010 (Integrate hooks)
            └─→ T011 (Create upload UI)
                 └─→ T012 (Helper function)
                      └─→ T013 (Upload handler)
                           └─→ T014 (Cleanup handlers)
                                ├─→ T015 (E2E integration test)
                                │    └─→ T016 [P] (Baker preview test)
                                └─→ T017 (Run all tests)
                                     └─→ T018 (Manual testing)
                                          ├─→ T019 [P] (Code cleanup)
                                          └─→ T020 [P] (Documentation)
```

---

## Parallel Execution Examples

### Phase 3.2: Write all component tests in parallel
```bash
# Launch T002-T008 together (different test cases in same file):
# These can be written concurrently by different developers or AI agents

Task: "Component test: Tab switching behavior in VideoLinksManager.test.tsx"
Task: "Component test: File selection workflow in VideoLinksManager.test.tsx"
Task: "Component test: Upload button disabled states in VideoLinksManager.test.tsx"
Task: "Component test: Progress bar updates in VideoLinksManager.test.tsx"
Task: "Component test: Successful upload auto-adds VideoLink in VideoLinksManager.test.tsx"
Task: "Component test: Error states and retry in VideoLinksManager.test.tsx"
Task: "Component test: Dialog cleanup in VideoLinksManager.test.tsx"
```

### Phase 3.5: Polish tasks in parallel
```bash
# Launch T019-T020 together:
Task: "Code cleanup and refactoring in VideoLinksManager.tsx"
Task: "Update component documentation in VideoLinksManager.tsx"
```

---

## Notes

### TDD Workflow
- **RED**: T002-T008 must all FAIL before T009
- **GREEN**: T009-T014 make tests pass incrementally
- **REFACTOR**: T019 cleans up code after tests pass

### Existing Dependencies (No Installation Needed)
- ✅ ShadCN Tabs component (`@/components/ui/tabs`)
- ✅ ShadCN Progress component (`@/components/ui/progress`)
- ✅ `useFileUpload` hook (`src/hooks/useFileUpload.ts`)
- ✅ `useUploadEvents` hook (`src/hooks/useUploadEvents.ts`)
- ✅ `upload_video` Tauri command (`src-tauri/src/commands/sprout_upload.rs`)
- ✅ `validateVideoLink` function (`src/utils/validation.ts`)

### Key Implementation Principles
1. **Code Reuse**: Leverage existing hooks, no new Tauri commands
2. **Backward Compatibility**: URL entry tab remains default, upload is additive
3. **Error Handling**: Graceful degradation with actionable error messages
4. **Performance**: Real-time progress via events, no polling
5. **State Cleanup**: Reset all state on dialog close and tab switch

### Avoid
- Creating new Tauri commands (use existing `upload_video`)
- Creating new hooks (reuse `useFileUpload` and `useUploadEvents`)
- Modifying backend Rust code (all changes are frontend)
- Breaking existing URL entry workflow

---

## Validation Checklist
*Verify before marking feature complete*

- [ ] All component tests written BEFORE implementation (T002-T008)
- [ ] All tests pass (GREEN phase) after implementation (T017)
- [ ] Integration tests cover E2E workflow (T015-T016)
- [ ] Manual testing via quickstart.md successful (T018)
- [ ] Code formatted and linted (T019)
- [ ] Component documented (T020)
- [ ] No breaking changes to existing URL entry workflow
- [ ] Upload state properly cleaned up on dialog close/tab switch
- [ ] Error messages are user-friendly and actionable
- [ ] Progress tracking works smoothly during upload

---

**Total Tasks**: 20 (7 parallel test tasks, 6 sequential implementation tasks, 2 integration tests, 5 polish tasks)
**Estimated Time**: 2-3 days (assuming existing tests and implementation experience)
**Risk Level**: Low (reusing existing code, additive feature, comprehensive tests)
