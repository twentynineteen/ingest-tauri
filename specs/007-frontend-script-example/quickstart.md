# Quickstart Guide: AI Script Example Embedding Management

**Feature**: 007-frontend-script-example
**Audience**: Developers, QA testers, end users
**Date**: 2025-11-12

## Overview

This guide demonstrates the complete user workflow for managing script example embeddings. Follow these steps to verify the feature works end-to-end after implementation.

## Prerequisites

- Application installed and running
- Bundled examples already loaded (from build-time process)
- Two sample script files ready for testing:
  - `test-before.txt` (original script)
  - `test-after.txt` (formatted script)

## User Workflows

### Workflow 1: View Existing Examples

**Objective**: View bundled examples that ship with the application

**Steps**:

1. Launch the application
2. Navigate to **AI Tools** section from the sidebar or main menu
3. Click on **Example Embeddings** page
4. Observe the example list

**Expected Results**:
- ✅ Page displays title "Script Example Embeddings"
- ✅ Subtitle explains purpose: "Manage script examples for AI formatting"
- ✅ Example cards displayed in grid layout (1-3 columns depending on screen size)
- ✅ Each bundled example shows:
  - Title (e.g., "Introduction to Neural Networks")
  - Category badge (e.g., "educational")
  - Source badge showing "Bundled"
  - Preview text (first ~200 characters)
  - Tags (if any)
  - Word count
  - No delete/replace buttons (bundled examples protected)
- ✅ Tab navigation shows:
  - "All" tab with total count
  - "Bundled" tab with bundled count (>0)
  - "Uploaded" tab with user upload count (0 initially)

**Screenshot Checkpoints**:
- [ ] Example list populated with default examples
- [ ] Bundled badge visible and styled appropriately
- [ ] Action buttons hidden for bundled examples

---

### Workflow 2: Upload New Example

**Objective**: Add a custom script example to the database

**Steps**:

1. From the Example Embeddings page, click **Upload Example** button (top right)
2. Upload Dialog opens
3. Click **Choose file** for "Original Script"
   - Select `test-before.txt` from file system
   - Verify filename appears next to button
4. Click **Choose file** for "Formatted Script"
   - Select `test-after.txt` from file system
5. Fill in metadata form:
   - **Title**: "Test Conference Keynote"
   - **Category**: Select "Business" from dropdown
   - **Tags**: Enter "test, demo, presentation" (comma-separated)
   - **Quality Score**: Drag slider to 4/5
6. Click **Upload** button
7. Wait for processing (observe loading state)
8. Dialog closes automatically on success

**Expected Results**:
- ✅ Dialog opens smoothly with proper focus management
- ✅ File pickers accept only `.txt` files
- ✅ Selected filenames display clearly
- ✅ Form validation works:
  - Title required, max 200 chars
  - Category required
  - Files required
- ✅ Upload button shows loading state:
  - Text changes to "Generating embedding..."
  - Spinner icon appears
  - Button disabled during processing
- ✅ Success toast notification appears: "Example uploaded successfully"
- ✅ Example list auto-refreshes and shows new example
- ✅ New example appears with:
  - Correct title, category, tags
  - "Uploaded" badge (not "Bundled")
  - Delete and Replace buttons visible
  - Current timestamp

**Screenshot Checkpoints**:
- [ ] Upload dialog form validation
- [ ] Loading state during embedding generation
- [ ] Success notification
- [ ] New example in list with "Uploaded" badge

**Error Cases to Test**:
- Upload without selecting files → Validation error shown
- Upload file >1MB → "File too large" error
- Upload non-.txt file → File picker rejects
- Upload empty file → "Content too short" error

---

### Workflow 3: Filter Examples

**Objective**: Filter view by example source

**Steps**:

1. On Example Embeddings page with at least 1 uploaded example
2. Click **All** tab
   - Observe all examples displayed
3. Click **Bundled** tab
   - Observe only bundled examples shown
4. Click **Uploaded** tab
   - Observe only user-uploaded examples shown

**Expected Results**:
- ✅ Tab counts accurate (e.g., "All (15)", "Bundled (13)", "Uploaded (2)")
- ✅ Filtering happens instantly (no loading state)
- ✅ Filtered results correctly match source type
- ✅ Empty state shown if no examples match filter:
  - Icon (FileText)
  - Title: "No examples yet"
  - Description varies by tab

**Screenshot Checkpoints**:
- [ ] Tab navigation working
- [ ] Correct examples shown per tab
- [ ] Empty state (if filtering to empty list)

---

### Workflow 4: Replace Example

**Objective**: Update an existing user-uploaded example

**Steps**:

1. From Example Embeddings page, find a user-uploaded example
2. Click **Replace** button on the example card
3. Replace Dialog opens (similar to Upload Dialog)
4. Select new files:
   - `test-before-v2.txt`
   - `test-after-v2.txt`
5. Keep existing metadata or modify if desired
6. Click **Replace** button
7. Wait for processing
8. Dialog closes on success

**Expected Results**:
- ✅ Replace dialog pre-populates with existing metadata
- ✅ Only user-uploaded examples have Replace button
- ✅ Bundled examples do not show Replace button
- ✅ Processing flow same as upload (embedding generation)
- ✅ Success toast: "Example replaced successfully"
- ✅ Example card updates with new content preview
- ✅ Example ID remains the same (not a new entry)
- ✅ Word count updates if content length changed

**Screenshot Checkpoints**:
- [ ] Replace button only on uploaded examples
- [ ] Pre-populated metadata form
- [ ] Updated example card after replace

**Error Cases to Test**:
- Attempt to replace bundled example → No button available
- Replace with invalid file → Validation error

---

### Workflow 5: Delete Example

**Objective**: Remove a user-uploaded example from the database

**Steps**:

1. From Example Embeddings page, find a user-uploaded example
2. Click **Delete** button on the example card (red button)
3. Delete Confirmation Dialog opens
4. Read warning message:
   - "Are you sure you want to delete "[Example Title]"?"
   - "This action cannot be undone..."
5. Click **Delete** button in dialog (red)
6. Wait for deletion (observe loading state)
7. Dialog closes automatically

**Expected Results**:
- ✅ Delete button only visible on user-uploaded examples
- ✅ Bundled examples do not show Delete button
- ✅ Confirmation dialog shows example title in warning
- ✅ Delete button shows loading state:
  - Text changes to "Deleting..."
  - Spinner icon appears
- ✅ Success toast: "Example deleted successfully"
- ✅ Example immediately removed from list
- ✅ Example list count decrements
- ✅ If last user example deleted, "Uploaded" tab shows empty state

**Screenshot Checkpoints**:
- [ ] Delete confirmation dialog
- [ ] Loading state during deletion
- [ ] Example removed from list

**Error Cases to Test**:
- Attempt to delete bundled example → No button available
- Database error during delete → Error toast shown
- Delete non-existent ID → Error toast shown

---

### Workflow 6: Verify RAG Integration

**Objective**: Confirm uploaded examples are used by AI Script Formatter

**Steps**:

1. Complete Workflow 2 (upload custom example)
2. Navigate to **AI Tools > Script Formatter** page
3. Upload a script file similar to your uploaded example
4. Click **Format** button
5. Observe RAG retrieval process (check browser console logs)

**Expected Results**:
- ✅ Console log: `[useScriptRetrieval] Found N similar examples`
- ✅ Uploaded example appears in similarity search results (if relevant)
- ✅ AI formatting uses custom example for context
- ✅ No errors in console related to embeddings

**Verification**:
```javascript
// Open Browser DevTools Console
// Look for logs like:
[useScriptRetrieval] Starting retrieval...
[useScriptRetrieval] Generating embedding...
[useScriptRetrieval] Searching for similar examples...
[useScriptRetrieval] Found 3 similar examples
  1. Test Conference Keynote (87% similar)  // <-- Your uploaded example!
  2. Introduction to Neural Networks (72% similar)
  3. Business Presentation (68% similar)
```

---

## Manual QA Checklist

### Functional Tests

- [ ] View existing bundled examples
- [ ] Upload new example with all metadata fields filled
- [ ] Upload example with minimal metadata (only required fields)
- [ ] Filter by "All", "Bundled", "Uploaded" tabs
- [ ] Replace user-uploaded example
- [ ] Delete user-uploaded example with confirmation
- [ ] Cancel upload dialog (no changes persisted)
- [ ] Cancel delete dialog (example not deleted)
- [ ] Upload duplicate title (should succeed, unique ID)
- [ ] Upload very long script (test file size limit)
- [ ] Upload script with special characters (UTF-8 test)
- [ ] Verify uploaded example appears in RAG search

### UI/UX Tests

- [ ] Page loads quickly (<1s)
- [ ] Example cards responsive (resize browser window)
- [ ] Dialogs centered and properly sized
- [ ] Tab navigation keyboard accessible (Tab, Enter, Escape)
- [ ] Loading states clear and informative
- [ ] Success/error toast notifications appear
- [ ] Breadcrumb navigation correct
- [ ] Icons render properly (Upload, Delete, Replace, FileText)
- [ ] Color scheme matches app theme
- [ ] Text readable (contrast, font size)

### Error Handling Tests

- [ ] Upload without files → Validation error
- [ ] Upload with wrong file extension → Rejected by picker
- [ ] Upload file >1MB → Error message
- [ ] Upload empty file → Validation error
- [ ] Upload with title >200 chars → Validation error
- [ ] Upload with invalid category → Cannot happen (dropdown)
- [ ] Delete non-existent example → Error toast
- [ ] Database unavailable → Error message
- [ ] Network error during upload → Error toast with retry option

### Performance Tests

- [ ] Page load with 50 examples <2s
- [ ] Page load with 500 examples <5s
- [ ] Upload example end-to-end <5s
- [ ] Delete example <500ms
- [ ] Replace example <5s
- [ ] Filter switching instant (<100ms)
- [ ] Scroll performance smooth (60fps)

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape, Arrow keys)
- [ ] Screen reader announces dialogs, buttons, states
- [ ] Focus management in dialogs (trap focus, restore on close)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Interactive elements have visible focus indicators
- [ ] Form labels associated with inputs
- [ ] Error messages announced to screen readers

---

## Developer Verification

### Backend Tests (Rust)

Run backend tests:
```bash
cd src-tauri
cargo test --package bucket --lib commands::rag::tests
```

**Expected Output**:
```
running 8 tests
test commands::rag::tests::test_upload_example_success ... ok
test commands::rag::tests::test_upload_invalid_dimensions ... ok
test commands::rag::tests::test_replace_example_success ... ok
test commands::rag::tests::test_replace_bundled_rejected ... ok
test commands::rag::tests::test_delete_example_success ... ok
test commands::rag::tests::test_delete_bundled_rejected ... ok
test commands::rag::tests::test_get_all_examples ... ok
test commands::rag::tests::test_validate_example_file ... ok

test result: ok. 8 passed; 0 failed; 0 ignored
```

### Frontend Tests (Vitest)

Run frontend tests:
```bash
npm run test
```

**Expected Output**:
```
✓ tests/pages/AI/ExampleEmbeddings/ExampleEmbeddings.test.tsx (5)
✓ tests/pages/AI/ExampleEmbeddings/ExampleList.test.tsx (3)
✓ tests/pages/AI/ExampleEmbeddings/ExampleCard.test.tsx (4)
✓ tests/pages/AI/ExampleEmbeddings/UploadDialog.test.tsx (6)
✓ tests/pages/AI/ExampleEmbeddings/DeleteConfirm.test.tsx (3)
✓ tests/hooks/useExampleManagement.test.ts (8)
✓ tests/hooks/useFileUpload.test.ts (5)

Test Files  7 passed (7)
     Tests  34 passed (34)
  Start at  14:32:15
  Duration  2.34s
```

### Database Inspection

Verify database state after upload:
```bash
sqlite3 src-tauri/resources/embeddings/examples.db
```

```sql
-- Check example_scripts table
SELECT id, title, category, source, created_at
FROM example_scripts
ORDER BY created_at DESC
LIMIT 5;

-- Verify embedding dimensions
SELECT script_id, dimension, length(embedding) as blob_size
FROM embeddings
WHERE script_id IN (
  SELECT id FROM example_scripts WHERE source = 'user-uploaded'
);

-- Count by source
SELECT source, COUNT(*) as count
FROM example_scripts
GROUP BY source;
```

**Expected Results**:
- User-uploaded examples have `source='user-uploaded'`
- All embeddings have `dimension=384`
- Blob size = 1536 bytes (384 floats × 4 bytes)

---

## Troubleshooting

### Issue: Upload fails with "Invalid embedding dimensions"

**Cause**: Frontend embedding generation produced wrong size vector

**Solution**:
1. Check browser console for useEmbedding errors
2. Verify model loaded: `Xenova/all-MiniLM-L6-v2`
3. Check embedding output: `console.log(embedding.length)` should be 384

### Issue: Bundled examples missing after build

**Cause**: Build script (`npm run embed:examples`) not run

**Solution**:
```bash
npm run embed:examples  # Regenerate embeddings
npm run build:tauri     # Rebuild app
```

### Issue: Delete button missing on user-uploaded examples

**Cause**: `source` column not set correctly

**Solution**:
```sql
-- Check source values
SELECT id, title, source FROM example_scripts;

-- Fix if needed
UPDATE example_scripts
SET source = 'user-uploaded'
WHERE id LIKE '%-%-%-%--%';  -- UUIDs for user uploads
```

### Issue: Example list not refreshing after upload

**Cause**: TanStack Query cache not invalidating

**Solution**:
1. Check `queryClient.invalidateQueries(['examples', 'list'])` called in mutation onSuccess
2. Verify React Query DevTools shows cache invalidation
3. Hard refresh list: `queryClient.refetchQueries(['examples', 'list'])`

---

## Success Criteria

Feature is complete when:

- ✅ All 6 user workflows pass
- ✅ All manual QA checklist items pass
- ✅ All backend tests pass (8/8)
- ✅ All frontend tests pass (34/34)
- ✅ Database schema updated with `source` column
- ✅ No console errors during normal usage
- ✅ Performance targets met (<5s upload, <100ms filter)
- ✅ Accessibility requirements met (keyboard nav, screen readers)
- ✅ Uploaded examples appear in RAG search results

---

## Next Steps

After validation:
1. Update CLAUDE.md with new feature
2. Increment version to 0.8.7 in package.json
3. Create PR for review
4. Merge to release branch
5. Build and test release candidate
6. Deploy to production

---

**Version**: 1.0.0
**Last Updated**: 2025-11-12
