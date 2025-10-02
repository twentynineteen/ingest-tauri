# Bugfix Plan: Baker UI Issues (Phase 2 Enhancements)

**Branch**: `004-embed-multiple-video` | **Date**: 2025-09-30 | **Type**: Bugfix/Enhancement
**Parent Feature**: [004-embed-multiple-video](./spec.md)

## Summary
Three UI/UX bugs discovered in the Baker page's Found Projects section after implementing Phase 2 (URL auto-fetch). These are minor fixes that improve usability and correctness.

## Bugs Identified

### Bug 1: External link buttons not opening URLs
**Location**: `VideoLinkCard.tsx:33-35` and `TrelloCardItem.tsx:41-43`
**Issue**: The "Open in Sprout Video" and "Open in Trello" buttons use `window.open()` which doesn't work in Tauri desktop apps
**Expected**: Clicking should open the URL in the user's default browser
**Actual**: Nothing happens when clicked

**Root Cause**: Tauri desktop apps don't have direct access to `window.open()`. Must use Tauri's `@tauri-apps/plugin-opener` API.

### Bug 2: Trello card displays ID instead of title
**Location**: `TrelloCardItem.tsx:64`
**Issue**: The card title displays `trelloCard.title` but this is being set to the card ID
**Expected**: Display the fetched card name/title from Trello API
**Actual**: Displays "Trello Card abc12345" (the cardId) instead of actual title

**Root Cause**: When adding a card without API credentials (line 114 in TrelloCardsManager.tsx), the title is set to `Trello Card ${cardId}` as a fallback. Even when API credentials are provided, the fetched title may not be correctly assigned.

### Bug 3: Unnecessary "X of N" count information
**Location**: `VideoLinksManager.tsx:158` and `TrelloCardsManager.tsx:185`
**Issue**: Displays "1 of 20 videos" and "1 of 10 cards" which shows arbitrary maximum limits
**Expected**: Just show the count without the maximum (e.g., "1 video" or "3 cards")
**Actual**: Shows misleading maximum limits that aren't business requirements

**Root Cause**: Hard-coded display logic showing limits that were implementation details, not business requirements.

## Technical Context

**Language/Version**: TypeScript 5.7, React 18.3, Tauri 2.0
**Primary Dependencies**: `@tauri-apps/plugin-opener` (already installed), `@tauri-apps/api`
**Storage**: N/A (UI-only fixes)
**Testing**: Manual testing in Baker page
**Target Platform**: Desktop (Tauri)
**Project Type**: Desktop application (Tauri + React)
**Performance Goals**: No performance impact
**Constraints**: Must work across all platforms (macOS, Windows, Linux)
**Scale/Scope**: 3 small file edits

## Constitution Check
*Simplified bugfix - constitution requirements relaxed for small fixes*

**Simplicity**: ✅
- No new projects, libraries, or patterns
- Direct fixes to existing components
- No new dependencies (opener already installed)

**Architecture**: ✅
- Fixes within existing component files
- No new CLI needed
- No new libraries needed

**Testing**: ⚠️ Manual testing only
- Changes are UI-only and low-risk
- No data model or contract changes
- Manual verification in Baker page sufficient

**Observability**: N/A
- UI-only changes, no logging needed

**Versioning**: N/A
- No API contract changes
- No breaking changes

## Implementation Tasks

### Task 1: Fix external link opening in Tauri
**Files**:
- `/Users/ptsnac/Documents/VSCODE/ingest-tauri/src/components/Baker/VideoLinkCard.tsx`
- `/Users/ptsnac/Documents/VSCODE/ingest-tauri/src/components/Baker/TrelloCardItem.tsx`

**Changes**:
1. Import `open` from `@tauri-apps/plugin-opener`
2. Replace `window.open(url, '_blank')` with `open(url)`
3. Handle async/await for the `open()` call
4. Add error handling for failed opens

**Code Pattern**:
```typescript
import { open } from '@tauri-apps/plugin-opener'

const openInBrowser = async () => {
  try {
    await open(videoLink.url) // or trelloCard.url
  } catch (error) {
    console.error('Failed to open URL:', error)
  }
}
```

### Task 2: Fix Trello card title display
**Files**:
- `/Users/ptsnac/Documents/VSCODE/ingest-tauri/src/components/Baker/TrelloCardsManager.tsx` (lines 110-116)

**Investigation Needed**:
- Check if `fetchCardDetailsAsync()` is correctly returning the title
- Verify the Trello API hook is parsing the response correctly
- May need to check `useBreadcrumbsTrelloCards` hook implementation

**Expected Fix**:
- When API credentials are NOT available: Keep current fallback behavior
- When API credentials ARE available: Ensure fetched `cardData.title` contains the actual Trello card name
- May need to look at Tauri command `baker_fetch_trello_card_details` response mapping

### Task 3: Remove unnecessary count limits from UI
**Files**:
- `/Users/ptsnac/Documents/VSCODE/ingest-tauri/src/components/Baker/VideoLinksManager.tsx` (line 158)
- `/Users/ptsnac/Documents/VSCODE/ingest-tauri/src/components/Baker/TrelloCardsManager.tsx` (line 185)

**Changes**:
1. Remove " of 20" from video links description
2. Remove " of 10" from Trello cards description
3. Pluralize correctly: "1 video" vs "3 videos", "1 card" vs "5 cards"

**Code Pattern**:
```typescript
// Before
<p className="text-sm text-gray-500">
  {videoLinks.length} of 20 videos • Sprout Video uploads
</p>

// After
<p className="text-sm text-gray-500">
  {videoLinks.length} {videoLinks.length === 1 ? 'video' : 'videos'} • Sprout Video uploads
</p>
```

## Validation Steps

### Bug 1 Validation
1. Open Baker page
2. Navigate to a project with video links
3. Click "Open in Sprout Video" button
4. ✅ Browser should open to the Sprout Video URL
5. Navigate to a project with Trello cards
6. Click "Open in Trello" button
7. ✅ Browser should open to the Trello card URL

### Bug 2 Validation
1. Configure Trello API credentials in Settings
2. Add a Trello card to a project using a valid Trello URL
3. ✅ Card should display the actual Trello card title, not "Trello Card {id}"
4. Remove API credentials
5. Add another Trello card
6. ✅ Should fallback to "Trello Card {id}" format

### Bug 3 Validation
1. Open Baker page with projects
2. Check video links section header
3. ✅ Should show "1 video" or "3 videos" (no "of 20")
4. Check Trello cards section header
5. ✅ Should show "1 card" or "5 cards" (no "of 10")
6. ✅ Pluralization should be correct

## Complexity Tracking
*No constitutional violations - all changes are simple edits*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | N/A | N/A |

## Progress Tracking

**Implementation Status**:
- [ ] Task 1: Fix external link opening
- [ ] Task 2: Fix Trello card title display
- [ ] Task 3: Remove unnecessary count limits
- [ ] Manual validation complete

**Investigation Needed**:
- [ ] Verify `useBreadcrumbsTrelloCards` hook implementation
- [ ] Check `baker_fetch_trello_card_details` Tauri command response
- [ ] Confirm Trello API response includes `name` field mapped to `title`

---
*Part of Feature 004-embed-multiple-video | See [plan.md](./plan.md) for full feature context*
