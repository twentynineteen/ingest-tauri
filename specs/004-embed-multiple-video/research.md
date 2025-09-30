# Phase 0: Research & Technical Findings

**Feature**: Multiple Video Links and Trello Cards in Breadcrumbs
**Branch**: `004-embed-multiple-video`
**Date**: 2025-09-30

## Research Summary

This document captures technical research findings to resolve all NEEDS CLARIFICATION items from the planning phase and establish implementation patterns for the multiple video/Trello card feature.

---

## 1. Sprout Video Integration Patterns

### Current Implementation Analysis

**File**: `src/pages/UploadSprout.tsx` (lines 1-141)

**Key Findings**:
- Uses `useFileUpload` hook that invokes Tauri command `upload_video`
- Receives `SproutUploadResponse` containing:
  - `id`: Sprout Video ID
  - `title`: Video title
  - `created_at`: Upload timestamp
  - `assets.poster_frames[0]`: Thumbnail URL (ready immediately)
  - `embed_code`: Embed code string
  - `embedded_url`: Direct URL
  - `duration`: Video duration

**URL Structure**:
```typescript
// View URL format
https://sproutvideo.com/videos/${response.id}

// Thumbnail URL format
${response.assets.poster_frames[0]}
// Example: "https://cdn.sproutvideo.com/[hash]/[id]/frame_0000.jpg"
```

**Thumbnail Availability**:
- Thumbnails are returned immediately in upload response
- Available at `response.assets.poster_frames[0]`
- No polling required - cache URL directly in breadcrumbs

**Decision**: Store thumbnail URL in breadcrumbs at time of video association
- **Rationale**: Thumbnails available immediately after upload, no API calls needed for preview
- **Alternatives considered**:
  - Polling Sprout API → Unnecessary, thumbnails available immediately
  - Generating thumbnails locally → Complex, Sprout already provides them

---

## 2. Trello API Integration Patterns

### Current Implementation Analysis

**File**: `src/hooks/useTrelloCardDetails.ts` (lines 1-49)

**Key Findings**:
- Uses TanStack React Query for API calls
- Endpoint: `GET https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${token}`
- Returns: Full card object with `name`, `desc`, `url`, `idBoard`, etc.
- Board info available via nested query to `/cards/${cardId}/board`
- Already has existing auth credential management

**URL Parsing Pattern**:
```typescript
// Trello card URL format
https://trello.com/c/[CARD_ID]/[optional-slug]

// Extract card ID from URL
const extractCardId = (url: string): string | null => {
  const match = url.match(/trello\.com\/c\/([^/]+)/)
  return match ? match[1] : null
}
```

**API Response Structure** (based on existing code):
```typescript
interface TrelloCard {
  id: string
  name: string  // Card title
  desc: string
  url: string
  idBoard: string
  // ... other fields
}
```

**Decision**: Fetch card title via existing pattern, cache in breadcrumbs
- **Rationale**: API credentials already managed, query pattern established
- **Alternatives considered**:
  - Storing only URL → Poor UX, requires API call every time
  - Webhook updates → Over-engineered for this use case

---

## 3. Serde JSON Schema Evolution

### Current Implementation Analysis

**File**: `src-tauri/src/baker.rs` (lines 41-62)

**Key Findings**:
- Uses `serde` with `#[serde(rename = "...")]` for camelCase/snake_case conversion
- Optional fields use `Option<T>` type
- Existing pattern for optional `trello_card_url: Option<String>`
- Baker already handles missing fields gracefully during updates (lines 893-925)

**Backward Compatibility Pattern**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreadcrumbsFile {
    // ... existing fields ...

    // Old field - keep for backward compatibility
    #[serde(rename = "trelloCardUrl")]
    trello_card_url: Option<String>,

    // New array fields
    #[serde(rename = "videoLinks", skip_serializing_if = "Option::is_none")]
    video_links: Option<Vec<VideoLink>>,

    #[serde(rename = "trelloCards", skip_serializing_if = "Option::is_none")]
    trello_cards: Option<Vec<TrelloCard>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoLink {
    url: String,
    #[serde(rename = "sproutVideoId", skip_serializing_if = "Option::is_none")]
    sprout_video_id: Option<String>,
    title: String,
    #[serde(rename = "thumbnailUrl", skip_serializing_if = "Option::is_none")]
    thumbnail_url: Option<String>,
    #[serde(rename = "uploadDate", skip_serializing_if = "Option::is_none")]
    upload_date: Option<String>,
    #[serde(rename = "sourceRenderFile", skip_serializing_if = "Option::is_none")]
    source_render_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrelloCard {
    url: String,
    #[serde(rename = "cardId")]
    card_id: String,
    title: String,
    #[serde(rename = "boardName", skip_serializing_if = "Option::is_none")]
    board_name: Option<String>,
    #[serde(rename = "lastFetched", skip_serializing_if = "Option::is_none")]
    last_fetched: Option<String>,
}
```

**Migration Strategy**:
```rust
// On read: Check if old format, auto-migrate to new
if breadcrumbs.video_links.is_none() && breadcrumbs.trello_card_url.is_some() {
    // Convert single URL to array format
    breadcrumbs.trello_cards = Some(vec![TrelloCard {
        url: breadcrumbs.trello_card_url.clone().unwrap(),
        card_id: extract_card_id(&url),
        title: "".to_string(), // Will be fetched by frontend
        board_name: None,
        last_fetched: None,
    }]);
}
```

**Decision**: Use `Option<Vec<T>>` with `skip_serializing_if` for new fields
- **Rationale**: Allows graceful degradation, old files remain readable
- **Alternatives considered**:
  - Versioned schema with migration script → Too complex for JSON files
  - Required arrays (empty by default) → Breaks old file readers

---

## 4. React Array Management UI Patterns

### Current Dependencies Analysis

**File**: `package.json` (lines 1-50)

**Key Findings**:
- NO drag-and-drop libraries currently installed
- Uses Radix UI primitives (via shadcn/ui)
- TanStack React Query for state management
- Zustand for global state
- No @dnd-kit or react-beautiful-dnd dependencies

**UI Component Options**:

**Option A: Manual Array Management (Recommended)**
- Use Radix UI Button + Lucide icons for Add/Remove/Reorder
- Simple up/down arrow buttons for reordering
- Pros: No new dependencies, lightweight, sufficient for small lists
- Cons: Less polished than drag-and-drop

**Option B: Add @dnd-kit/core**
- Modern, actively maintained (last update 2024)
- Smaller bundle size than react-beautiful-dnd
- Works well with Radix UI
- Pros: Professional drag-and-drop UX
- Cons: New dependency (50kb gzipped)

**Implementation Pattern (Manual Approach)**:
```typescript
interface VideoLinkManagerProps {
  videoLinks: VideoLink[]
  onChange: (links: VideoLink[]) => void
}

function VideoLinkManager({ videoLinks, onChange }: VideoLinkManagerProps) {
  const addLink = () => {
    onChange([...videoLinks, { url: '', title: '' }])
  }

  const removeLink = (index: number) => {
    onChange(videoLinks.filter((_, i) => i !== index))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newLinks = [...videoLinks]
    ;[newLinks[index - 1], newLinks[index]] = [newLinks[index], newLinks[index - 1]]
    onChange(newLinks)
  }

  const moveDown = (index: number) => {
    if (index === videoLinks.length - 1) return
    const newLinks = [...videoLinks]
    ;[newLinks[index], newLinks[index + 1]] = [newLinks[index + 1], newLinks[index]]
    onChange(newLinks)
  }

  return (
    <div className="space-y-2">
      {videoLinks.map((link, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input value={link.url} onChange={e => updateLink(index, e.target.value)} />
          <Button size="icon" onClick={() => moveUp(index)} disabled={index === 0}>
            <ArrowUp />
          </Button>
          <Button size="icon" onClick={() => moveDown(index)} disabled={index === videoLinks.length - 1}>
            <ArrowDown />
          </Button>
          <Button size="icon" variant="destructive" onClick={() => removeLink(index)}>
            <Trash />
          </Button>
        </div>
      ))}
      <Button onClick={addLink}>Add Video Link</Button>
    </div>
  )
}
```

**Decision**: Start with manual array management (Option A)
- **Rationale**: Sufficient for expected use case (2-5 videos per project), avoids new dependencies
- **Alternatives considered**:
  - @dnd-kit → Overkill for small lists, can add later if needed
  - react-beautiful-dnd → Deprecated, not recommended for new projects

---

## 5. Renders Folder Structure

### Current Project Structure

Based on spec requirements (FR-015, FR-016):
- Videos uploaded to Sprout come from `[PROJECT]/Renders/` folder
- Renders contain final edited videos (not raw footage)
- Not tied to camera numbers (multiple cameras edited into single video)
- Manual association required between render files and Trello cards

**Implementation Pattern**:
```typescript
// When selecting video to upload from BuildProject
const selectRenderFile = async () => {
  const file = await open({
    defaultPath: `${projectPath}/Renders`,
    filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'avi'] }]
  })
  // ... upload to Sprout, then associate with breadcrumbs
}
```

**Decision**: Provide file picker defaulting to Renders folder
- **Rationale**: Renders are final output, clearest user intent
- **Alternatives considered**:
  - Auto-detect renders → No reliable naming convention
  - Link to camera footage → Wrong use case per user clarification

---

## Research Conclusions

All NEEDS CLARIFICATION items resolved:

1. ✅ **Sprout Video**: Thumbnails available immediately in upload response
2. ✅ **Trello API**: Use existing pattern with GET /1/cards/{id}, cache title
3. ✅ **Serde Migration**: Use `Option<Vec<T>>` with `skip_serializing_if`
4. ✅ **UI Components**: Manual array management with Radix UI primitives
5. ✅ **Renders Folder**: Default file picker to `[PROJECT]/Renders/`

**Next Phase**: Proceed to Phase 1 (data-model.md, contracts, quickstart.md)