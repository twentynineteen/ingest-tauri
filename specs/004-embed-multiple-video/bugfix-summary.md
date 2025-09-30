# Bugfix Summary: Baker UI Issues

**Date**: 2025-09-30
**Branch**: `004-embed-multiple-video`
**Related Docs**: [bugfix-plan-baker-ui.md](./bugfix-plan-baker-ui.md)

## Quick Reference

### 3 Bugs to Fix

| # | Issue | File(s) | Severity | Effort |
|---|-------|---------|----------|--------|
| 1 | External links don't open in browser | VideoLinkCard.tsx, TrelloCardItem.tsx | High | Small |
| 2 | Trello card shows ID instead of title | TrelloCardsManager.tsx | Medium | Small |
| 3 | Unnecessary "X of N" count limits | VideoLinksManager.tsx, TrelloCardsManager.tsx | Low | Trivial |

## Bug Details

### Bug 1: External Links Not Working ⚠️ HIGH PRIORITY

**What's broken**: "Open in Sprout Video" and "Open in Trello" buttons don't work

**Why**: Using `window.open()` which doesn't work in Tauri desktop apps

**Fix**: Use Tauri's opener plugin
```typescript
// Change from:
window.open(videoLink.url, '_blank')

// To:
import { open } from '@tauri-apps/plugin-opener'
await open(videoLink.url)
```

**Files to edit**:
- `src/components/Baker/VideoLinkCard.tsx:33-35`
- `src/components/Baker/TrelloCardItem.tsx:41-43`

---

### Bug 2: Trello Card Title Shows ID 🔍 INVESTIGATE

**What's broken**: Card displays "Trello Card abc12345" instead of actual title

**Findings from investigation**:
✅ Tauri command (`baker_fetch_trello_card_details`) correctly fetches `data["name"]` from Trello API (line 1415 in baker.rs)
✅ Hook (`useBreadcrumbsTrelloCards`) correctly returns the fetched card data
❓ **Potential issue**: When cards are added WITHOUT API credentials, fallback text is used (line 114 in TrelloCardsManager.tsx)

**Likely scenarios**:
1. **User has no API credentials**: Expected behavior - shows fallback "Trello Card {id}"
2. **User has API credentials**: Should show fetched title - need to verify this is working

**Fix needed**: Verify that when API credentials ARE provided, the fetched title is correctly used. May need to check console logs when adding a card with API credentials enabled.

**File to investigate**:
- `src/components/Baker/TrelloCardsManager.tsx:82-109` (fetch and add flow)

---

### Bug 3: Unnecessary Count Limits 🎨 UX POLISH

**What's broken**: Shows "1 of 20 videos" and "1 of 10 cards" - limits aren't business requirements

**Fix**: Remove maximum counts, add pluralization
```typescript
// Change from:
{videoLinks.length} of 20 videos

// To:
{videoLinks.length} {videoLinks.length === 1 ? 'video' : 'videos'}
```

**Files to edit**:
- `src/components/Baker/VideoLinksManager.tsx:158`
- `src/components/Baker/TrelloCardsManager.tsx:185`

## Implementation Order

1. **Bug 1** (30 min) - Critical functionality fix
2. **Bug 3** (10 min) - Quick UX improvement while investigating Bug 2
3. **Bug 2** (20-60 min) - Needs testing with actual Trello API credentials to verify

## Testing Checklist

- [ ] Bug 1: Click "Open in Sprout Video" → Opens in browser
- [ ] Bug 1: Click "Open in Trello" → Opens in browser
- [ ] Bug 2: Add Trello card WITH API credentials → Shows actual card title
- [ ] Bug 2: Add Trello card WITHOUT API credentials → Shows fallback "Trello Card {id}"
- [ ] Bug 3: Video count shows "1 video" or "3 videos" (no "of 20")
- [ ] Bug 3: Trello count shows "1 card" or "5 cards" (no "of 10")

## Notes

- All bugs are UI-only, no data model or contract changes
- No new dependencies needed (`@tauri-apps/plugin-opener` already installed)
- Can be fixed and tested without rebuilding Rust backend (except Bug 1 needs Tauri rebuild for opener import)
- Total estimated time: 1-2 hours including testing

---
*Generated from /plan command | Part of feature 004-embed-multiple-video*
