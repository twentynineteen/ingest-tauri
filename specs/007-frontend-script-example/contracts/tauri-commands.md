# Tauri Command Contracts

**Feature**: 007-frontend-script-example
**Module**: `src-tauri/src/commands/rag.rs`
**Date**: 2025-11-12

## Overview

This document defines the Tauri command signatures for managing script example embeddings. All commands follow Tauri 2.0 conventions and return `Result<T, String>` for error handling.

## Command Definitions

### 1. get_all_examples_with_metadata

Retrieve all script examples with full metadata including source information.

**Signature**:
```rust
#[tauri::command]
pub async fn get_all_examples_with_metadata(
    app: tauri::AppHandle
) -> Result<Vec<ExampleWithMetadata>, String>
```

**Request**: None

**Response**:
```typescript
interface ExampleWithMetadata {
  id: string
  title: string
  category: string
  beforeText: string
  afterText: string
  tags: string[]
  wordCount: number | null
  qualityScore: number | null
  source: 'bundled' | 'user-uploaded'
  createdAt: string  // ISO 8601 format
}
```

**Behavior**:
- Opens read-only connection to `embeddings/examples.db`
- Queries all examples ordered by quality_score DESC, title ASC
- Returns empty array if database empty (not an error)
- Converts comma-separated tags to array
- Maps snake_case DB fields to camelCase frontend

**Errors**:
- `"Database not found at: {path}"` - Database file missing
- `"Failed to open database: {error}"` - Connection error
- `"Failed to query database: {error}"` - Query execution error

**Performance**:
- Expected: <50ms for 100 examples
- Acceptable: <200ms for 1000 examples

---

### 2. upload_example

Add a new user-uploaded example to the database with pre-computed embedding.

**Signature**:
```rust
#[tauri::command]
pub async fn upload_example(
    app: tauri::AppHandle,
    before_text: String,
    after_text: String,
    metadata: ExampleMetadataInput,
    embedding: Vec<f32>
) -> Result<String, String>
```

**Request**:
```rust
#[derive(Debug, Deserialize)]
pub struct ExampleMetadataInput {
    pub title: String,          // 1-200 chars
    pub category: String,        // enum value
    pub tags: Option<Vec<String>>,
    pub quality_score: Option<i32>,  // 1-5
}
```

**Response**: `String` (new example ID)
```typescript
// Example: "550e8400-e29b-41d4-a716-446655440000"
```

**Behavior**:
1. Validate inputs:
   - `title`: 1-200 chars, no newlines
   - `category`: Valid enum value
   - `before_text`: 50-100,000 chars
   - `after_text`: 50-100,000 chars
   - `embedding`: Exactly 384 dimensions
   - `quality_score`: 1-5 or NULL

2. Generate UUID for new example ID
3. Calculate word count from before_text
4. Convert tags Vec<String> to comma-separated String
5. Begin transaction
6. Insert into `example_scripts` with `source='user-uploaded'`
7. Convert Vec<f32> to BLOB (little-endian Float32)
8. Insert into `embeddings`
9. Commit transaction
10. Return new ID

**Errors**:
- `"Validation error: {details}"` - Input validation failed
- `"Invalid embedding dimensions: expected 384, got {n}"` - Wrong embedding size
- `"Database error: {error}"` - Insert failed
- `"Failed to generate ID"` - UUID generation failed (rare)

**Performance**:
- Expected: <100ms
- Acceptable: <500ms

---

### 3. replace_example

Update an existing example's content and embedding.

**Signature**:
```rust
#[tauri::command]
pub async fn replace_example(
    app: tauri::AppHandle,
    id: String,
    before_text: String,
    after_text: String,
    embedding: Vec<f32>
) -> Result<(), String>
```

**Request**:
- `id`: Example ID to replace
- `before_text`: New unformatted content
- `after_text`: New formatted content
- `embedding`: New embedding vector (384 dimensions)

**Response**: `()` (unit type, success indicated by Ok)

**Behavior**:
1. Validate inputs (same as upload)
2. Verify example exists (SELECT id FROM example_scripts WHERE id = ?)
3. Calculate new word count
4. Begin transaction
5. Update `example_scripts` (before_text, after_text, word_count, updated_at=CURRENT_TIMESTAMP)
6. Update `embeddings` (embedding)
7. Commit transaction

**Errors**:
- `"Example not found: {id}"` - ID doesn't exist
- `"Cannot replace bundled example: {id}"` - Attempted to modify bundled example
- `"Validation error: {details}"` - Input validation failed
- `"Invalid embedding dimensions: expected 384, got {n}"` - Wrong size
- `"Database error: {error}"` - Update failed

**Performance**:
- Expected: <50ms
- Acceptable: <200ms

---

### 4. delete_example

Remove an example and its embedding from the database.

**Signature**:
```rust
#[tauri::command]
pub async fn delete_example(
    app: tauri::AppHandle,
    id: String
) -> Result<(), String>
```

**Request**:
- `id`: Example ID to delete

**Response**: `()` (success indicated by Ok)

**Behavior**:
1. Verify example exists
2. Check if user-uploaded (prevent bundled deletion)
3. Begin transaction
4. Delete from `embeddings` (CASCADE handles this automatically)
5. Delete from `example_scripts`
6. Commit transaction

**Errors**:
- `"Example not found: {id}"` - ID doesn't exist
- `"Cannot delete bundled example: {id}"` - Attempted to delete bundled
- `"Database error: {error}"` - Delete failed

**Performance**:
- Expected: <20ms
- Acceptable: <100ms

---

### 5. validate_example_file (helper, not exposed to frontend)

Internal validation function for file content.

**Signature**:
```rust
fn validate_example_file(
    content: &str
) -> Result<(), String>
```

**Validation Rules**:
- Length: 50-100,000 characters
- Encoding: Valid UTF-8 (guaranteed by String type)
- Content: Non-empty after trim

---

## Frontend TypeScript Bindings

**Hook Usage**:
```typescript
import { invoke } from '@tauri-apps/api/core'

// Get all examples
const examples = await invoke<ExampleWithMetadata[]>('get_all_examples_with_metadata')

// Upload example
const newId = await invoke<string>('upload_example', {
  beforeText: content,
  afterText: formatted,
  metadata: {
    title: 'My Example',
    category: 'user-custom',
    tags: ['test'],
    qualityScore: 4
  },
  embedding: [/* 384 floats */]
})

// Replace example
await invoke('replace_example', {
  id: 'example-id',
  beforeText: newContent,
  afterText: newFormatted,
  embedding: [/* 384 floats */]
})

// Delete example
await invoke('delete_example', {
  id: 'example-id'
})
```

## Error Handling Pattern

**Frontend Error Handling**:
```typescript
try {
  await invoke('upload_example', { /* ... */ })
} catch (error) {
  if (typeof error === 'string') {
    // Parse Rust error message
    if (error.includes('Validation error')) {
      // Show validation feedback
    } else if (error.includes('Database error')) {
      // Show database error
    } else if (error.includes('Invalid embedding dimensions')) {
      // Show embedding error
    }
  }
}
```

## Testing Contracts

### Unit Tests (Rust)

**Test File**: `src-tauri/src/commands/tests/rag_tests.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_upload_example_success() {
        // Test successful upload with valid inputs
    }

    #[tokio::test]
    async fn test_upload_example_invalid_dimensions() {
        // Test upload with wrong embedding size
    }

    #[tokio::test]
    async fn test_replace_example_not_found() {
        // Test replace with non-existent ID
    }

    #[tokio::test]
    async fn test_delete_bundled_example_rejected() {
        // Test that bundled examples cannot be deleted
    }

    #[tokio::test]
    async fn test_get_all_examples_empty_db() {
        // Test query on empty database returns []
    }
}
```

### Integration Tests (Frontend)

**Test File**: `tests/hooks/useExampleManagement.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { useExampleManagement } from '@/hooks/useExampleManagement'

vi.mock('@tauri-apps/api/core')

describe('useExampleManagement', () => {
  it('should fetch all examples', async () => {
    vi.mocked(invoke).mockResolvedValue([/* mock data */])

    const { result } = renderHook(() => useExampleManagement())

    await waitFor(() => {
      expect(result.current.examples).toHaveLength(2)
    })
  })

  it('should upload example successfully', async () => {
    vi.mocked(invoke).mockResolvedValue('new-id')

    const { result } = renderHook(() => useExampleManagement())

    await result.current.uploadExample(/* args */)

    expect(invoke).toHaveBeenCalledWith('upload_example', /* ... */)
  })
})
```

## Version History

- **v1.0.0** (2025-11-12): Initial contract definition
