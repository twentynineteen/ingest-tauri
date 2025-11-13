# Data Model: AI Script Example Embedding Management

**Feature**: 007-frontend-script-example
**Date**: 2025-11-12
**Version**: 1.0.0

## Overview

This document defines the data structures for managing script example embeddings. The data model extends the existing RAG system schema with support for user-uploaded examples while maintaining backward compatibility with bundled examples.

## Entity Definitions

### 1. ExampleScript (Database Entity)

Represents a script example stored in the SQLite database.

**Fields**:
- `id` (TEXT, PRIMARY KEY): Unique identifier
  - Bundled examples: kebab-case descriptive ID (e.g., "edu-001", "business-presentation-1")
  - User uploads: UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
- `title` (TEXT, NOT NULL): Human-readable title (max 200 chars)
- `category` (TEXT, NOT NULL): Example category
  - Valid values: "educational", "business", "narrative", "interview", "documentary", "user-custom"
- `before_text` (TEXT, NOT NULL): Original unformatted script content
- `after_text` (TEXT, NOT NULL): Autocue-formatted version
- `tags` (TEXT, NULL): Comma-separated tags for filtering
- `word_count` (INTEGER, NULL): Word count of before_text
- `quality_score` (INTEGER, NULL): Rating 1-5 (used for search ranking)
- `source` (TEXT, DEFAULT 'bundled'): Origin of example
  - Valid values: "bundled", "user-uploaded"
- `created_at` (TEXT, DEFAULT CURRENT_TIMESTAMP): ISO 8601 timestamp

**Validation Rules**:
- `title`: 1-200 characters, no newlines
- `category`: Must be one of enum values
- `before_text`: 50-100,000 characters
- `after_text`: 50-100,000 characters
- `quality_score`: 1-5 or NULL
- `source`: "bundled" or "user-uploaded"

**Indexes**:
- `idx_category` on `category`
- `idx_quality` on `quality_score`
- `idx_source` on `source` (NEW)

### 2. Embedding (Database Entity)

Stores the vector embedding for similarity search.

**Fields**:
- `script_id` (TEXT, PRIMARY KEY, FOREIGN KEY): References `ExampleScript.id`
- `embedding` (BLOB, NOT NULL): Float32 array serialized as bytes
  - Dimension: 384 (all-MiniLM-L6-v2 model)
  - Storage: 384 × 4 bytes = 1,536 bytes per embedding
- `dimension` (INTEGER, NOT NULL): Embedding dimension (always 384)

**Validation Rules**:
- `embedding`: Must be exactly 1,536 bytes (384 floats × 4 bytes)
- `dimension`: Must equal 384

**Constraints**:
- CASCADE DELETE: When ExampleScript deleted, embedding also deleted

### 3. ExampleMetadata (Frontend Type)

User-provided metadata for uploading examples.

**TypeScript Definition**:
```typescript
interface ExampleMetadata {
  title: string          // 1-200 chars
  category: ExampleCategory
  tags?: string[]        // Optional tags
  qualityScore?: number  // 1-5
}

enum ExampleCategory {
  EDUCATIONAL = 'educational',
  BUSINESS = 'business',
  NARRATIVE = 'narrative',
  INTERVIEW = 'interview',
  DOCUMENTARY = 'documentary',
  USER_CUSTOM = 'user-custom'
}
```

**Validation Rules**:
- `title`: Required, trimmed, 1-200 chars
- `category`: Required, must be valid enum value
- `tags`: Optional, each tag max 50 chars, max 10 tags
- `qualityScore`: Optional, integer 1-5

### 4. UploadedExample (API Response)

Represents an example returned from the backend.

**TypeScript Definition**:
```typescript
interface UploadedExample {
  id: string
  title: string
  category: string
  beforeText: string
  afterText: string
  tags: string[]
  wordCount: number | null
  qualityScore: number | null
  source: 'bundled' | 'user-uploaded'
  createdAt: string  // ISO 8601
  // Note: embedding not included (internal use only)
}
```

**Rust Definition** (extends existing SimilarExample):
```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExampleWithMetadata {
    pub id: String,
    pub title: String,
    pub category: String,
    pub before_text: String,
    pub after_text: String,
    pub tags: Option<String>,
    pub word_count: Option<i32>,
    pub quality_score: Option<i32>,
    pub source: String,
    pub created_at: String,
}
```

### 5. UploadRequest (API Input)

Data sent from frontend to backend for uploads.

**TypeScript Definition**:
```typescript
interface UploadRequest {
  content: string          // Script content to embed
  metadata: ExampleMetadata
  embedding: number[]      // Pre-computed embedding (384 floats)
}
```

**Rust Definition**:
```rust
#[derive(Debug, Deserialize)]
pub struct UploadRequest {
    pub content: String,
    pub metadata: ExampleMetadata,
    pub embedding: Vec<f32>,
}

#[derive(Debug, Deserialize)]
pub struct ExampleMetadata {
    pub title: String,
    pub category: String,
    pub tags: Option<Vec<String>>,
    pub quality_score: Option<i32>,
}
```

## State Transitions

### Upload Flow

```
[User Action] → [Frontend State] → [Backend State] → [Database State]

1. User selects file
   → uploadDialog.open = true

2. User fills metadata
   → metadata = { title, category, ... }

3. User submits
   → isUploading = true
   → Generate embedding (useEmbedding)
   → Call upload_example()

4. Backend validates
   → Check file size, encoding, dimensions
   → If invalid: Return Error

5. Backend stores
   → INSERT INTO example_scripts
   → INSERT INTO embeddings
   → If success: Return new ID

6. Frontend updates
   → queryClient.invalidateQueries(['examples'])
   → isUploading = false
   → uploadDialog.open = false
   → Show success toast
```

### Replace Flow

```
1. User clicks "Replace" on example card
   → selectedExampleId = id
   → replaceDialog.open = true

2. User selects new file
   → Generate embedding for new content

3. User confirms
   → Call replace_example(id, newContent, newEmbedding)

4. Backend updates
   → BEGIN TRANSACTION
   → UPDATE example_scripts SET before_text=?, after_text=?, word_count=?
   → UPDATE embeddings SET embedding=?
   → COMMIT

5. Frontend refreshes
   → queryClient.invalidateQueries(['examples'])
   → Show success toast
```

### Delete Flow

```
1. User clicks "Delete" on example card
   → selectedExampleId = id
   → deleteDialog.open = true

2. User confirms
   → Call delete_example(id)

3. Backend deletes
   → DELETE FROM embeddings WHERE script_id = ?
   → DELETE FROM example_scripts WHERE id = ?

4. Frontend updates
   → queryClient.invalidateQueries(['examples'])
   → Show success toast
```

## Validation Rules

### File Upload Validation

**Frontend Validation** (immediate feedback):
- File extension: Must be `.txt`
- File size: Max 1 MB
- Content length: Min 50 chars, max 100,000 chars
- Character encoding: UTF-8 validation

**Backend Validation** (secondary check):
- Embedding dimensions: Must be exactly 384
- Content non-empty: After trim, length > 0
- SQL injection prevention: Parameterized queries only

### Metadata Validation

**Title**:
```typescript
// Frontend
const titleSchema = z.string()
  .trim()
  .min(1, "Title required")
  .max(200, "Title too long")
  .regex(/^[^
\r]+$/, "No newlines allowed")
```

**Category**:
```typescript
// Frontend
const categorySchema = z.enum([
  'educational',
  'business',
  'narrative',
  'interview',
  'documentary',
  'user-custom'
])
```

**Tags**:
```typescript
// Frontend
const tagsSchema = z.array(
  z.string().trim().min(1).max(50)
).max(10).optional()
```

**Quality Score**:
```typescript
// Frontend
const qualityScoreSchema = z.number()
  .int()
  .min(1)
  .max(5)
  .optional()
```

## Database Schema Updates

### Migration Script

```sql
-- Add source column to track bundled vs user-uploaded
ALTER TABLE example_scripts
ADD COLUMN source TEXT DEFAULT 'bundled';

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_source
ON example_scripts(source);

-- Update existing records (all bundled)
UPDATE example_scripts
SET source = 'bundled'
WHERE source IS NULL;
```

### Rollback Plan

```sql
-- If needed to rollback
DROP INDEX IF EXISTS idx_source;
ALTER TABLE example_scripts DROP COLUMN source;
```

## Constraints & Limits

**Storage Limits**:
- Max examples total: 10,000 (practical limit for UI performance)
- Max user-uploaded examples: 1,000 per user (future consideration)
- Database size: ~50 MB typical (10k examples × ~5 KB average)

**Performance Targets**:
- List query: <50ms for 100 examples
- Upload: <5s end-to-end
- Delete: <100ms
- Replace: <5s end-to-end

**Concurrency**:
- SQLite write locking: One write at a time (acceptable for desktop app)
- Read-while-write: Allowed in WAL mode
- No optimistic locking needed (single user)

## Error Handling

### Error Types

**Frontend Errors**:
```typescript
type UploadError =
  | { type: 'file_too_large'; maxSize: number }
  | { type: 'invalid_encoding'; details: string }
  | { type: 'embedding_failed'; error: string }
  | { type: 'validation_failed'; field: string; message: string }
  | { type: 'network_error'; error: string }

type DeleteError =
  | { type: 'example_not_found'; id: string }
  | { type: 'database_error'; error: string }
```

**Backend Errors**:
```rust
pub enum ExampleError {
    NotFound(String),
    InvalidDimensions { expected: usize, got: usize },
    DatabaseError(String),
    ValidationError(String),
}

impl From<ExampleError> for String {
    fn from(err: ExampleError) -> String {
        match err {
            ExampleError::NotFound(id) => format!("Example not found: {}", id),
            ExampleError::InvalidDimensions { expected, got } =>
                format!("Invalid embedding dimensions: expected {}, got {}", expected, got),
            ExampleError::DatabaseError(msg) => format!("Database error: {}", msg),
            ExampleError::ValidationError(msg) => format!("Validation error: {}", msg),
        }
    }
}
```

## Backward Compatibility

**Existing Code Compatibility**:
- ✅ `search_similar_scripts`: No changes needed (works with new `source` column)
- ✅ `get_all_examples`: Returns all examples including user-uploaded
- ✅ Build script (`embed-examples.js`): Continues to work, sets `source='bundled'`

**Migration Safety**:
- New column has default value → No NULL issues
- Index creation is non-blocking
- Existing queries work unchanged

## Future Extensions

**Potential Schema Additions** (not in current scope):
- `user_id` column for multi-user support
- `version` column for example versioning
- `parent_id` column for example history
- `shared` boolean for sharing between users

**Potential Optimizations**:
- Full-text search index on `before_text`, `after_text`
- Materialized similarity scores cache
- Embedding quantization for smaller storage
