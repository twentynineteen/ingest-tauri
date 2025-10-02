# API Contracts: Tauri Commands

**Feature**: 004-embed-multiple-video
**Date**: 2025-09-30
**Status**: Phase 1 Design

## Overview

This document defines the Rust Tauri commands and TypeScript invoke signatures for managing multiple video links and Trello cards in breadcrumbs files.

---

## Tauri Command Contracts

### 1. `baker_associate_video_link`

Associates a video link with a project's breadcrumbs file.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn baker_associate_video_link(
    project_path: String,
    video_link: VideoLink,
) -> Result<BreadcrumbsFile, String>
```

**Request Parameters**:
```typescript
{
  project_path: string  // Absolute path to project folder
  video_link: VideoLink // Video link to add
}
```

**Response**:
```typescript
// Success: Updated BreadcrumbsFile
{
  projectTitle: string
  // ... all breadcrumbs fields including updated videoLinks array
}

// Error: String
"Failed to update breadcrumbs: [reason]"
```

**Validation Rules**:
- `project_path` must exist and be a directory
- `project_path` must have a valid breadcrumbs.json file
- `video_link.url` must be valid HTTPS URL
- `video_link.title` must be non-empty
- Total video links must not exceed 20

**Side Effects**:
- Updates breadcrumbs.json file on disk
- Appends video link to existing `videoLinks` array (or creates array if first)
- Sets `lastModified` timestamp
- Creates backup if configured

---

### 2. `baker_remove_video_link`

Removes a video link from a project's breadcrumbs file by index.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn baker_remove_video_link(
    project_path: String,
    video_index: usize,
) -> Result<BreadcrumbsFile, String>
```

**Request Parameters**:
```typescript
{
  project_path: string  // Absolute path to project folder
  video_index: number   // Zero-based index of video link to remove
}
```

**Response**:
```typescript
// Success: Updated BreadcrumbsFile
{ /* ... */ }

// Error: String
"Video index out of bounds"
```

**Validation Rules**:
- `video_index` must be within array bounds
- `project_path` must have valid breadcrumbs.json

**Side Effects**:
- Updates breadcrumbs.json file on disk
- Removes item from `videoLinks` array
- Sets `lastModified` timestamp

---

### 3. `baker_update_video_link`

Updates an existing video link's properties.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn baker_update_video_link(
    project_path: String,
    video_index: usize,
    updated_link: VideoLink,
) -> Result<BreadcrumbsFile, String>
```

**Request Parameters**:
```typescript
{
  project_path: string
  video_index: number
  updated_link: VideoLink  // Complete VideoLink object with updated fields
}
```

**Response**:
```typescript
// Success: Updated BreadcrumbsFile
{ /* ... */ }

// Error: String
"Failed to update video link: [reason]"
```

**Validation Rules**:
- Same validation as `baker_associate_video_link`
- `video_index` must exist

**Side Effects**:
- Replaces item at `video_index` in `videoLinks` array
- Sets `lastModified` timestamp

---

### 4. `baker_reorder_video_links`

Reorders video links within a project's breadcrumbs file.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn baker_reorder_video_links(
    project_path: String,
    from_index: usize,
    to_index: usize,
) -> Result<BreadcrumbsFile, String>
```

**Request Parameters**:
```typescript
{
  project_path: string
  from_index: number  // Current position
  to_index: number    // Desired position
}
```

**Response**:
```typescript
// Success: Updated BreadcrumbsFile
{ /* ... */ }

// Error: String
"Index out of bounds"
```

**Validation Rules**:
- Both indices must be within array bounds
- Indices can be equal (no-op)

**Side Effects**:
- Reorders `videoLinks` array in-place
- Sets `lastModified` timestamp

---

### 5. `baker_associate_trello_card`

Associates a Trello card with a project's breadcrumbs file.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn baker_associate_trello_card(
    project_path: String,
    trello_card: TrelloCard,
) -> Result<BreadcrumbsFile, String>
```

**Request Parameters**:
```typescript
{
  project_path: string
  trello_card: TrelloCard  // Card to add
}
```

**Response**:
```typescript
// Success: Updated BreadcrumbsFile
{ /* ... */ }

// Error: String
"Failed to associate Trello card: [reason]"
```

**Validation Rules**:
- `trello_card.url` must match Trello URL pattern
- `trello_card.cardId` must be extracted from URL
- `trello_card.title` must be non-empty
- Total Trello cards must not exceed 10
- No duplicate `cardId` within same breadcrumbs

**Side Effects**:
- Appends to `trelloCards` array (or creates if first)
- Updates `trelloCardUrl` for backward compatibility (first card in array)
- Sets `lastModified` timestamp

---

### 6. `baker_remove_trello_card`

Removes a Trello card from a project's breadcrumbs file by index.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn baker_remove_trello_card(
    project_path: String,
    card_index: usize,
) -> Result<BreadcrumbsFile, String>
```

**Request Parameters**:
```typescript
{
  project_path: string
  card_index: number  // Zero-based index
}
```

**Response**:
```typescript
// Success: Updated BreadcrumbsFile
{ /* ... */ }

// Error: String
"Card index out of bounds"
```

**Validation Rules**:
- `card_index` must be within array bounds

**Side Effects**:
- Removes from `trelloCards` array
- Updates `trelloCardUrl` (sets to new first card or null)
- Sets `lastModified` timestamp

---

### 7. `baker_fetch_trello_card_details`

Fetches card details from Trello API (title, board name) given a card URL.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn baker_fetch_trello_card_details(
    card_url: String,
    api_key: String,
    api_token: String,
) -> Result<TrelloCard, String>
```

**Request Parameters**:
```typescript
{
  card_url: string   // Full Trello card URL
  api_key: string    // Trello API key from settings
  api_token: string  // Trello API token from settings
}
```

**Response**:
```typescript
// Success: TrelloCard with populated fields
{
  url: "https://trello.com/c/abc123/card-name",
  cardId: "abc123",
  title: "Client Project A - Pre-Production",
  boardName: "Video Projects 2025",
  lastFetched: "2025-01-20T10:00:00.000Z"
}

// Error: String
"Failed to fetch Trello card: API returned 404"
```

**Validation Rules**:
- `card_url` must match Trello URL pattern
- `api_key` and `api_token` must be non-empty

**Side Effects**:
- Makes HTTP GET request to `https://api.trello.com/1/cards/{cardId}?key={key}&token={token}`
- Sets `lastFetched` to current timestamp
- Does NOT modify breadcrumbs file (frontend handles association)

---

### 8. `upload_video_and_associate`

Uploads a video to Sprout Video and associates it with a project's breadcrumbs file in one operation.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn upload_video_and_associate(
    file_path: String,
    api_key: String,
    folder_id: Option<String>,
    project_path: String,
    video_title: String,
) -> Result<(SproutUploadResponse, BreadcrumbsFile), String>
```

**Request Parameters**:
```typescript
{
  file_path: string         // Absolute path to video file (from Renders/ folder)
  api_key: string           // Sprout Video API key
  folder_id?: string        // Optional Sprout folder ID
  project_path: string      // Project to associate video with
  video_title: string       // User-provided title for video
}
```

**Response**:
```typescript
// Success: Tuple of (SproutUploadResponse, BreadcrumbsFile)
[
  {
    id: "xyz789",
    title: "Final Edit - Camera Angle 1",
    assets: {
      poster_frames: ["https://cdn.sproutvideo.com/.../frame_0000.jpg"]
    },
    created_at: "2025-01-20T14:22:00.000Z",
    // ... other Sprout fields
  },
  {
    projectTitle: "Client Project A",
    videoLinks: [ /* ... including newly added video */ ],
    // ... other breadcrumbs fields
  }
]

// Error: String
"Upload failed: [reason]"
```

**Validation Rules**:
- `file_path` must exist and be a video file
- `file_path` should be within project's Renders/ folder (warning if not)
- `api_key` must be valid
- `project_path` must have valid breadcrumbs.json

**Side Effects**:
- Uploads video to Sprout Video API
- Creates VideoLink from response
- Associates VideoLink with breadcrumbs (calls `baker_associate_video_link` internally)
- Emits progress events during upload

---

### 9. `baker_get_video_links`

Retrieves all video links for a project, handling legacy migration.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn baker_get_video_links(
    project_path: String,
) -> Result<Vec<VideoLink>, String>
```

**Request Parameters**:
```typescript
{
  project_path: string
}
```

**Response**:
```typescript
// Success: Array of VideoLink
[
  {
    url: "https://sproutvideo.com/videos/xyz789",
    sproutVideoId: "xyz789",
    title: "Final Edit",
    thumbnailUrl: "https://cdn.sproutvideo.com/.../frame_0000.jpg",
    uploadDate: "2025-01-20T14:22:00.000Z",
    sourceRenderFile: "final-edit.mp4"
  }
]

// Error: String
"Failed to read breadcrumbs: [reason]"
```

**Validation Rules**:
- `project_path` must exist

**Side Effects**:
- None (read-only operation)
- Migrates from legacy format if needed (in-memory only, does not write)

---

### 10. `baker_get_trello_cards`

Retrieves all Trello cards for a project, handling legacy migration.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn baker_get_trello_cards(
    project_path: String,
) -> Result<Vec<TrelloCard>, String>
```

**Request Parameters**:
```typescript
{
  project_path: string
}
```

**Response**:
```typescript
// Success: Array of TrelloCard
[
  {
    url: "https://trello.com/c/abc123/project",
    cardId: "abc123",
    title: "Client Project A",
    boardName: "Video Projects 2025",
    lastFetched: "2025-01-20T10:00:00.000Z"
  }
]

// Error: String
"Failed to read breadcrumbs: [reason]"
```

**Validation Rules**:
- `project_path` must exist

**Side Effects**:
- None (read-only operation)
- Migrates from `trelloCardUrl` if `trelloCards` array is empty

---

## TypeScript Invoke Wrappers

### Custom Hook: `useBreadcrumbsVideoLinks`

```typescript
import { invoke } from '@tauri-apps/api/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface UseBreadcrumbsVideoLinksOptions {
  projectPath: string
}

export function useBreadcrumbsVideoLinks({ projectPath }: UseBreadcrumbsVideoLinksOptions) {
  const queryClient = useQueryClient()

  // Fetch video links
  const { data: videoLinks, isLoading } = useQuery({
    queryKey: ['baker-video-links', projectPath],
    queryFn: () => invoke<VideoLink[]>('baker_get_video_links', { projectPath }),
    enabled: !!projectPath
  })

  // Add video link
  const addVideoLink = useMutation({
    mutationFn: (videoLink: VideoLink) =>
      invoke<BreadcrumbsFile>('baker_associate_video_link', { projectPath, videoLink }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baker-video-links', projectPath] })
      queryClient.invalidateQueries({ queryKey: ['baker-breadcrumbs', projectPath] })
    }
  })

  // Remove video link
  const removeVideoLink = useMutation({
    mutationFn: (videoIndex: number) =>
      invoke<BreadcrumbsFile>('baker_remove_video_link', { projectPath, videoIndex }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baker-video-links', projectPath] })
      queryClient.invalidateQueries({ queryKey: ['baker-breadcrumbs', projectPath] })
    }
  })

  // Update video link
  const updateVideoLink = useMutation({
    mutationFn: ({ videoIndex, updatedLink }: { videoIndex: number; updatedLink: VideoLink }) =>
      invoke<BreadcrumbsFile>('baker_update_video_link', { projectPath, videoIndex, updatedLink }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baker-video-links', projectPath] })
      queryClient.invalidateQueries({ queryKey: ['baker-breadcrumbs', projectPath] })
    }
  })

  // Reorder video links
  const reorderVideoLinks = useMutation({
    mutationFn: ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number }) =>
      invoke<BreadcrumbsFile>('baker_reorder_video_links', { projectPath, fromIndex, toIndex }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baker-video-links', projectPath] })
      queryClient.invalidateQueries({ queryKey: ['baker-breadcrumbs', projectPath] })
    }
  })

  return {
    videoLinks: videoLinks ?? [],
    isLoading,
    addVideoLink: addVideoLink.mutate,
    removeVideoLink: removeVideoLink.mutate,
    updateVideoLink: updateVideoLink.mutate,
    reorderVideoLinks: reorderVideoLinks.mutate,
    isUpdating:
      addVideoLink.isPending || removeVideoLink.isPending || updateVideoLink.isPending || reorderVideoLinks.isPending
  }
}
```

### Custom Hook: `useBreadcrumbsTrelloCards`

```typescript
export function useBreadcrumbsTrelloCards({ projectPath }: { projectPath: string }) {
  const queryClient = useQueryClient()

  // Fetch Trello cards
  const { data: trelloCards, isLoading } = useQuery({
    queryKey: ['baker-trello-cards', projectPath],
    queryFn: () => invoke<TrelloCard[]>('baker_get_trello_cards', { projectPath }),
    enabled: !!projectPath
  })

  // Add Trello card
  const addTrelloCard = useMutation({
    mutationFn: (trelloCard: TrelloCard) =>
      invoke<BreadcrumbsFile>('baker_associate_trello_card', { projectPath, trelloCard }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baker-trello-cards', projectPath] })
      queryClient.invalidateQueries({ queryKey: ['baker-breadcrumbs', projectPath] })
    }
  })

  // Remove Trello card
  const removeTrelloCard = useMutation({
    mutationFn: (cardIndex: number) =>
      invoke<BreadcrumbsFile>('baker_remove_trello_card', { projectPath, cardIndex }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baker-trello-cards', projectPath] })
      queryClient.invalidateQueries({ queryKey: ['baker-breadcrumbs', projectPath] })
    }
  })

  // Fetch card details from Trello API
  const fetchCardDetails = useMutation({
    mutationFn: ({ cardUrl, apiKey, apiToken }: { cardUrl: string; apiKey: string; apiToken: string }) =>
      invoke<TrelloCard>('baker_fetch_trello_card_details', { cardUrl, apiKey, apiToken })
  })

  return {
    trelloCards: trelloCards ?? [],
    isLoading,
    addTrelloCard: addTrelloCard.mutate,
    removeTrelloCard: removeTrelloCard.mutate,
    fetchCardDetails: fetchCardDetails.mutate,
    isUpdating: addTrelloCard.isPending || removeTrelloCard.isPending,
    isFetchingDetails: fetchCardDetails.isPending
  }
}
```

---

### 11. `fetch_sprout_video_details`

Fetches video metadata from Sprout Video API given a video ID.

**Rust Signature**:
```rust
#[tauri::command]
pub async fn fetch_sprout_video_details(
    video_id: String,
    api_key: String,
) -> Result<SproutVideoDetails, String>
```

**Request Parameters**:
```typescript
{
  video_id: string   // Sprout Video ID (extracted from URL)
  api_key: string    // Sprout Video API key from settings
}
```

**Response**:
```typescript
// Success: SproutVideoDetails
{
  id: "a098d2bcd33e1c328",
  title: "Video Title",
  description?: "Video description",
  duration: 120,
  assets: {
    poster_frames: ["https://cdn.sproutvideo.com/.../frame_0000.jpg"]
  },
  created_at: "2025-01-20T14:22:00.000Z"
}

// Error: String
"API request failed: Connection refused"
"API returned error: 404"
"Failed to parse response: Invalid JSON"
```

**Validation Rules**:
- `video_id` must be non-empty alphanumeric string
- `api_key` must be non-empty

**Side Effects**:
- Makes HTTP GET request to `https://api.sproutvideo.com/v1/videos/{video_id}`
- Does NOT modify breadcrumbs file (frontend handles association)

---

## Error Handling

All commands return `Result<T, String>` where the error string contains a human-readable message.

**Common Error Patterns**:
```rust
// Path validation errors
Err(format!("Project path does not exist: {}", project_path))
Err(format!("Invalid breadcrumbs file at {}: {}", project_path, parse_error))

// Index out of bounds
Err(format!("Video index {} out of bounds (max {})", video_index, max_index))

// Validation errors
Err(format!("Video URL validation failed: {}", error_message))

// File system errors
Err(format!("Failed to write breadcrumbs file: {}", io_error))

// API errors (Trello, Sprout)
Err(format!("Trello API returned error {}: {}", status_code, error_body))
```

**Frontend Error Handling**:
```typescript
addVideoLink.mutate(newLink, {
  onError: (error) => {
    console.error('Failed to add video link:', error)
    toast.error(`Failed to add video: ${error}`)
  }
})
```

### Custom Hook: `useSproutVideoApi`

```typescript
import { useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

export function parseSproutVideoUrl(url: string): string | null {
  // Pattern 1: https://sproutvideo.com/videos/{id}
  const publicMatch = url.match(/sproutvideo\.com\/videos\/([a-zA-Z0-9]+)/)
  if (publicMatch) return publicMatch[1]

  // Pattern 2: https://videos.sproutvideo.com/embed/{id}/...
  const embedMatch = url.match(/videos\.sproutvideo\.com\/embed\/([a-zA-Z0-9]+)/)
  if (embedMatch) return embedMatch[1]

  return null // Invalid URL
}

interface SproutVideoDetails {
  id: string
  title: string
  description?: string
  duration: number
  assets: {
    poster_frames: string[]
  }
  created_at: string
}

export function useSproutVideoApi() {
  const fetchVideoDetails = useMutation({
    mutationFn: async ({ videoUrl, apiKey }: { videoUrl: string; apiKey: string }) => {
      // Parse URL to get video ID
      const videoId = parseSproutVideoUrl(videoUrl)
      if (!videoId) {
        throw new Error('Invalid Sprout Video URL format')
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
    fetchVideoDetailsAsync: fetchVideoDetails.mutateAsync,
    isFetching: fetchVideoDetails.isPending,
    error: fetchVideoDetails.error,
    data: fetchVideoDetails.data
  }
}
```

**Usage in VideoLinksManager**:
```typescript
const { apiKey } = useSproutVideoApiKey()
const { fetchVideoDetailsAsync, isFetching } = useSproutVideoApi()
const { addVideoLink } = useBreadcrumbsVideoLinks({ projectPath })

const handleUrlBlur = async () => {
  if (!formData.url || !apiKey) return

  try {
    const details = await fetchVideoDetailsAsync({
      videoUrl: formData.url,
      apiKey
    })

    // Auto-populate fields from API response
    setFormData({
      ...formData,
      title: details.title,
      thumbnailUrl: details.assets.poster_frames[0] || '',
      sproutVideoId: details.id
    })
  } catch (error) {
    console.error('Failed to fetch video details:', error)
    setValidationErrors([`Failed to fetch video details: ${error.message}`])
  }
}
```

---

## Event Emissions

### Video Upload Progress

**Event Name**: `video_upload_progress`

**Payload**:
```typescript
{
  file_path: string
  bytes_uploaded: number
  total_bytes: number
  percentage: number
}
```

**Usage**:
```typescript
import { listen } from '@tauri-apps/api/event'

const unlisten = await listen('video_upload_progress', (event) => {
  const { percentage } = event.payload
  setUploadProgress(percentage)
})
```

---

## Testing Contracts

See `contracts/test-scenarios.md` for detailed test cases validating these contracts.

---

## UI Component Patterns: Video Upload Toggle (Enhancement)

### Component: VideoLinksManager (Enhanced)

**Enhancement Date**: 2025-09-30
**Feature**: Add upload toggle (URL entry OR file upload)

#### Component Props (Unchanged)

```typescript
interface VideoLinksManagerProps {
  projectPath: string  // Absolute path to project folder
}
```

#### Component State (Enhanced)

```typescript
// Existing state
const { videoLinks, addVideoLink, removeVideoLink, reorderVideoLinks, isUpdating } =
  useBreadcrumbsVideoLinks({ projectPath })

// NEW: Add mode toggle
const [addMode, setAddMode] = useState<'url' | 'upload'>('url')

// NEW: Upload hooks
const { selectedFile, uploading, response, selectFile, uploadFile, resetUploadState } =
  useFileUpload()
const { progress, message } = useUploadEvents()

// Existing URL mode state (unchanged)
const [formData, setFormData] = useState({
  url: '',
  title: '',
  thumbnailUrl: '',
  sproutVideoId: ''
})
```

#### UI Structure (Enhanced)

```tsx
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogTrigger asChild>
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Video
    </Button>
  </DialogTrigger>

  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Video Link</DialogTitle>
      <DialogDescription>
        Add a video by entering a Sprout Video URL or uploading a file
      </DialogDescription>
    </DialogHeader>

    {/* NEW: Tabs for URL vs Upload */}
    <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'url' | 'upload')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="url">Enter URL</TabsTrigger>
        <TabsTrigger value="upload">Upload File</TabsTrigger>
      </TabsList>

      {/* EXISTING: URL entry tab */}
      <TabsContent value="url" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-url">Video URL *</Label>
          <div className="flex gap-2">
            <Input
              id="video-url"
              placeholder="https://sproutvideo.com/videos/..."
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleFetchVideoDetails}
              disabled={!formData.url || !apiKey || isFetchingVideo}
            >
              {isFetchingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch Details'}
            </Button>
          </div>
        </div>

        {/* Existing title, sproutId, thumbnailUrl fields */}
        {/* ... */}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddVideoFromUrl}>Add Video</Button>
        </DialogFooter>
      </TabsContent>

      {/* NEW: Upload file tab */}
      <TabsContent value="upload" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Video File</Label>
            <Button onClick={selectFile} className="w-full" disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              Select Video File
            </Button>
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.split('/').pop()}
              </p>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Uploading: {progress}%</p>
              <Progress value={progress} />
            </div>
          )}

          {message && (
            <Alert variant={message.includes('failed') ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {!apiKey && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sprout Video API key not configured. Go to Settings to add it.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogClose(false)}>
            Cancel
          </Button>
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
        </DialogFooter>
      </TabsContent>
    </Tabs>

    {/* Error display (shared between tabs) */}
    {validationErrors.length > 0 && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <ul className="list-disc pl-4 space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    )}
  </DialogContent>
</Dialog>
```

#### Event Handlers (NEW)

```typescript
// Upload workflow handler
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

    // Wait for response (set by useFileUpload via event listener)
    // Response is available in `response` state

  } catch (error) {
    setValidationErrors([error instanceof Error ? error.message : 'Upload failed'])
  }
}

// Watch for upload completion
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
}, [response, selectedFile])

// Tab change cleanup
const handleTabChange = (newMode: 'url' | 'upload') => {
  setAddMode(newMode)
  setValidationErrors([])
  resetUploadState()
}

// Dialog close cleanup
const handleDialogClose = (open: boolean) => {
  setIsDialogOpen(open)
  if (!open) {
    resetUploadState()
    setFormData({ url: '', title: '', thumbnailUrl: '', sproutVideoId: '' })
    setValidationErrors([])
    setAddMode('url')
  }
}
```

#### Helper Function: Create VideoLink from Upload

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

#### State Transitions

**Upload Flow**:
1. **Idle**: User in "Upload File" tab, no file selected
   - State: `selectedFile = null`, `uploading = false`
   - UI: "Select Video File" button enabled

2. **File Selected**: User clicked select button, chose file
   - State: `selectedFile = "/path/to/video.mp4"`, `uploading = false`
   - UI: Filename displayed, "Upload and Add" button enabled

3. **Uploading**: User clicked "Upload and Add", upload in progress
   - State: `uploading = true`, `progress = 0-100`
   - UI: Progress bar visible, buttons disabled

4. **Upload Complete**: Backend emitted `upload_complete` event
   - State: `response = SproutUploadResponse`, `uploading = false`
   - Action: Create VideoLink, validate, add to breadcrumbs, close dialog

5. **Upload Error**: Backend emitted `upload_error` event
   - State: `message = "Upload failed: ..."`, `uploading = false`
   - UI: Error alert shown, "Upload and Add" button re-enabled for retry

**Cleanup Triggers**:
- Dialog closes → Reset all upload state
- Tab switches → Clear errors, reset progress
- Upload succeeds → Reset state, close dialog

#### Integration with Existing Hooks

**useFileUpload** (from UploadSprout.tsx):
- `selectFile()`: Opens file picker with video filters
- `uploadFile(apiKey)`: Invokes `upload_video` Tauri command
- `resetUploadState()`: Clears selectedFile, response, uploading state

**useUploadEvents** (from UploadSprout.tsx):
- Listens to `upload_progress`, `upload_complete`, `upload_error` events
- Provides reactive `progress`, `uploading`, `message` state via React Query

**useBreadcrumbsVideoLinks** (existing):
- `addVideoLink(videoLink)`: Same mutation used for URL and upload paths

#### Validation Rules

**Upload-Specific**:
1. File must be selected before upload
2. API key must be configured
3. File must be video format (enforced by file picker filters)
4. Project must not exceed 20 video limit
5. Upload response must contain valid data (url, id, title)

**Shared with URL Path**:
- `validateVideoLink()` function checks URL format, title length, etc.

#### Error Handling

**Upload Errors**:
- **No API Key**: Show alert, disable upload button
- **Upload Timeout**: Show error with retry button
- **Network Error**: Show error with retry button
- **API Error (4xx/5xx)**: Parse error from backend, show specific message

**Error Display**:
- Errors from `message` state (upload events) shown in Alert component
- Validation errors from `validationErrors` state shown in separate Alert

---

## Summary: UI Contracts

### VideoLinksManager Component Contract

**Props**:
- `projectPath: string` (absolute path)

**Events**:
- Dialog opens/closes
- Tab switches (URL ↔ Upload)
- File selected
- Upload starts/progresses/completes/errors
- VideoLink added to breadcrumbs

**State Management**:
- Uses `useBreadcrumbsVideoLinks` hook for CRUD operations
- Uses `useFileUpload` + `useUploadEvents` hooks for upload workflow
- Uses `useSproutVideoApiKey` hook for API key access

**External Dependencies**:
- ShadCN UI: Dialog, Tabs, Button, Input, Label, Progress, Alert
- Lucide React: Plus, Upload, Loader2, AlertCircle icons
- @tauri-apps/plugin-dialog: File picker
- TanStack React Query: Async state management

**Backward Compatibility**:
- URL entry tab is default
- Existing behavior unchanged when not using upload
- Upload is additive feature, can be ignored by users who prefer URL workflow

---