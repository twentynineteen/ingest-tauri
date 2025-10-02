# Data Model: Multiple Video Links and Trello Cards

**Feature**: 004-embed-multiple-video
**Date**: 2025-09-30
**Status**: Phase 1 Design

## Overview

This document defines the data structures for storing multiple video links and Trello cards within breadcrumbs files, ensuring backward compatibility with existing single-value schema.

---

## Core Entities

### 1. VideoLink

Represents a single video (typically Sprout Video hosted) associated with a project.

**TypeScript Definition**:
```typescript
interface VideoLink {
  url: string                    // Full video URL (e.g., https://sproutvideo.com/videos/abc123)
  sproutVideoId?: string         // Extracted Sprout Video ID (e.g., "abc123")
  title: string                  // User-provided or fetched title
  thumbnailUrl?: string          // Cached thumbnail URL from Sprout API
  uploadDate?: string            // ISO 8601 timestamp of upload
  sourceRenderFile?: string      // Original filename from Renders/ folder
}
```

**Rust Definition**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoLink {
    pub url: String,

    #[serde(rename = "sproutVideoId", skip_serializing_if = "Option::is_none")]
    pub sprout_video_id: Option<String>,

    pub title: String,

    #[serde(rename = "thumbnailUrl", skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,

    #[serde(rename = "uploadDate", skip_serializing_if = "Option::is_none")]
    pub upload_date: Option<String>,

    #[serde(rename = "sourceRenderFile", skip_serializing_if = "Option::is_none")]
    pub source_render_file: Option<String>,
}
```

**Field Validation**:
- `url`: Must start with `https://`, max 2048 characters
- `sproutVideoId`: Optional, alphanumeric + dash/underscore, max 50 characters
- `title`: Required, 1-200 characters
- `thumbnailUrl`: Optional, valid URL format
- `uploadDate`: Optional, ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- `sourceRenderFile`: Optional, filename only (no path), max 255 characters

**State Transitions**:
1. **Created**: User adds URL manually or via upload → `url` + `title` populated
2. **Enriched**: Sprout Video upload completes → `sproutVideoId`, `thumbnailUrl`, `uploadDate` populated
3. **Associated**: User links to render file → `sourceRenderFile` populated

---

### 2. TrelloCard

Represents a Trello card associated with a project.

**TypeScript Definition**:
```typescript
interface TrelloCard {
  url: string                    // Full Trello card URL (e.g., https://trello.com/c/abc123/project-name)
  cardId: string                 // Extracted card ID (e.g., "abc123")
  title: string                  // Fetched card name/title from Trello API
  boardName?: string             // Optional board name from Trello API
  lastFetched?: string           // ISO 8601 timestamp of last title fetch
}
```

**Rust Definition**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrelloCard {
    pub url: String,

    #[serde(rename = "cardId")]
    pub card_id: String,

    pub title: String,

    #[serde(rename = "boardName", skip_serializing_if = "Option::is_none")]
    pub board_name: Option<String>,

    #[serde(rename = "lastFetched", skip_serializing_if = "Option::is_none")]
    pub last_fetched: Option<String>,
}
```

**Field Validation**:
- `url`: Must match `https://trello.com/c/[cardId]/.*`, max 2048 characters
- `cardId`: Required, extracted from URL, alphanumeric 8-24 characters
- `title`: Required, fetched from API, 1-200 characters
- `boardName`: Optional, fetched from API, max 200 characters
- `lastFetched`: Optional, ISO 8601 format

**State Transitions**:
1. **Created**: User pastes Trello URL → `url` + `cardId` extracted
2. **Fetched**: API call completes → `title` + `boardName` populated, `lastFetched` timestamp set
3. **Stale**: `lastFetched` > 7 days old → UI prompts refresh

---

### 3. BreadcrumbsFile (Updated)

Enhanced breadcrumbs structure with backward-compatible multi-media fields.

**TypeScript Definition**:
```typescript
interface BreadcrumbsFile {
  // === EXISTING FIELDS (unchanged) ===
  projectTitle: string
  numberOfCameras: number
  files: FileInfo[]
  parentFolder: string
  createdBy: string
  creationDateTime: string
  folderSizeBytes?: number
  lastModified?: string
  scannedBy?: string

  // === DEPRECATED FIELD (keep for backward compatibility) ===
  trelloCardUrl?: string         // Single Trello URL (legacy)

  // === NEW FIELDS (Phase 004) ===
  videoLinks?: VideoLink[]       // Array of video links (replaces single video concept)
  trelloCards?: TrelloCard[]     // Array of Trello cards (replaces trelloCardUrl)
}
```

**Rust Definition**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreadcrumbsFile {
    // === EXISTING FIELDS ===
    #[serde(rename = "projectTitle")]
    pub project_title: String,

    #[serde(rename = "numberOfCameras")]
    pub number_of_cameras: i32,

    pub files: Vec<FileInfo>,

    #[serde(rename = "parentFolder")]
    pub parent_folder: String,

    #[serde(rename = "createdBy")]
    pub created_by: String,

    #[serde(rename = "creationDateTime")]
    pub creation_date_time: String,

    #[serde(rename = "folderSizeBytes")]
    pub folder_size_bytes: Option<u64>,

    #[serde(rename = "lastModified")]
    pub last_modified: Option<String>,

    #[serde(rename = "scannedBy")]
    pub scanned_by: Option<String>,

    // === DEPRECATED FIELD ===
    #[serde(rename = "trelloCardUrl")]
    pub trello_card_url: Option<String>,

    // === NEW FIELDS ===
    #[serde(rename = "videoLinks", skip_serializing_if = "Option::is_none")]
    pub video_links: Option<Vec<VideoLink>>,

    #[serde(rename = "trelloCards", skip_serializing_if = "Option::is_none")]
    pub trello_cards: Option<Vec<TrelloCard>>,
}
```

**Migration Rules**:
1. **Old → New (Read)**:
   - If `trelloCardUrl` exists and `trelloCards` is None → Create single-item array
   - If both exist → `trelloCards` takes precedence

2. **New → Old (Write)**:
   - Always write both `videoLinks`/`trelloCards` arrays and `trelloCardUrl` (for backward compat)
   - `trelloCardUrl` = first item in `trelloCards` array if present

---

## Relationships

```
BreadcrumbsFile
├── files[] (FileInfo) ───────┐ (existing, unchanged)
│                             │
├── trelloCardUrl (string?)───┤ DEPRECATED
│                             │
├── videoLinks[] (VideoLink)──┼─> Multiple videos per project
│   ├── url                   │
│   ├── sproutVideoId?        │
│   ├── title                 │
│   ├── thumbnailUrl?         │
│   ├── uploadDate?           │
│   └── sourceRenderFile?     │
│                             │
└── trelloCards[] (TrelloCard)┼─> Multiple Trello cards per project
    ├── url                   │
    ├── cardId                │
    ├── title                 │
    ├── boardName?            │
    └── lastFetched?          │
```

---

## Storage Format

**Example: Legacy Format (Pre-004)**
```json
{
  "projectTitle": "Client Project A",
  "numberOfCameras": 2,
  "files": [ /* ... */ ],
  "parentFolder": "/Users/editor/Projects",
  "createdBy": "john@example.com",
  "creationDateTime": "2025-01-15T10:30:00.000Z",
  "trelloCardUrl": "https://trello.com/c/abc123/client-project-a"
}
```

**Example: New Format (Phase 004)**
```json
{
  "projectTitle": "Client Project A",
  "numberOfCameras": 2,
  "files": [ /* ... */ ],
  "parentFolder": "/Users/editor/Projects",
  "createdBy": "john@example.com",
  "creationDateTime": "2025-01-15T10:30:00.000Z",
  "trelloCardUrl": "https://trello.com/c/abc123/client-project-a",
  "videoLinks": [
    {
      "url": "https://sproutvideo.com/videos/xyz789",
      "sproutVideoId": "xyz789",
      "title": "Final Edit - Camera Angle 1",
      "thumbnailUrl": "https://cdn.sproutvideo.com/.../frame_0000.jpg",
      "uploadDate": "2025-01-20T14:22:00.000Z",
      "sourceRenderFile": "final-edit-v3.mp4"
    },
    {
      "url": "https://sproutvideo.com/videos/def456",
      "sproutVideoId": "def456",
      "title": "Final Edit - Camera Angle 2",
      "thumbnailUrl": "https://cdn.sproutvideo.com/.../frame_0000.jpg",
      "uploadDate": "2025-01-20T14:25:00.000Z",
      "sourceRenderFile": "final-edit-multi-cam.mp4"
    }
  ],
  "trelloCards": [
    {
      "url": "https://trello.com/c/abc123/client-project-a",
      "cardId": "abc123",
      "title": "Client Project A - Pre-Production",
      "boardName": "Video Projects 2025",
      "lastFetched": "2025-01-20T10:00:00.000Z"
    },
    {
      "url": "https://trello.com/c/ghi789/post-production",
      "cardId": "ghi789",
      "title": "Client Project A - Post-Production",
      "boardName": "Video Projects 2025",
      "lastFetched": "2025-01-20T10:00:00.000Z"
    }
  ]
}
```

---

## Validation Rules

### VideoLink Validation
```typescript
function validateVideoLink(link: VideoLink): string[] {
  const errors: string[] = []

  if (!link.url.startsWith('https://')) {
    errors.push('Video URL must use HTTPS')
  }

  if (link.url.length > 2048) {
    errors.push('Video URL exceeds maximum length (2048 characters)')
  }

  if (!link.title || link.title.trim().length === 0) {
    errors.push('Video title is required')
  }

  if (link.title.length > 200) {
    errors.push('Video title exceeds maximum length (200 characters)')
  }

  if (link.thumbnailUrl && !link.thumbnailUrl.startsWith('https://')) {
    errors.push('Thumbnail URL must use HTTPS')
  }

  if (link.uploadDate && !isValidISO8601(link.uploadDate)) {
    errors.push('Upload date must be in ISO 8601 format')
  }

  return errors
}
```

### TrelloCard Validation
```typescript
function validateTrelloCard(card: TrelloCard): string[] {
  const errors: string[] = []

  const urlPattern = /^https:\/\/trello\.com\/c\/([a-zA-Z0-9]{8,24})\/.*/
  const match = card.url.match(urlPattern)

  if (!match) {
    errors.push('Invalid Trello card URL format')
  } else if (match[1] !== card.cardId) {
    errors.push('Card ID does not match URL')
  }

  if (!card.title || card.title.trim().length === 0) {
    errors.push('Trello card title is required')
  }

  if (card.title.length > 200) {
    errors.push('Trello card title exceeds maximum length (200 characters)')
  }

  if (card.lastFetched && !isValidISO8601(card.lastFetched)) {
    errors.push('Last fetched timestamp must be in ISO 8601 format')
  }

  return errors
}
```

---

## Index and Query Patterns

### Frontend State Management

**Zustand Store Enhancement**:
```typescript
interface BreadcrumbStore {
  // Existing state...
  breadcrumbs: BreadcrumbsFile | null

  // New actions for video links
  addVideoLink: (link: VideoLink) => void
  removeVideoLink: (index: number) => void
  updateVideoLink: (index: number, link: VideoLink) => void
  reorderVideoLinks: (fromIndex: number, toIndex: number) => void

  // New actions for Trello cards
  addTrelloCard: (card: TrelloCard) => void
  removeTrelloCard: (index: number) => void
  updateTrelloCard: (index: number, card: TrelloCard) => void
  reorderTrelloCards: (fromIndex: number, toIndex: number) => void
}
```

### Backend Query Patterns

**Rust Helper Functions**:
```rust
impl BreadcrumbsFile {
    /// Get all video links, migrating from legacy format if needed
    pub fn get_video_links(&self) -> Vec<VideoLink> {
        self.video_links.clone().unwrap_or_default()
    }

    /// Get all Trello cards, migrating from legacy single URL if needed
    pub fn get_trello_cards(&self) -> Vec<TrelloCard> {
        if let Some(cards) = &self.trello_cards {
            return cards.clone();
        }

        // Fallback: migrate from legacy trelloCardUrl
        if let Some(url) = &self.trello_card_url {
            if let Some(card_id) = extract_trello_card_id(url) {
                return vec![TrelloCard {
                    url: url.clone(),
                    card_id,
                    title: String::new(), // Frontend will fetch
                    board_name: None,
                    last_fetched: None,
                }];
            }
        }

        Vec::new()
    }
}

fn extract_trello_card_id(url: &str) -> Option<String> {
    let re = regex::Regex::new(r"trello\.com/c/([a-zA-Z0-9]{8,24})").ok()?;
    re.captures(url)?.get(1).map(|m| m.as_str().to_string())
}
```

---

## Performance Considerations

1. **Array Size Limits**:
   - Max 20 video links per project (reasonable for professional use case)
   - Max 10 Trello cards per project
   - Total breadcrumbs file size should remain < 100KB

2. **Caching Strategy**:
   - Cache Trello card titles for 7 days (avoid API rate limits)
   - Cache video thumbnails indefinitely (Sprout CDN URLs are stable)
   - No real-time fetching during Baker scans (use cached data)

3. **Serialization**:
   - Use `skip_serializing_if = "Option::is_none"` to minimize file size
   - Pretty-print JSON for human readability (Baker already does this)

---

## Next Steps

With data model defined, proceed to:
1. **API Contracts**: Define Tauri commands and TypeScript hooks
2. **Quickstart Guide**: User workflow documentation
3. **Test Scenarios**: Contract tests for validation logic