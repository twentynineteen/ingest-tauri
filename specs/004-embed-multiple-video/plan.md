# Implementation Plan: Multiple Video Links and Trello Cards

**Branch**: `004-embed-multiple-video` | **Date**: 2025-09-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-embed-multiple-video/spec.md`
**User Context**: In the video links section in the found projects area in Baker, when adding a video, the user should be able to enter only the Sprout Video URL. The URL should be parsed for the video ID and the rest of the information retrieved via the API.

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

This feature enhances the breadcrumbs.json data model to support multiple video links and Trello cards per project, replacing the single-value approach. Users will be able to enter only a Sprout Video URL in the Baker interface, and the system will automatically parse the video ID and fetch metadata (title, thumbnail) from the Sprout Video API. The implementation focuses on URL parsing, API integration, and seamless UI updates.

## Technical Context
**Language/Version**: TypeScript 5.7 (frontend), Rust 1.75+ (backend)
**Primary Dependencies**: React 18.3, TanStack React Query, Tauri 2.0, reqwest (Rust HTTP client), serde (JSON parsing)
**Storage**: File system (breadcrumbs.json files in project directories)
**Testing**: Vitest (frontend), cargo test (backend)
**Target Platform**: Desktop (macOS, Windows, Linux via Tauri)
**Project Type**: Desktop application (Tauri = web frontend + Rust backend)
**Performance Goals**: <500ms for Sprout API fetches, <100ms for URL parsing
**Constraints**: Offline-capable for display (cached thumbnails), online-required for API fetches
**Scale/Scope**: ~20 videos max per project, ~10 Trello cards max per project, hundreds of projects per drive scan

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Tauri app with frontend + backend)
- Using framework directly? YES (React components, Tauri commands without wrappers)
- Single data model? YES (VideoLink and TrelloCard types shared between TS and Rust via serde)
- Avoiding patterns? YES (direct Tauri invoke, no Repository pattern - file system operations)

**Architecture**:
- EVERY feature as library? PARTIAL - Tauri commands act as library-like endpoints, reusable via hooks
- Libraries listed:
  - `useBreadcrumbsVideoLinks` - React Query hook for video link operations
  - `useSproutVideoApi` - NEW hook for parsing URLs and fetching Sprout API data
  - Rust baker module - breadcrumbs file operations
  - Rust media module - Sprout Video API integration
- CLI per library: N/A (desktop app, not CLI)
- Library docs: Component documentation in code comments

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES - tests written first for URL parsing and API integration
- Git commits show tests before implementation? YES - commit order will be verified
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? PARTIAL - actual file system, mocked Sprout API for tests (external service)
- Integration tests for: URL parsing, breadcrumbs updates, VideoLinksManager component
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES - Tauri backend logs, frontend error boundaries
- Frontend logs → backend? NO (not required for this feature)
- Error context sufficient? YES - API errors, validation errors with user-friendly messages

**Versioning**:
- Version number assigned? Phase 1 of feature 004
- BUILD increments on every change? YES - following SemVer
- Breaking changes handled? YES - backward compatible with existing breadcrumbs.json files

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Hybrid approach - Tauri app structure with frontend (src/) and backend (src-tauri/) separation. This is the standard Tauri pattern combining web frontend with Rust backend.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- New user requirement: URL parsing and API fetch for Sprout Video
- Key task areas:
  1. **URL Parsing** (TypeScript):
     - Write tests for `parseSproutVideoUrl` function
     - Implement URL parsing for public and embed URLs
     - Edge case handling (invalid formats, malformed URLs)
  2. **Tauri Command** (Rust):
     - Contract test for `fetch_sprout_video_details`
     - Implement Sprout Video API GET request
     - Error handling (network, 404, auth)
  3. **React Hook** (TypeScript):
     - Create `useSproutVideoApi` hook with TanStack React Query
     - Integration test with mocked API
  4. **UI Integration**:
     - Update VideoLinksManager to use URL fetch
     - Add loading states and error messages
     - Auto-populate form fields on successful fetch
     - Manual override capability

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order:
  1. URL parsing tests + implementation [P]
  2. Rust command contract test [P]
  3. Rust command implementation
  4. TypeScript hook tests [P]
  5. TypeScript hook implementation
  6. UI component integration
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md (includes new URL parsing/API fetch tasks)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - Added Sprout Video URL parsing and API fetch research
- [x] Phase 1: Design complete (/plan command) - Updated contracts with `fetch_sprout_video_details` command
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
  - No new violations introduced
  - URL parsing uses simple regex (no new libraries)
  - New Tauri command follows existing pattern
  - New hook follows TanStack React Query pattern
  - UI updates follow existing component patterns
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required - within constitutional limits)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*