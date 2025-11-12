# Implementation Plan: AI Script Example Embedding Management

**Branch**: `007-frontend-script-example` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-frontend-script-example/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✅
   → Loaded successfully
2. Fill Technical Context ✅
   → Project Type: Web application (Tauri desktop app with React frontend + Rust backend)
   → Structure Decision: Frontend/Backend split (src/ for React, src-tauri/ for Rust)
3. Evaluate Constitution Check section below ✅
   → No violations detected
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md ⏳
   → Research existing RAG system implementation
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ⏳
6. Re-evaluate Constitution Check section ⏳
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach ⏳
8. STOP - Ready for /tasks command
```

## Summary
Build a frontend UI page in the AI Tools section that allows users to manage script example embeddings for the RAG system. Users can view all embedded examples (both bundled defaults and user-uploaded), upload new script files to add to the embeddings database, replace existing examples, and remove examples. The system integrates with the existing RAG infrastructure (SQLite database, Xenova embeddings, build-time embedding generation) to provide CRUD operations for script examples.

## Technical Context
**Language/Version**: TypeScript 5.7 (frontend), Rust (Tauri 2.0 backend)
**Primary Dependencies**:
- Frontend: React 18.3, TanStack Query, Zustand, @xenova/transformers
- Backend: rusqlite, serde, tokio
**Storage**: SQLite database at `src-tauri/resources/embeddings/examples.db`
**Testing**: Vitest + Testing Library (frontend), cargo test (backend)
**Target Platform**: Desktop (macOS, Windows, Linux) via Tauri
**Project Type**: Web (React frontend + Rust backend)
**Performance Goals**: File upload processing <5s for typical script files, UI responsiveness <100ms
**Constraints**:
- Embeddings database must remain accessible at runtime (not just build-time)
- Build-time embedding process must continue to work (`npm run embed:examples`)
- No breaking changes to existing `search_similar_scripts` command
**Scale/Scope**:
- Expected 10-50 bundled examples
- User-uploaded examples: 0-100 per user
- Database size: <50MB typical

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend React app, backend Tauri Rust) ✅
- Using framework directly? Yes (React components, Tauri commands) ✅
- Single data model? Yes (SimilarExample type shared between frontend/backend) ✅
- Avoiding patterns? Yes (direct database access via existing rusqlite connection) ✅

**Architecture**:
- EVERY feature as library? N/A (Tauri desktop app structure, not library-based architecture)
- Libraries listed: N/A (using existing hooks pattern: useEmbedding, useScriptRetrieval)
- CLI per library: N/A (desktop app with GUI)
- Library docs: N/A (using existing documentation patterns in CLAUDE.md)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES - tests written first ✅
- Git commits show tests before implementation? Will be verified ✅
- Order: Contract→Integration→E2E→Unit strictly followed? YES ✅
- Real dependencies used? YES (actual SQLite database, file system) ✅
- Integration tests for: new Tauri commands, database operations, file uploads ✅
- FORBIDDEN: Implementation before test, skipping RED phase ✅

**Observability**:
- Structured logging included? YES (console.log with context tags) ✅
- Frontend logs → backend? N/A (desktop app, logs to console)
- Error context sufficient? YES (Error objects with descriptive messages) ✅

**Versioning**:
- Version number assigned? 0.8.6 (existing app version) ✅
- BUILD increments on every change? Will increment to 0.8.7 ✅
- Breaking changes handled? N/A (additive feature, no breaking changes)

## Project Structure

### Documentation (this feature)
```
specs/007-frontend-script-example/
├── plan.md              # This file (/plan command output)
├── spec.md              # Feature specification (already exists)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── tauri-commands.md     # Tauri command signatures
│   └── react-components.md   # Component props interfaces
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── pages/AI/
│   ├── ScriptFormatter/           # Existing
│   └── ExampleEmbeddings/         # NEW - Feature page
│       ├── ExampleEmbeddings.tsx  # Main page component
│       ├── ExampleList.tsx        # List view with actions
│       ├── ExampleCard.tsx        # Individual example card
│       ├── UploadDialog.tsx       # File upload modal
│       └── DeleteConfirm.tsx      # Delete confirmation dialog
├── hooks/
│   ├── useEmbedding.ts            # Existing
│   ├── useScriptRetrieval.ts      # Existing
│   ├── useExampleManagement.ts    # NEW - CRUD operations
│   └── useFileUpload.ts           # NEW - File handling
└── types/
    └── scriptFormatter.ts         # Extend with new types

src-tauri/src/commands/
├── rag.rs                         # Extend with new commands
└── file_ops.rs                    # Existing (file validation)

tests/                             # Frontend tests
└── pages/AI/ExampleEmbeddings/

src-tauri/src/commands/tests/      # Backend tests
└── rag_tests.rs
```

**Structure Decision**: Tauri desktop app structure (React frontend in `src/`, Rust backend in `src-tauri/`)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**: All technical context is clear, no NEEDS CLARIFICATION

2. **Research areas**:
   - ✅ Existing RAG system architecture (already researched)
   - Database schema for embeddings (example_scripts + embeddings tables)
   - Build-time vs runtime database access patterns
   - File upload handling in Tauri (using dialog plugin)
   - Embedding generation workflow (Xenova transformers)

3. **Consolidate findings** in `research.md`

**Output**: research.md with architecture decisions and integration patterns

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - ExampleMetadata: User-facing example metadata
   - UploadedExample: User-uploaded script with metadata
   - EmbeddingRecord: Database representation
   - Validation rules: file size limits, text format requirements

2. **Generate API contracts** from functional requirements:
   - Tauri Commands:
     - `get_all_examples()` → List all examples
     - `upload_example(file_path, metadata)` → Add new example
     - `replace_example(id, file_path)` → Replace existing
     - `delete_example(id)` → Remove example
   - React Component Props:
     - ExampleEmbeddings page (no props)
     - ExampleList (examples, onDelete, onReplace)
     - UploadDialog (open, onClose, onUpload)
   - Output contracts to `/contracts/`

3. **Generate contract tests** from contracts:
   - Rust: Test each Tauri command with test database
   - React: Test component rendering and user interactions
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Upload new example → appears in list
   - Replace example → old removed, new appears
   - Delete example → removed from list
   - View bundled defaults → visible on first load

5. **Update CLAUDE.md incrementally**:
   - Add new page location: `src/pages/AI/ExampleEmbeddings/`
   - Add new hooks: `useExampleManagement`, `useFileUpload`
   - Add Tauri commands for example management
   - Document integration with existing RAG system

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md updated

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs
- Each Tauri command → contract test task [P] + implementation task
- Each React component → component test task [P] + implementation task
- Integration tests for full workflows (upload → embed → list)
- UI/UX tasks for page layout, routing, navigation

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order:
  1. Backend (Tauri commands + tests)
  2. Hooks (data fetching logic + tests)
  3. Components (UI + tests)
  4. Page integration
  5. Routing/navigation
- Mark [P] for parallel execution: independent Tauri commands, independent components

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md
- Backend: 10 tasks (4 commands × 2 each + database schema + integration)
- Hooks: 6 tasks (2 hooks × 3 each)
- Components: 12 tasks (5 components × 2-3 each)
- Integration: 4 tasks (routing, navigation, E2E tests, documentation)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD)
**Phase 5**: Validation (Vitest tests, cargo test, manual QA)

## Complexity Tracking
*No constitutional violations - table not needed*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved (none present) ✅
- [x] Complexity deviations documented (none present) ✅

**Artifacts Generated**:
- [x] research.md - Technical decisions and integration patterns
- [x] data-model.md - Entity definitions and database schema
- [x] contracts/tauri-commands.md - Backend command signatures
- [x] contracts/react-components.md - Frontend component interfaces
- [x] quickstart.md - End-to-end user workflows and QA checklist

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
