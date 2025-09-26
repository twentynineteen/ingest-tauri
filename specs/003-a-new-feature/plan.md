# Implementation Plan: Baker

**Branch**: `003-a-new-feature` | **Date**: 2025-09-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-a-new-feature/spec.md`

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
Baker is a folder scanning and metadata management tool that integrates with the existing Tauri-based video workflow application. It scans drives for project folders matching the BuildProject structure, validates them, and updates or creates breadcrumbs.json files with current project metadata.

## Technical Context
**Language/Version**: TypeScript 5.7 (Frontend), Rust (Tauri Backend)  
**Primary Dependencies**: React 18.3, Tauri 2.0, TailwindCSS, Radix UI, Zustand  
**Storage**: Local filesystem via Tauri APIs (breadcrumbs.json files)  
**Testing**: Vitest + Testing Library (migrating from Jest)  
**Target Platform**: Desktop (macOS, Windows, Linux) via Tauri  
**Project Type**: Desktop application (Tauri hybrid)  
**Performance Goals**: Scan 1000+ folders per second, responsive UI during scans  
**Constraints**: Must not block UI thread, handle permission errors gracefully  
**Scale/Scope**: Scan entire drives (potentially TB+ of data), thousands of project folders

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Tauri desktop app with React frontend)
- Using framework directly? Yes (React, Tauri APIs, Zustand)
- Single data model? Yes (BreadcrumbsFile, ProjectFolder, ScanResult)
- Avoiding patterns? Yes (direct filesystem access via Tauri, no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? **DEVIATION**: Tauri desktop app structure with pages/hooks/services
- Libraries listed: N/A (Tauri app structure)
- CLI per library: N/A (Desktop GUI application)
- Library docs: N/A (GUI application with user manual)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (Vitest tests written first)
- Git commits show tests before implementation? Yes (required)
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual filesystem, real Tauri APIs)
- Integration tests for: new services, UI components, Tauri commands?
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes (console logging with structured data)
- Frontend logs → backend? Yes (Tauri logging integration)
- Error context sufficient? Yes (error boundaries, detailed error messages)

**Versioning**:
- Version number assigned? Yes (part of Tauri app versioning)
- BUILD increments on every change? Yes (follows Tauri release cycle)
- Breaking changes handled? Yes (migration for breadcrumbs.json changes)

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

**Structure Decision**: Tauri desktop application structure (src/ with pages, hooks, services, components)

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
- **Tauri Commands**: baker_start_scan, baker_get_scan_status, baker_cancel_scan, baker_validate_folder, baker_read_breadcrumbs, baker_update_breadcrumbs
- **Frontend Components**: BakerPage, ScanProgress, ProjectResults, BatchActions
- **Custom Hooks**: useBakerScan, useBreadcrumbsManager, useBakerPreferences
- **Data Models**: ProjectFolder, BreadcrumbsFile, ScanResult types
- **Integration**: Add Baker to navigation sidebar and routing

**Ordering Strategy** (TDD order):
1. **Contract Tests**: Tauri command interfaces [P]
2. **Data Model Tests**: TypeScript type validation [P] 
3. **Backend Implementation**: Rust Tauri commands
4. **Hook Tests**: Custom React hooks for scan management
5. **Hook Implementation**: useBakerScan, useBreadcrumbsManager
6. **Component Tests**: UI component testing with mock data
7. **Component Implementation**: BakerPage, ScanProgress, etc.
8. **Integration Tests**: End-to-end workflow testing
9. **Navigation Integration**: Add to sidebar and routing

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

**Key Dependencies**:
- Existing FolderSelector component (reuse)
- Existing ProgressBar patterns
- Breadcrumbs navigation system  
- Tauri filesystem APIs

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
| Non-library architecture | Tauri desktop app requires page/component structure | Library-first pattern incompatible with GUI desktop applications |
| No CLI interface | Desktop GUI application | CLI interface not applicable to visual workflow tools |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, CLAUDE.md updated
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (with documented deviations)
- [x] Post-Design Constitution Check: PASS 
- [x] All NEEDS CLARIFICATION resolved in research.md
- [x] Complexity deviations documented (non-library architecture justified)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*