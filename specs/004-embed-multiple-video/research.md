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

## 6. Sprout Video URL Parsing and API Fetching (NEW)

### User Requirement

In the Baker video links section, users should be able to enter only the Sprout Video URL. The system should:
1. Parse the URL to extract the video ID
2. Fetch video metadata from Sprout Video API
3. Auto-populate title, thumbnail, and other fields

### API Research

**Sprout Video API Documentation**: https://sproutvideo.com/docs/api.html

**Get Video Details Endpoint**:
```
GET https://api.sproutvideo.com/v1/videos/:id
Headers: SproutVideo-Api-Key: {api_key}
```

**Response Structure**:
```json
{
  "id": "a098d2bcd33e1c328",
  "title": "Video Title",
  "description": "Video description",
  "duration": 120,
  "assets": {
    "poster_frames": ["https://cdn.sproutvideo.com/.../frame_0000.jpg"]
  },
  "created_at": "2025-01-20T14:22:00.000Z",
  "embed_code": "<iframe src='...'></iframe>",
  // ... other fields
}
```

**URL Patterns**:
```typescript
// Public video page URL
https://sproutvideo.com/videos/{VIDEO_ID}

// Embed URL
https://videos.sproutvideo.com/embed/{VIDEO_ID}/{SECURITY_TOKEN}

// Example video IDs
"a098d2bcd33e1c328"
"xyz789abc123def"
```

### Implementation Strategy

**URL Parsing Function** (TypeScript):
```typescript
export function parseSproutVideoUrl(url: string): string | null {
  // Pattern 1: https://sproutvideo.com/videos/{id}
  const publicMatch = url.match(/sproutvideo\.com\/videos\/([a-zA-Z0-9]+)/)
  if (publicMatch) return publicMatch[1]

  // Pattern 2: https://videos.sproutvideo.com/embed/{id}/...
  const embedMatch = url.match(/videos\.sproutvideo\.com\/embed\/([a-zA-Z0-9]+)/)
  if (embedMatch) return embedMatch[1]

  return null // Invalid URL
}
```

**Tauri Command** (Rust):
```rust
#[tauri::command]
pub async fn fetch_sprout_video_details(
    video_id: String,
    api_key: String,
) -> Result<SproutVideoDetails, String> {
    let client = reqwest::Client::new();
    let url = format!("https://api.sproutvideo.com/v1/videos/{}", video_id);

    let response = client
        .get(&url)
        .header("SproutVideo-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API returned error: {}", response.status()));
    }

    let video_data: SproutVideoDetails = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(video_data)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SproutVideoDetails {
    id: String,
    title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    duration: u32,
    assets: SproutAssets,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SproutAssets {
    poster_frames: Vec<String>,
}
```

**React Hook** (TypeScript):
```typescript
import { useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

export function useSproutVideoApi() {
  const fetchVideoDetails = useMutation({
    mutationFn: async ({ videoUrl, apiKey }: { videoUrl: string; apiKey: string }) => {
      // Parse URL to get video ID
      const videoId = parseSproutVideoUrl(videoUrl)
      if (!videoId) {
        throw new Error('Invalid Sprout Video URL')
      }

      // Fetch details from API
      const details = await invoke<SproutVideoDetails>('fetch_sprout_video_details', {
        videoId,
        apiKey
      })

      return details
    }
  })

  return {
    fetchVideoDetails: fetchVideoDetails.mutate,
    isFetching: fetchVideoDetails.isPending,
    error: fetchVideoDetails.error
  }
}
```

**UI Flow**:
1. User enters Sprout Video URL in dialog
2. On input blur or button click, parse URL
3. If valid, show loading state and fetch metadata
4. Auto-populate title, thumbnail fields
5. User can edit if needed, then save

**Error Handling**:
- Invalid URL format → Show validation error
- API key missing → Prompt user to add in Settings
- API request fails → Show error message with retry option
- Video not found (404) → "Video not found or access denied"

**Decision**: Create `useSproutVideoApi` hook and `fetch_sprout_video_details` Tauri command
- **Rationale**: Separates URL parsing (frontend) from API fetching (backend), reuses existing API key management
- **Alternatives considered**:
  - Manual entry of all fields → Poor UX, error-prone
  - Fetch on paste event → Too aggressive, may trigger before user finishes
  - Backend URL parsing → Unnecessary Rust code, TS regex is sufficient

---

## Research Conclusions

All NEEDS CLARIFICATION items resolved:

1. ✅ **Sprout Video**: Thumbnails available immediately in upload response
2. ✅ **Trello API**: Use existing pattern with GET /1/cards/{id}, cache title
3. ✅ **Serde Migration**: Use `Option<Vec<T>>` with `skip_serializing_if`
4. ✅ **UI Components**: Manual array management with Radix UI primitives
5. ✅ **Renders Folder**: Default file picker to `[PROJECT]/Renders/`
6. ✅ **URL Parsing & API Fetch**: Parse Sprout Video URLs (frontend), fetch metadata via new Tauri command

**Next Phase**: Proceed to Phase 1 (data-model.md, contracts, quickstart.md) - Update contracts with new `fetch_sprout_video_details` command

---

## 7. Video Upload Toggle Enhancement (NEW - 2025-09-30)

### User Requirement

Extend VideoLinksManager to support direct video upload (similar to TrelloCardsManager's URL/Select toggle). Users should be able to either:
- **Option A**: Enter an existing Sprout Video URL (current functionality)
- **Option B**: Upload a video file directly from their filesystem (NEW)

### Implementation Analysis

**Reference Pattern**: TrelloCardsManager (lines 59-303)
- Uses ShadCN `Tabs` component with `TabsList` and `TabsContent`
- State: `const [addMode, setAddMode] = useState<'url' | 'select'>('url')`
- Tab 1: URL entry with manual input
- Tab 2: Selection from Trello board with search/filter

**Proposed Pattern for VideoLinksManager**:
- Tab 1: "Enter URL" (existing functionality, keep as-is)
- Tab 2: "Upload File" (NEW - integrate upload logic)
- State: `const [addMode, setAddMode] = useState<'url' | 'upload'>('url')`

### Reusable Hooks from UploadSprout.tsx

**useFileUpload Hook** ([src/hooks/useFileUpload.ts](../../src/hooks/useFileUpload.ts)):
```typescript
const {
  selectedFile,      // File path string
  uploading,         // Boolean upload state
  response,          // SproutUploadResponse | null
  selectFile,        // () => Promise<void> - Opens file picker
  uploadFile,        // (apiKey: string) => Promise<void>
  resetUploadState   // () => void
} = useFileUpload()
```

**Key Features**:
- File picker with video filters (mp4, mov, avi)
- Tauri command invocation: `upload_video(filePath, apiKey, folderId)`
- Event listeners for `upload_complete` and `upload_error`
- 45-minute timeout for large files
- Proper cleanup and error handling

**useUploadEvents Hook** ([src/hooks/useUploadEvents.ts](../../src/hooks/useUploadEvents.ts)):
```typescript
const {
  progress,    // number (0-100)
  uploading,   // boolean
  message,     // string | null
  setProgress, // (progress: number) => void
  setMessage   // (message: string | null) => void
} = useUploadEvents()
```

**Key Features**:
- React Query integration for state management
- Real-time progress updates via Tauri events (`upload_progress`)
- Completion/error handling via Tauri events

### File Selection Default Path

**Requirement**: Default to project's Renders/ folder when available

**Implementation**:
```typescript
// Check if Renders folder exists
const rendersPath = `${projectPath}/Renders`
const rendersExists = await invoke<boolean>('path_exists', { path: rendersPath })

const file = await open({
  multiple: false,
  defaultPath: rendersExists ? rendersPath : undefined,
  filters: [
    { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }
  ]
})
```

**Note**: Requires `path_exists` Tauri command (likely already exists, verify in Phase 1)

### Auto-Population from Upload Response

**SproutUploadResponse Structure** (from existing code):
```typescript
interface SproutUploadResponse {
  id: string                     // Sprout Video ID
  title: string                  // Video title (may be empty)
  created_at: string             // ISO 8601 timestamp
  assets: {
    poster_frames: string[]      // Thumbnail URLs
  }
  embed_code: string
  embedded_url: string           // Direct video URL
  duration: number
}
```

**VideoLink Mapping**:
```typescript
const createVideoLinkFromUpload = (
  response: SproutUploadResponse,
  filePath: string
): VideoLink => {
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

### UI Workflow

**Upload Tab Content**:
1. "Select Video File" button → opens file picker
2. Display selected filename below button
3. "Upload and Add" button (disabled until file selected)
4. Progress bar during upload (with percentage)
5. Success: Auto-add to videoLinks, close dialog, reset state
6. Error: Display error message, enable retry

**State Management**:
- Dialog open/close: Reset all upload state
- Tab switch: Clear errors, reset upload progress
- Successful upload: Reset form, close dialog
- Upload error: Keep file selected, show retry button

### Error Handling

**Error Categories**:
1. **No API Key**: "Sprout Video API key not configured. Go to Settings."
2. **No File Selected**: Button disabled, no error message
3. **Upload Timeout**: "Upload timed out after 45 minutes. Please try again."
4. **Network Error**: "Network connection error. Check your internet connection."
5. **API Error**: "Upload failed: HTTP {status} - {message}"
6. **Validation Error**: (Should not occur, Sprout returns valid data)

**UI States**:
- Idle: "Upload File" tab, select button enabled
- File selected: Filename shown, upload button enabled
- Uploading: Progress bar visible, buttons disabled
- Success: Auto-close dialog, show success toast
- Error: Error alert shown, retry button enabled

### Integration Points

**With VideoLinksManager**:
- Add `Tabs` component to existing dialog
- Wrap existing URL form in `TabsContent value="url"`
- Add new upload form in `TabsContent value="upload"`
- Use existing `addVideoLink` mutation
- Use existing `validateVideoLink` function

**With useBreadcrumbsVideoLinks Hook**:
- No changes needed
- Upload path uses same `addVideoLink` mutation as URL path

**With Baker**:
- No changes needed
- Videos added via upload appear same as URL-added videos

### Performance Considerations

1. **Large File Uploads**:
   - Backend streams in 65KB chunks
   - Progress events every ~100ms
   - Supports up to 5GB files
   - 45-minute timeout

2. **UI Responsiveness**:
   - Progress updates via events (no polling)
   - Dialog remains responsive during upload
   - User can't cancel (no abort mechanism) - future enhancement

3. **Memory Usage**:
   - File streaming prevents full-file-in-memory
   - React Query caches upload state efficiently

### Testing Strategy

**Component Tests** (NEW):
1. Tab switching between URL and Upload modes
2. File selection opens with correct filters and default path
3. Upload button disabled states (no file, no API key, uploading)
4. Progress bar updates during mock upload
5. Successful upload auto-adds VideoLink with correct fields
6. Error states display correctly
7. Dialog cleanup resets upload state

**Integration Tests** (NEW):
1. End-to-end: Select file → Upload → Add to breadcrumbs
2. Verify breadcrumbs.json updated with correct VideoLink
3. Verify Baker preview shows uploaded video

**Contract Tests** (Already Exist):
- `upload_video` Tauri command contract test
- `fetch_sprout_video_details` contract test

### Decision Summary

**Decision**: Add Upload tab to VideoLinksManager using Tabs component, reusing useFileUpload and useUploadEvents hooks

**Rationale**:
1. **Consistency**: Mirrors TrelloCardsManager's toggle pattern (familiar UX)
2. **Code Reuse**: Leverages existing upload logic from UploadSprout.tsx
3. **No New Dependencies**: Uses existing ShadCN Tabs component
4. **Backward Compatible**: Additive feature, doesn't change URL entry flow
5. **Performance**: Streaming upload with real-time progress tracking

**Alternatives Considered**:
- Separate upload dialog: Inconsistent with Trello pattern
- Replace URL entry with upload-only: Removes flexibility
- Dropdown menu instead of tabs: Less discoverable, requires extra clicks
- New upload hook: Duplicates logic, adds maintenance burden

**Open Questions for Phase 1**:
1. ✅ Does `path_exists` Tauri command exist? (Check contracts)
2. ✅ Should cancel button abort upload? (Not in MVP, future enhancement)
3. ✅ Default to URL or Upload tab? (URL - less disruptive)
4. ✅ Show upload history? (No - out of scope for single-upload workflow)

---

**Research Phase Complete**: All unknowns resolved, ready for Phase 1 design