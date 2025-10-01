# Implementation Plan: Video Upload Toggle for Video Links

**Branch**: `004-embed-multiple-video` | **Date**: 2025-09-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-embed-multiple-video/spec.md`

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
Enhance the VideoLinksManager component to allow users to upload videos directly through a toggle interface (similar to the TrelloCardsManager), rather than only supporting URL entry. This provides a seamless workflow: users can either paste an existing Sprout Video URL OR upload a video file directly from their filesystem (defaulting to the project's Renders/ folder). The upload logic from UploadSprout.tsx will be adapted and integrated into the VideoLinksManager dialog.

## Technical Context
**Language/Version**: TypeScript 5.7, React 18.3, Rust 1.75 (Tauri backend)
**Primary Dependencies**: React, Tauri 2.0, TanStack React Query, ShadCN/Radix UI, Sprout Video API
**Storage**: Local JSON files (breadcrumbs.json), Sprout Video cloud storage
**Testing**: Vitest + React Testing Library
**Target Platform**: Desktop (macOS/Windows/Linux) via Tauri
**Project Type**: Desktop application (Tauri frontend + Rust backend)
**Performance Goals**: Upload progress tracking with <500ms UI response time, support videos up to 5GB
**Constraints**: Desktop file access via Tauri dialogs, Sprout Video API rate limits, breadcrumbs file <100KB
**Scale/Scope**: Single-user desktop app, ~20 video links per project, file operations via Tauri commands
**User Requirements**: Just like TrelloCardsManager has URL/Select toggle, VideoLinksManager needs URL/Upload toggle referencing UploadSprout.tsx upload logic

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Tauri desktop app with src/ and src-tauri/)
- Using framework directly? YES (React, TanStack Query, ShadCN components used directly)
- Single data model? YES (VideoLink model already defined in data-model.md, no DTOs needed)
- Avoiding patterns? YES (No Repository pattern, direct Tauri command invocations)

**Architecture**:
- EVERY feature as library? NO - This is a UI enhancement within existing component structure
- Libraries listed: N/A - Using existing hooks (useFileUpload, useUploadEvents) from UploadSprout
- CLI per library: N/A - Desktop GUI application
- Library docs: N/A - Internal UI component

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES (will write component tests first)
- Git commits show tests before implementation? YES (following TDD workflow)
- Order: Contract→Integration→E2E→Unit strictly followed? YES (contract tests for Tauri upload command exist, will add component integration tests)
- Real dependencies used? YES (actual Sprout Video API via existing Tauri commands)
- Integration tests for: New UI component behavior, upload dialog state transitions, error handling
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES (Tauri backend has structured logging, frontend uses console with error context)
- Frontend logs → backend? YES (errors from Tauri commands propagate to frontend with context)
- Error context sufficient? YES (upload progress events, Sprout API errors captured and displayed)

**Versioning**:
- Version number assigned? Feature 004 (part of existing MAJOR.MINOR.BUILD cycle)
- BUILD increments on every change? YES (following existing project versioning)
- Breaking changes handled? NO BREAKING CHANGES (additive feature, backward compatible with existing VideoLinksManager)

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

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

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
- Load Phase 1 outputs: contracts/tauri-commands.md, quickstart.md, research.md
- Generate tasks from UI component contracts (VideoLinksManager enhancement)
- Focus on additive feature: upload tab in existing dialog
- Reuse existing hooks and commands (useFileUpload, useUploadEvents, upload_video)

**Key Task Categories**:
1. **Component Tests** (TDD - write first):
   - Test tab switching between URL and Upload modes
   - Test file selection opens with correct default path
   - Test upload button disabled states
   - Test progress bar updates during upload
   - Test successful upload auto-adds VideoLink
   - Test error states and retry logic
   - Test dialog cleanup on close/tab switch

2. **UI Implementation**:
   - Add Tabs component to VideoLinksManager dialog
   - Wrap existing URL form in TabsContent
   - Create Upload tab with file selection and progress UI
   - Integrate useFileUpload and useUploadEvents hooks
   - Implement createVideoLinkFromUpload helper function
   - Add event handlers for upload workflow
   - Implement state cleanup on tab switch/dialog close

3. **Integration Testing**:
   - End-to-end test: Select file → Upload → Add to breadcrumbs
   - Verify breadcrumbs.json updated with correct VideoLink
   - Verify Baker preview shows uploaded video

**Ordering Strategy** (TDD-first):
1. Write component tests (RED phase) [P]
2. Implement upload tab UI structure
3. Integrate upload hooks
4. Implement helper functions
5. Run tests, iterate to GREEN phase
6. Integration tests
7. Manual testing via quickstart.md

**Estimated Output**: 10-12 focused tasks (smaller scope than full feature, focused on UI enhancement)

**Parallel Execution Opportunities**:
- Test writing can happen in parallel with design review [P]
- UI structure and helper functions independent [P]
- Error handling tests can be written in parallel with happy path tests [P]

**Dependencies**:
- Existing hooks: useFileUpload, useUploadEvents (already implemented)
- Existing Tauri command: upload_video (already implemented)
- Existing components: Tabs, Button, Progress, Alert (ShadCN UI)
- Existing validation: validateVideoLink function

**Risk Mitigation**:
- Start with tests to catch integration issues early
- Manual testing with quickstart.md before marking complete
- Verify upload state cleanup to prevent memory leaks

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
- [x] Phase 0: Research complete (/plan command)
  - research.md updated with Section 7: Video Upload Toggle Enhancement
  - All implementation patterns researched (Tabs component, hooks reuse, upload workflow)
  - No new NEEDS CLARIFICATION items
- [x] Phase 1: Design complete (/plan command)
  - contracts/tauri-commands.md enhanced with UI Component Patterns section
  - quickstart.md updated with upload workflow (Workflow 1 steps 1-8)
  - quickstart.md error handling updated (Workflow 6 steps 2-4)
  - data-model.md unchanged (VideoLink already defined, no new fields needed)
- [x] Phase 2: Task planning approach described (/plan command)
  - TDD-first strategy defined (10-12 focused tasks)
  - Dependencies identified (existing hooks, commands, components)
  - Parallel execution opportunities marked
  - Risk mitigation strategy documented
- [ ] Phase 3: Tasks generated (/tasks command - NOT done by /plan)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
  - Simplicity: 1 project, using frameworks directly, no new patterns
  - Architecture: UI enhancement within existing component structure
  - Testing: TDD enforced, test-first workflow planned
  - Observability: Existing logging sufficient
  - Versioning: Feature 004 enhancement, no breaking changes
- [x] Post-Design Constitution Check: PASS
  - No complexity deviations introduced
  - Reusing existing hooks and commands (DRY principle)
  - Additive feature, backward compatible
- [x] All NEEDS CLARIFICATION resolved
  - No new unknowns introduced in enhancement
  - All research findings documented in research.md Section 7
- [x] Complexity deviations documented
  - N/A - No deviations from constitutional principles

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*