# Phase 0: Research & Technical Decisions

**Feature**: AI Script Example Embedding Management
**Date**: 2025-11-12
**Status**: Complete

## Executive Summary

The feature integrates with an existing RAG (Retrieval-Augmented Generation) system that uses:
- **Build-time embedding generation** (`npm run embed:examples`)
- **SQLite database** for storage (`src-tauri/resources/embeddings/examples.db`)
- **Xenova Transformers** for embeddings (model: `all-MiniLM-L6-v2`)
- **Tauri commands** for frontend-backend communication
- **React hooks** for state management and data fetching

The new feature adds runtime CRUD operations for managing these examples through a UI.

## Research Areas

### 1. Existing RAG System Architecture

**Current Implementation**:
- **Build-time Process** ([scripts/embed-examples.js](../../scripts/embed-examples.js)):
  - Scans `src-tauri/resources/examples/` for example folders
  - Each folder contains: `before.txt`, `after.txt`, `metadata.json`
  - Generates embeddings using Xenova `all-MiniLM-L6-v2` model
  - Stores in SQLite database with schema:
    - `example_scripts` table: id, title, category, before_text, after_text, tags, word_count, quality_score
    - `embeddings` table: script_id, embedding (BLOB), dimension

- **Runtime Retrieval** ([src-tauri/src/commands/rag.rs](../../src-tauri/src/commands/rag.rs)):
  - `search_similar_scripts`: Cosine similarity search
  - `get_example_by_id`: Fetch specific example
  - `get_all_examples`: List all examples (exists!)

- **Frontend Integration**:
  - `useEmbedding`: Client-side embedding generation
  - `useScriptRetrieval`: TanStack Query wrapper for similarity search
  - `useScriptProcessor`: Orchestrates RAG-enhanced formatting

**Decision**: Extend existing `rag.rs` commands rather than create new module
**Rationale**: Maintains consistency, reuses database connection logic, keeps related code together
**Alternatives Considered**: Separate module → Rejected (unnecessary complexity)

### 2. Database Schema & Access Patterns

**Current Schema** (established by embed-examples.js):
```sql
CREATE TABLE example_scripts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  before_text TEXT NOT NULL,
  after_text TEXT NOT NULL,
  tags TEXT,
  word_count INTEGER,
  quality_score INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE embeddings (
  script_id TEXT PRIMARY KEY,
  embedding BLOB NOT NULL,
  dimension INTEGER NOT NULL,
  FOREIGN KEY(script_id) REFERENCES example_scripts(id)
);

CREATE INDEX idx_category ON example_scripts(category);
CREATE INDEX idx_quality ON example_scripts(quality_score);
```

**New Requirements**:
- Distinguish bundled vs user-uploaded examples
- Track upload timestamp for user examples
- Support soft delete or permanent delete

**Decision**: Add `source` column to `example_scripts` table
**Schema Change**:
```sql
ALTER TABLE example_scripts ADD COLUMN source TEXT DEFAULT 'bundled';
-- Values: 'bundled' | 'user-uploaded'
```

**Rationale**: Minimal schema change, supports filtering, backward compatible (defaults to 'bundled')
**Alternatives Considered**:
- Separate table for user examples → Rejected (duplication, complex queries)
- Use ID prefix (e.g., "user-001") → Rejected (brittle, harder to query)

### 3. File Upload Handling in Tauri

**Tauri Capabilities**:
- **Dialog Plugin**: `@tauri-apps/plugin-dialog` for file picker
- **FS Plugin**: `@tauri-apps/plugin-fs` for file operations
- **Path Resolution**: `app.path().resourceDir()` for database location

**Upload Workflow**:
1. Frontend: User clicks "Upload" → Opens file dialog
2. Frontend: User selects .txt file → Gets file path
3. Frontend: Calls Tauri command with path + metadata
4. Backend: Validates file (size, encoding, format)
5. Backend: Reads file content
6. Backend: Generates embedding using pre-existing logic
7. Backend: Inserts into database (both tables)
8. Backend: Returns success + new example ID
9. Frontend: Refetches example list (TanStack Query invalidation)

**Decision**: Use Tauri dialog plugin for file selection, backend handles all processing
**Rationale**: Follows existing pattern (ScriptFormatter uses similar workflow), keeps business logic in Rust
**Alternatives Considered**:
- Frontend file reading → Rejected (embedding generation requires backend anyway)
- Drag-and-drop upload → Deferred (future enhancement)

### 4. Embedding Generation Workflow

**Build-time Process** (scripts/embed-examples.js):
```javascript
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
const output = await embedder(text, { pooling: 'mean', normalize: true })
const embedding = Array.from(output.data) // Float32Array → Array
```

**Runtime Requirement**:
- Same embedding model must be used for consistency
- Embeddings must be comparable (same dimensions, normalization)

**Challenge**: Xenova Transformers is JavaScript library, backend is Rust

**Decision**: Use frontend embedding generation, pass to backend
**Implementation**:
1. Frontend: `useEmbedding` hook generates embedding from file content
2. Frontend: Sends embedding + metadata + text to backend
3. Backend: Validates dimensions (384 for all-MiniLM-L6-v2)
4. Backend: Stores in database

**Rationale**:
- Reuses existing `useEmbedding` hook (already loaded, tested)
- Avoids Rust ML dependencies (heavy, complex)
- Consistent with current architecture (frontend generates embeddings for search too)

**Alternatives Considered**:
- Rust ML library (tract, burn) → Rejected (added complexity, different results)
- Spawn Node.js process from Rust → Rejected (fragile, resource-heavy)

### 5. UI Component Architecture

**Existing Patterns** (from ScriptFormatter):
- Page component in `src/pages/AI/[Feature]/`
- Sub-components co-located with page
- TanStack Query for data fetching
- Radix UI primitives for dialogs, buttons
- Lucide icons for UI elements

**New Page Structure**:
```
src/pages/AI/ExampleEmbeddings/
├── ExampleEmbeddings.tsx       # Main page (breadcrumb, layout, state)
├── ExampleList.tsx             # Grid/list view of examples
├── ExampleCard.tsx             # Individual card (preview, actions)
├── UploadDialog.tsx            # Modal for upload (file picker, metadata form)
└── DeleteConfirm.tsx           # Confirmation dialog
```

**Decision**: Follow established page component pattern
**Rationale**: Consistency with codebase, familiar structure for developers
**Alternatives Considered**: Single-file component → Rejected (poor maintainability at scale)

### 6. State Management Strategy

**Existing Patterns**:
- TanStack Query for server state (caching, invalidation, refetching)
- React hooks (useState) for local UI state
- No global state needed for this feature

**Feature State Needs**:
- Example list (server state via TanStack Query)
- Upload dialog open/closed (local state)
- Selected example for replace/delete (local state)

**Decision**: TanStack Query + local React state
**Query Keys**:
```typescript
['examples', 'list']           // All examples
['examples', 'detail', id]     // Single example (if needed)
```

**Mutations**:
```typescript
useMutation({
  mutationFn: uploadExample,
  onSuccess: () => queryClient.invalidateQueries(['examples', 'list'])
})
```

**Rationale**: Standard React Query pattern, auto-refetching on mutations, cache management
**Alternatives Considered**: Zustand store → Rejected (overkill for simple CRUD)

## Technical Decisions Summary

| Decision Point | Choice | Rationale |
|---------------|--------|-----------|
| **Backend Module** | Extend existing `rag.rs` | Code cohesion, reuse connection logic |
| **Database Schema** | Add `source` column | Minimal change, backward compatible |
| **File Upload** | Tauri dialog plugin | Established pattern in codebase |
| **Embedding Generation** | Frontend (useEmbedding hook) | Reuse existing, avoid Rust ML deps |
| **Component Architecture** | Co-located page components | Consistency with ScriptFormatter |
| **State Management** | TanStack Query + React state | Standard pattern, automatic cache invalidation |

## Integration Points

### With Existing System

1. **Database**: Same `examples.db`, extended schema
2. **Embeddings**: Same model (`all-MiniLM-L6-v2`), same dimensions (384)
3. **Tauri Commands**: New commands in existing `rag.rs` module
4. **Frontend Hooks**: New hooks follow existing patterns

### New Capabilities Required

1. **Tauri Commands** (in `src-tauri/src/commands/rag.rs`):
   - `upload_example(content: String, metadata: ExampleMetadata, embedding: Vec<f32>) -> Result<String, String>`
   - `update_example(id: String, content: String, embedding: Vec<f32>) -> Result<(), String>`
   - `delete_example(id: String) -> Result<(), String>`

2. **Frontend Hooks** (new files):
   - `useExampleManagement.ts`: CRUD operations with TanStack Query
   - `useFileUpload.ts`: File dialog, content reading, validation

3. **UI Components** (new page):
   - `ExampleEmbeddings.tsx` and sub-components

## Performance Considerations

**Embedding Generation**:
- Model load time: ~2-5s first time (cached after)
- Embedding generation: ~100-500ms per script
- UI feedback: Progress spinner during generation

**Database Operations**:
- Queries: <10ms (indexed)
- Inserts: <50ms (single row, BLOB)
- Deletes: <10ms

**File Upload**:
- Validation: <10ms
- Reading: <50ms for typical scripts (<100KB)
- Total UX: <5s end-to-end for upload

## Security & Validation

**File Validation**:
- File extension: `.txt` only
- File size: <1MB limit
- Encoding: UTF-8 validation
- Content: Non-empty, reasonable length (>50 chars, <100k chars)

**SQL Injection Prevention**:
- Use parameterized queries (rusqlite `params!`)
- No string concatenation for SQL

**XSS Prevention**:
- React auto-escapes text content
- No `dangerouslySetInnerHTML` usage

## Testing Strategy

**Backend Tests** (Rust):
- Unit tests for embedding validation
- Integration tests with test database
- Test data isolation (in-memory SQLite)

**Frontend Tests** (Vitest + Testing Library):
- Component rendering tests
- User interaction tests (upload, delete, replace)
- Hook tests (mocked Tauri commands)

**E2E Tests** (Manual QA):
- Full workflow: Upload → Verify in list → Use in formatter → Delete
- Edge cases: Large files, special characters, duplicate titles

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Embedding dimension mismatch | Search fails | Validate dimensions in upload command |
| Database migration failure | Data loss | Test migration with bundled examples first |
| Large file uploads | UI freeze | File size validation, async processing |
| Duplicate IDs | Database error | Use UUIDs for user-uploaded examples |

## Open Questions & Future Work

**Deferred to Future Phases**:
- [ ] Bulk upload (multiple files)
- [ ] Example categories/tags UI filtering
- [ ] Export examples to files
- [ ] Example versioning (track changes)
- [ ] Sharing examples between users (future if multi-user)

**Answered**:
- ✅ Build-time embedding process still works? Yes, no changes needed
- ✅ User examples persist after app restart? Yes, in SQLite database
- ✅ User examples included in search? Yes, `get_all_examples` returns all

## References

- [Existing RAG Implementation](../../src-tauri/src/commands/rag.rs)
- [Build-time Embedding Script](../../scripts/embed-examples.js)
- [Frontend Embedding Hook](../../src/hooks/useEmbedding.ts)
- [ScriptFormatter Page](../../src/pages/AI/ScriptFormatter/ScriptFormatter.tsx)
- [Tauri Dialog Plugin Docs](https://v2.tauri.app/plugin/dialog/)
- [Xenova Transformers Docs](https://huggingface.co/docs/transformers.js)
