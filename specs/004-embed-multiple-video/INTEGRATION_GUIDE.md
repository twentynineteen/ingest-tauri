# Integration Guide: Multiple Video Links and Trello Cards

**Feature**: 004-embed-multiple-video
**Status**: ✅ Complete - Ready for Integration

---

## Overview

This feature adds support for multiple video links and Trello cards in breadcrumbs files, replacing the legacy single `trelloCardUrl` field with arrays that support up to 20 videos and 10 Trello cards per project.

---

## Quick Start

### 1. Import Components

```tsx
import { VideoLinksManager } from '@/components/Baker/VideoLinksManager'
import { TrelloCardsManager } from '@/components/Baker/TrelloCardsManager'
```

### 2. Add to Baker UI

```tsx
export function BakerProjectDetails({ projectPath }: { projectPath: string }) {
  return (
    <div className="space-y-6">
      {/* Existing project details... */}

      {/* Video Links Section */}
      <section>
        <VideoLinksManager projectPath={projectPath} />
      </section>

      {/* Trello Cards Section */}
      <section>
        <TrelloCardsManager
          projectPath={projectPath}
          trelloApiKey={userSettings?.trelloApiKey}
          trelloApiToken={userSettings?.trelloApiToken}
        />
      </section>
    </div>
  )
}
```

---

## Integration Points

### A. Baker Scan Results Page

**File**: `src/components/Baker/ScanResults.tsx`

Add the managers to the project details view:

```tsx
import { VideoLinksManager } from './VideoLinksManager'
import { TrelloCardsManager } from './TrelloCardsManager'

// Inside ScanResults component, where project details are shown:
{selectedProject && (
  <div className="space-y-8">
    {/* Existing breadcrumbs info */}
    <BreadcrumbsInfo breadcrumbs={selectedProject.breadcrumbs} />

    {/* NEW: Video Links */}
    <VideoLinksManager projectPath={selectedProject.path} />

    {/* NEW: Trello Cards */}
    <TrelloCardsManager
      projectPath={selectedProject.path}
      trelloApiKey={settings.trello?.apiKey}
      trelloApiToken={settings.trello?.apiToken}
    />
  </div>
)}
```

### B. Upload Sprout Workflow Integration

**File**: `src/pages/UploadSprout.tsx`

After successful video upload, associate the video with the project:

```tsx
import { useBreadcrumbsVideoLinks } from '@/hooks/useBreadcrumbsVideoLinks'
import type { VideoLink } from '@/types/baker'

export function UploadSprout() {
  const { addVideoLinkAsync } = useBreadcrumbsVideoLinks({
    projectPath: currentProject.path
  })

  const handleUploadComplete = async (uploadResult: SproutUploadResult) => {
    // Create VideoLink from upload result
    const videoLink: VideoLink = {
      url: uploadResult.embedUrl,
      sproutVideoId: uploadResult.id,
      title: uploadResult.title,
      thumbnailUrl: uploadResult.assets?.posterFrames?.[0],
      uploadDate: new Date().toISOString(),
      sourceRenderFile: selectedRenderFile.name
    }

    try {
      await addVideoLinkAsync(videoLink)
      toast.success('Video associated with project')
    } catch (error) {
      console.error('Failed to associate video:', error)
    }
  }

  // ... rest of upload logic
}
```

### C. Trello Integration

**File**: `src/pages/UploadTrello.tsx`

After creating/updating a Trello card, associate it with the project:

```tsx
import { useBreadcrumbsTrelloCards } from '@/hooks/useBreadcrumbsTrelloCards'
import type { TrelloCard } from '@/types/baker'

export function UploadTrello() {
  const { addTrelloCardAsync } = useBreadcrumbsTrelloCards({
    projectPath: currentProject.path
  })

  const handleCardCreated = async (cardData: TrelloApiResponse) => {
    const trelloCard: TrelloCard = {
      url: cardData.url,
      cardId: cardData.id,
      title: cardData.name,
      boardName: cardData.board?.name,
      lastFetched: new Date().toISOString()
    }

    try {
      await addTrelloCardAsync(trelloCard)
      toast.success('Trello card associated with project')
    } catch (error) {
      console.error('Failed to associate card:', error)
    }
  }

  // ... rest of Trello logic
}
```

---

## API Reference

### Custom Hooks

#### `useBreadcrumbsVideoLinks`

```tsx
const {
  videoLinks,              // VideoLink[] - Current video links
  isLoading,              // boolean - Loading state
  error,                  // Error | null
  addVideoLink,           // (link: VideoLink) => void
  addVideoLinkAsync,      // (link: VideoLink) => Promise<BreadcrumbsFile>
  removeVideoLink,        // (index: number) => void
  removeVideoLinkAsync,   // (index: number) => Promise<BreadcrumbsFile>
  updateVideoLink,        // ({ videoIndex, updatedLink }) => void
  updateVideoLinkAsync,   // ({ videoIndex, updatedLink }) => Promise<BreadcrumbsFile>
  reorderVideoLinks,      // ({ fromIndex, toIndex }) => void
  reorderVideoLinksAsync, // ({ fromIndex, toIndex }) => Promise<BreadcrumbsFile>
  isUpdating,             // boolean - Mutation in progress
  addError,               // Error | null
  removeError,            // Error | null
  updateError,            // Error | null
  reorderError            // Error | null
} = useBreadcrumbsVideoLinks({
  projectPath: string,
  enabled?: boolean       // default: true
})
```

#### `useBreadcrumbsTrelloCards`

```tsx
const {
  trelloCards,            // TrelloCard[] - Current Trello cards
  isLoading,              // boolean - Loading state
  error,                  // Error | null
  addTrelloCard,          // (card: TrelloCard) => void
  addTrelloCardAsync,     // (card: TrelloCard) => Promise<BreadcrumbsFile>
  removeTrelloCard,       // (index: number) => void
  removeTrelloCardAsync,  // (index: number) => Promise<BreadcrumbsFile>
  fetchCardDetails,       // ({ cardUrl, apiKey, apiToken }) => void
  fetchCardDetailsAsync,  // ({ cardUrl, apiKey, apiToken }) => Promise<TrelloCard>
  isUpdating,             // boolean - Add/remove in progress
  isFetchingDetails,      // boolean - Fetching from API
  addError,               // Error | null
  removeError,            // Error | null
  fetchError,             // Error | null
  fetchedCardData         // TrelloCard | undefined - Last fetched card
} = useBreadcrumbsTrelloCards({
  projectPath: string,
  enabled?: boolean       // default: true
})
```

### Validation Utilities

```tsx
import {
  validateVideoLink,
  validateTrelloCard,
  extractTrelloCardId
} from '@/utils/validation'

// Returns array of error messages (empty if valid)
const errors = validateVideoLink(videoLink)
const errors = validateTrelloCard(trelloCard)

// Extract card ID from URL
const cardId = extractTrelloCardId(url) // string | null
```

### Migration Utilities

```tsx
import {
  migrateTrelloCardUrl,
  ensureBackwardCompatibleWrite,
  isLegacyFormat,
  isNewFormat
} from '@/utils/breadcrumbsMigration'

// Convert legacy breadcrumbs to new format (in-memory)
const cards = migrateTrelloCardUrl(breadcrumbs)

// Ensure breadcrumbs maintains backward compatibility
const compatible = ensureBackwardCompatibleWrite(breadcrumbs)

// Check format
const legacy = isLegacyFormat(breadcrumbs)
const modern = isNewFormat(breadcrumbs)
```

---

## Type Definitions

### VideoLink

```typescript
interface VideoLink {
  url: string                    // HTTPS URL (max 2048 chars)
  title: string                  // Required (max 200 chars)
  sproutVideoId?: string         // Sprout Video ID
  thumbnailUrl?: string          // HTTPS thumbnail URL
  uploadDate?: string            // ISO 8601 format
  sourceRenderFile?: string      // Original file name
}
```

### TrelloCard

```typescript
interface TrelloCard {
  url: string                    // https://trello.com/c/{cardId}/...
  cardId: string                 // 8-24 alphanumeric characters
  title: string                  // Required (max 200 chars)
  boardName?: string             // Board name
  lastFetched?: string           // ISO 8601 timestamp
}
```

### BreadcrumbsFile (Extended)

```typescript
interface BreadcrumbsFile {
  // ... existing fields ...

  // DEPRECATED (kept for backward compatibility)
  trelloCardUrl?: string

  // NEW FIELDS
  videoLinks?: VideoLink[]       // Max 20 videos
  trelloCards?: TrelloCard[]     // Max 10 cards
}
```

---

## Business Rules

### Video Links
- **Maximum**: 20 videos per project
- **URL Validation**: Must be HTTPS, max 2048 characters
- **Title**: Required, 1-200 characters
- **Thumbnail URL**: Optional, must be HTTPS if provided
- **Upload Date**: Optional, must be valid ISO 8601 if provided

### Trello Cards
- **Maximum**: 10 cards per project
- **URL Format**: `https://trello.com/c/{cardId}/[slug]`
- **Card ID**: 8-24 alphanumeric characters, must match URL
- **Title**: Required, 1-200 characters
- **Duplicate Detection**: Cannot add same cardId twice
- **Stale Detection**: Cards with `lastFetched` >7 days ago show refresh button

### Backward Compatibility
- Legacy breadcrumbs with `trelloCardUrl` are automatically migrated on read
- Writes always include backward-compatible `trelloCardUrl` field
- Original files remain unchanged until explicitly updated
- Migration is non-destructive and reversible

---

## Error Handling

All mutations return descriptive error messages:

```tsx
try {
  await addVideoLinkAsync(videoLink)
} catch (error) {
  // Possible errors:
  // - "Maximum of 20 videos per project reached"
  // - "Video URL must use HTTPS"
  // - "Video title is required"
  // - "No breadcrumbs file found"
  console.error(error)
}
```

```tsx
try {
  await addTrelloCardAsync(trelloCard)
} catch (error) {
  // Possible errors:
  // - "Maximum of 10 Trello cards per project reached"
  // - "This Trello card is already associated with the project"
  // - "Invalid Trello card URL format"
  // - "Card ID does not match URL"
  console.error(error)
}
```

---

## Testing

### Unit Tests
```bash
# Run validation tests
npm test tests/contract/video_link_validation.test.ts
npm test tests/contract/trello_card_validation.test.ts

# Run backward compatibility tests
npm test tests/contract/backward_compatibility.test.ts
```

### Manual Testing Checklist

**Video Links:**
- [ ] Add video with valid URL and title
- [ ] Try to add 21st video (should show error)
- [ ] Remove video
- [ ] Reorder videos (move up/down)
- [ ] Add video with thumbnail URL
- [ ] Try to add video with HTTP URL (should show error)
- [ ] Try to add video with empty title (should show error)
- [ ] Open video in Sprout Video (external link)

**Trello Cards:**
- [ ] Add card with valid Trello URL
- [ ] Try to add 11th card (should show error)
- [ ] Try to add duplicate card (should show error)
- [ ] Remove card
- [ ] Open card in Trello (external link)
- [ ] Refresh stale card (>7 days old)
- [ ] Try to add card with non-Trello URL (should show error)

**Backward Compatibility:**
- [ ] Open project with legacy `trelloCardUrl` - should display as array
- [ ] Add second Trello card - legacy field should still point to first
- [ ] Remove all cards - legacy field should be undefined
- [ ] Verify old Baker versions can still read breadcrumbs

---

## Configuration

### Trello API Credentials

To enable automatic card detail fetching, configure Trello API credentials:

1. **Get API Key & Token**: https://trello.com/app-key
2. **Store in Settings**:
```tsx
// User settings interface
interface UserSettings {
  trello?: {
    apiKey: string
    apiToken: string
  }
}
```
3. **Pass to Component**:
```tsx
<TrelloCardsManager
  projectPath={projectPath}
  trelloApiKey={userSettings?.trello?.apiKey}
  trelloApiToken={userSettings?.trello?.apiToken}
/>
```

If credentials are not provided, users can still add cards manually by entering the URL.

---

## Performance Considerations

- **Query Caching**: TanStack Query caches video links and Trello cards separately
- **Query Keys**: `['breadcrumbs', 'videoLinks', projectPath]` and `['breadcrumbs', 'trelloCards', projectPath]`
- **Invalidation**: Mutations automatically invalidate relevant queries
- **Lazy Loading**: Components only fetch data when `projectPath` is provided
- **Migration**: Legacy migration happens in-memory on read, no disk I/O until mutation

---

## Troubleshooting

### Issue: "Cannot find module '@/components/ui/label'"
**Solution**: Label and Alert components have been created in `src/components/ui/`

### Issue: "VideoLink is not exported"
**Solution**: Types are re-exported from `src/types/baker.ts`

### Issue: "Window is not defined" in tests
**Solution**: Vitest is configured with `jsdom` environment in `vite.config.ts`

### Issue: Rust compilation fails
**Solution**: Run `cd src-tauri && cargo build` to check for errors. Ensure `regex` and `chrono` dependencies are in `Cargo.toml`

### Issue: Legacy breadcrumbs not migrating
**Solution**: Check that `baker_get_trello_cards` command calls `migrate_trello_card_url()` helper

---

## Migration from Legacy Code

If you have existing code that uses the legacy `trelloCardUrl` field:

**Before:**
```tsx
const trelloUrl = breadcrumbs.trelloCardUrl
```

**After:**
```tsx
const trelloCards = breadcrumbs.trelloCards || []
const primaryCard = trelloCards[0] // First card is "primary"
```

The legacy field is still available for backward compatibility but should not be used in new code.

---

## Support

- **Tests**: `tests/contract/video_link_validation.test.ts`, `trello_card_validation.test.ts`, `backward_compatibility.test.ts`
- **Design Docs**: `specs/004-embed-multiple-video/`
- **Task Breakdown**: `specs/004-embed-multiple-video/tasks.md`
- **Data Model**: `specs/004-embed-multiple-video/contracts/data-model.md`

---

## Changelog

### v0.9.0 (Current)
- ✅ Added support for multiple video links (max 20)
- ✅ Added support for multiple Trello cards (max 10)
- ✅ Implemented backward-compatible migration
- ✅ Created VideoLinksManager and TrelloCardsManager components
- ✅ Added validation utilities
- ✅ Implemented 9 Tauri backend commands
- ✅ Added comprehensive test coverage (25/25 passing)

---

**Ready for Production** ✅