# Quickstart Guide: Multiple Video Links and Trello Cards

**Feature**: 004-embed-multiple-video
**Date**: 2025-09-30
**For**: Developers implementing and testing the feature

## Overview

This guide demonstrates the complete user workflows for managing multiple video links and Trello cards in project breadcrumbs files. Follow this guide to validate the feature works end-to-end.

---

## Prerequisites

1. **Development Environment**:
   ```bash
   npm run dev:tauri  # Start app with devtools
   ```

2. **Test Project Structure**:
   ```
   /path/to/TestProject/
   ├── Footage/
   │   ├── Camera 1/
   │   └── Camera 2/
   ├── Graphics/
   ├── Renders/
   │   ├── final-edit-v1.mp4
   │   └── final-edit-v2.mp4
   ├── Projects/
   ├── Scripts/
   └── breadcrumbs.json
   ```

3. **API Credentials** (in Settings):
   - Sprout Video API key
   - Trello API key + token

---

## Workflow 1: Upload Multiple Videos and Associate with Project

### User Story
As a video editor, I want to upload 2 final render videos to Sprout Video and associate both with my project's breadcrumbs file.

### Steps

1. **Navigate to BuildProject page**
   ```
   Open app → BuildProject tab
   ```

2. **Select test project folder**
   ```
   Click "Select Project Folder"
   Choose: /path/to/TestProject
   ```

3. **Upload first video**
   ```
   Click "Upload Video" button
   File picker defaults to: /path/to/TestProject/Renders/
   Select: final-edit-v1.mp4
   Enter title: "Final Edit - Version 1"
   Click "Upload to Sprout Video"
   ```

   **Expected**:
   - Progress bar shows upload progress
   - On completion: Video thumbnail appears
   - Sprout Video link displayed
   - Breadcrumbs updated indicator shown

4. **Verify first video association**
   ```
   Click "View Breadcrumbs" button
   Navigate to "Videos" tab in preview modal
   ```

   **Expected**:
   - 1 video card shown
   - Thumbnail displayed (from Sprout CDN)
   - Title: "Final Edit - Version 1"
   - Link to Sprout Video functional
   - Source file: "final-edit-v1.mp4" displayed

5. **Upload second video**
   ```
   Click "Upload Another Video" button
   Select: final-edit-v2.mp4
   Enter title: "Final Edit - Version 2"
   Click "Upload to Sprout Video"
   ```

   **Expected**:
   - Second video uploads successfully
   - Both videos now shown in preview

6. **Verify breadcrumbs.json file**
   ```
   Open: /path/to/TestProject/breadcrumbs.json
   ```

   **Expected JSON structure**:
   ```json
   {
     "projectTitle": "TestProject",
     "videoLinks": [
       {
         "url": "https://sproutvideo.com/videos/abc123",
         "sproutVideoId": "abc123",
         "title": "Final Edit - Version 1",
         "thumbnailUrl": "https://cdn.sproutvideo.com/.../frame_0000.jpg",
         "uploadDate": "2025-01-20T14:22:00.000Z",
         "sourceRenderFile": "final-edit-v1.mp4"
       },
       {
         "url": "https://sproutvideo.com/videos/def456",
         "sproutVideoId": "def456",
         "title": "Final Edit - Version 2",
         "thumbnailUrl": "https://cdn.sproutvideo.com/.../frame_0001.jpg",
         "uploadDate": "2025-01-20T14:25:00.000Z",
         "sourceRenderFile": "final-edit-v2.mp4"
       }
     ]
   }
   ```

---

## Workflow 2: Associate Multiple Trello Cards with Project

### User Story
As a project manager, I want to link 3 Trello cards (pre-production, production, post-production) to a single project's breadcrumbs file.

### Steps

1. **Navigate to project breadcrumbs editor**
   ```
   BuildProject → Select project → "Edit Breadcrumbs" button
   OR
   Baker → Scan folder → Select project → "Edit" button
   ```

2. **Add first Trello card**
   ```
   Navigate to "Trello Cards" tab
   Click "Add Trello Card" button
   Paste URL: https://trello.com/c/abc123/pre-production-phase
   Click "Fetch Card Details"
   ```

   **Expected**:
   - Loading spinner shown
   - Card title fetched from API: "Client Project A - Pre-Production"
   - Board name displayed: "Video Projects 2025"
   - Card preview shown with title and board

3. **Add second Trello card**
   ```
   Click "Add Another Card" button
   Paste URL: https://trello.com/c/def456/production-phase
   Click "Fetch Card Details"
   ```

   **Expected**:
   - Second card fetched successfully
   - Both cards shown in list

4. **Add third Trello card**
   ```
   Click "Add Another Card" button
   Paste URL: https://trello.com/c/ghi789/post-production-phase
   Click "Fetch Card Details"
   ```

   **Expected**:
   - Third card added
   - All 3 cards visible with titles and board names

5. **Save breadcrumbs**
   ```
   Click "Save Changes" button
   ```

   **Expected**:
   - Success toast notification
   - Modal closes
   - Breadcrumbs file updated on disk

6. **Verify breadcrumbs.json file**
   ```json
   {
     "projectTitle": "TestProject",
     "trelloCardUrl": "https://trello.com/c/abc123/pre-production-phase",
     "trelloCards": [
       {
         "url": "https://trello.com/c/abc123/pre-production-phase",
         "cardId": "abc123",
         "title": "Client Project A - Pre-Production",
         "boardName": "Video Projects 2025",
         "lastFetched": "2025-01-20T10:00:00.000Z"
       },
       {
         "url": "https://trello.com/c/def456/production-phase",
         "cardId": "def456",
         "title": "Client Project A - Production",
         "boardName": "Video Projects 2025",
         "lastFetched": "2025-01-20T10:00:05.000Z"
       },
       {
         "url": "https://trello.com/c/ghi789/post-production-phase",
         "cardId": "ghi789",
         "title": "Client Project A - Post-Production",
         "boardName": "Video Projects 2025",
         "lastFetched": "2025-01-20T10:00:10.000Z"
       }
     ]
   }
   ```

   **Note**: `trelloCardUrl` is preserved for backward compatibility (points to first card)

---

## Workflow 3: Reorder and Remove Videos

### User Story
As a user, I want to reorder my video links to show the most important video first, and remove outdated videos.

### Steps

1. **Open video management UI**
   ```
   BuildProject → Select project → "Manage Videos" button
   ```

   **Expected**: Modal shows 2 videos from Workflow 1

2. **Reorder videos (move second video to first position)**
   ```
   Click "↑" arrow on "Final Edit - Version 2" card
   ```

   **Expected**:
   - Videos swap positions
   - "Final Edit - Version 2" now at top
   - "Final Edit - Version 1" now second

3. **Save reordered videos**
   ```
   Click "Save Changes"
   ```

   **Expected**:
   - videoLinks array in breadcrumbs.json reflects new order

4. **Remove first video**
   ```
   Click "Remove" (trash icon) on "Final Edit - Version 2"
   Confirm deletion in dialog
   ```

   **Expected**:
   - Video removed from list
   - Only "Final Edit - Version 1" remains
   - breadcrumbs.json updated with single video

---

## Workflow 4: Baker Scan and Preview Multiple Media

### User Story
As a user scanning projects with Baker, I want to preview all videos and Trello cards associated with each project before updating breadcrumbs.

### Steps

1. **Navigate to Baker page**
   ```
   Open app → Baker tab
   ```

2. **Select folder to scan**
   ```
   Click "Select Drive/Folder"
   Choose: /path/to/parent/folder (containing multiple projects)
   Set scan options:
     - Max depth: 2
     - Create missing: Yes
     - Backup originals: Yes
   Click "Start Scan"
   ```

   **Expected**:
   - Progress bar shows scan progress
   - Projects discovered in real-time
   - Scan completes with summary: "X projects found"

3. **Preview project with multiple videos and cards**
   ```
   Find project with multi-media in results table
   Click "Preview" button on TestProject row
   ```

   **Expected preview modal**:
   - **Videos section** (tabs or accordion):
     - 2 video cards displayed
     - Each card shows:
       - Thumbnail image (cached URL)
       - Video title
       - Upload date
       - Link to Sprout Video (external link icon)
       - Source render file name

   - **Trello Cards section**:
     - 3 Trello card items displayed
     - Each item shows:
       - Card title (fetched from API)
       - Board name
       - Last fetched timestamp
       - Link to Trello card (external link icon)

   - **Files section** (existing):
     - Camera file listing (unchanged)

4. **Verify no real-time API calls**
   ```
   Open browser devtools → Network tab
   Trigger preview modal multiple times
   ```

   **Expected**:
   - No API calls to Trello or Sprout Video during preview
   - All data loaded from cached breadcrumbs.json
   - Fast preview rendering (<100ms)

5. **Update breadcrumbs for multiple projects**
   ```
   Select 3 projects with checkboxes
   Click "Apply Changes to Selected"
   Confirm bulk update dialog
   ```

   **Expected**:
   - Batch update confirmation shows:
     - Summary of changes per project
     - Video/Trello metadata preserved
     - Only file listings updated (if stale)
   - Success: "3 projects updated successfully"

---

## Workflow 5: Backward Compatibility (Legacy Breadcrumbs)

### User Story
As a user with existing projects (pre-Phase 004), I want my old breadcrumbs files to work seamlessly after upgrading to the new version.

### Steps

1. **Prepare legacy breadcrumbs file**
   ```
   Create: /path/to/LegacyProject/breadcrumbs.json
   ```

   ```json
   {
     "projectTitle": "Legacy Project",
     "numberOfCameras": 2,
     "files": [ /* ... */ ],
     "parentFolder": "/path/to/parent",
     "createdBy": "user@example.com",
     "creationDateTime": "2024-06-15T10:00:00.000Z",
     "trelloCardUrl": "https://trello.com/c/legacy123/old-project"
   }
   ```

2. **Open legacy project in Baker**
   ```
   Baker → Scan /path/to/parent
   Select "Legacy Project" → Click "Preview"
   ```

   **Expected**:
   - **Trello Cards section** shows:
     - 1 Trello card (migrated from trelloCardUrl)
     - Card ID: "legacy123"
     - Title: "(Not fetched)" or blank (will fetch on demand)
     - Link functional

   - **Videos section**: Empty (no videoLinks in legacy file)

3. **Add new video to legacy project**
   ```
   In preview modal → Click "Add Video"
   Upload video via Sprout integration
   Save changes
   ```

   **Expected breadcrumbs.json after save**:
   ```json
   {
     "projectTitle": "Legacy Project",
     "trelloCardUrl": "https://trello.com/c/legacy123/old-project",
     "videoLinks": [
       {
         "url": "https://sproutvideo.com/videos/new123",
         "sproutVideoId": "new123",
         "title": "New Video",
         "thumbnailUrl": "https://cdn.sproutvideo.com/.../frame.jpg",
         "uploadDate": "2025-01-20T15:00:00.000Z"
       }
     ],
     "trelloCards": [
       {
         "url": "https://trello.com/c/legacy123/old-project",
         "cardId": "legacy123",
         "title": "Old Project",
         "lastFetched": "2025-01-20T15:00:00.000Z"
       }
     ]
   }
   ```

   **Note**: Legacy `trelloCardUrl` preserved, new arrays added

---

## Workflow 6: Error Handling and Edge Cases

### User Story
As a user, I want clear error messages when things go wrong (invalid URLs, API failures, etc.).

### Steps

1. **Test invalid video URL**
   ```
   BuildProject → Manage Videos → Add Video
   Enter URL: http://example.com/video (non-HTTPS)
   Click "Add"
   ```

   **Expected**:
   - Error toast: "Video URL must use HTTPS"
   - Video not added to list

2. **Test invalid Trello URL**
   ```
   Manage Trello Cards → Add Card
   Enter URL: https://example.com/not-trello
   Click "Fetch Details"
   ```

   **Expected**:
   - Error toast: "Invalid Trello card URL format"
   - Card not added

3. **Test API failure (Trello)**
   ```
   Add Trello card with valid URL but invalid API credentials
   Click "Fetch Details"
   ```

   **Expected**:
   - Error toast: "Failed to fetch Trello card: Unauthorized (401)"
   - Card not added
   - Manual "Retry" button shown

4. **Test maximum video limit**
   ```
   Add 20 videos to a project
   Attempt to add 21st video
   ```

   **Expected**:
   - Error toast: "Maximum of 20 videos per project reached"
   - Add button disabled

5. **Test maximum Trello card limit**
   ```
   Add 10 Trello cards to a project
   Attempt to add 11th card
   ```

   **Expected**:
   - Error toast: "Maximum of 10 Trello cards per project reached"
   - Add button disabled

6. **Test duplicate Trello card ID**
   ```
   Add Trello card with URL: https://trello.com/c/duplicate123/card
   Attempt to add same card ID with different slug:
     https://trello.com/c/duplicate123/different-name
   ```

   **Expected**:
   - Error toast: "This Trello card is already associated with the project"
   - Duplicate not added

---

## Verification Checklist

After completing all workflows, verify:

- [ ] Multiple videos can be uploaded and associated with breadcrumbs
- [ ] Multiple Trello cards can be added and fetched from API
- [ ] Videos and cards can be reordered via UI
- [ ] Videos and cards can be removed from breadcrumbs
- [ ] Baker preview displays all videos and Trello cards correctly
- [ ] Legacy breadcrumbs files (pre-004) work without migration errors
- [ ] New breadcrumbs files include both new arrays and backward-compatible fields
- [ ] API errors are handled gracefully with clear messages
- [ ] Maximum limits (20 videos, 10 cards) are enforced
- [ ] Duplicate Trello card IDs are rejected
- [ ] breadcrumbs.json file format is valid JSON and human-readable
- [ ] No real-time API calls during Baker scans (uses cached data)
- [ ] External links to Sprout Video and Trello open correctly

---

## Troubleshooting

### Videos not appearing in preview

**Check**:
1. breadcrumbs.json has `videoLinks` array populated
2. `thumbnailUrl` field is present (should be cached from upload)
3. Browser console for network errors (CORS, 404 on thumbnail)

**Fix**:
- Re-upload video to refresh thumbnail URL
- Check Sprout Video API key is valid

### Trello card titles showing as blank

**Check**:
1. `lastFetched` timestamp is present
2. Trello API credentials in Settings are valid
3. Card ID extracted correctly from URL

**Fix**:
- Click "Refresh" button to re-fetch from API
- Verify API key/token have not expired

### Baker scan not detecting videos/cards

**Check**:
1. breadcrumbs.json file is valid JSON (not corrupted)
2. `videoLinks` and `trelloCards` arrays are present (not null/undefined)

**Fix**:
- Use "Validate breadcrumbs" button in Baker to check file integrity
- If corrupted, Baker will offer to regenerate from file system

---

## Next Steps

With Quickstart validated, proceed to:
1. **Phase 2 (tasks.md)**: Break down implementation into ordered tasks
2. **Phase 3-4 (execution)**: Implement following TDD principles
3. **Phase 5 (validation)**: Run all tests and execute this Quickstart end-to-end