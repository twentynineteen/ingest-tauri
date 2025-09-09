# Implementation Plan: Package Updates and Security Vulnerability Resolution

**Branch**: `003-update-all-used` | **Date**: 2025-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/dan_1/Documents/VSCODE/ingest-tauri/specs/003-update-all-used/spec.md`

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
Update all project dependencies to latest secure versions, remove unused packages, and migrate from Jest to Vitest testing framework while maintaining dual Bun/npm tooling compatibility for the Tauri-based desktop video editing application.

## Technical Context
**Language/Version**: TypeScript 5.9 + React 19.1 (Frontend), Rust (Tauri Backend)  
**Primary Dependencies**: Tauri 2.8, Vite 7.1, React 19.1, Radix UI, TanStack Query, Vitest 3.2  
**Storage**: Tauri Stronghold (secure storage), Local filesystem via Tauri plugins  
**Testing**: Currently Jest 30.1 + Vitest 3.2 (migrate to Vitest only)  
**Target Platform**: Cross-platform desktop (macOS, Windows, Linux)
**Project Type**: Single project (Tauri hybrid with Rust backend + React frontend)  
**Performance Goals**: Desktop application performance, secure dependency management  
**Constraints**: Dual package manager support (Bun primary, npm compatibility), security-first updates  
**Scale/Scope**: Desktop application with ~110 dependencies across dev/runtime packages

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Tauri hybrid app with dependency management tooling)
- Using framework directly? ✅ Yes (direct npm/bun commands, no wrappers)
- Single data model? ✅ Yes (dependency metadata only)
- Avoiding patterns? ✅ Yes (direct package manager usage, no abstraction layers)

**Architecture**:
- EVERY feature as library? ❌ N/A (Infrastructure maintenance, not feature development)
- Libraries listed: N/A (dependency management tooling)
- CLI per library: ✅ Yes (npm/bun CLI commands with standard flags)
- Library docs: N/A (using standard package manager documentation)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✅ Yes (tests for dependency validation)
- Git commits show tests before implementation? ✅ Yes (test suite validation first)
- Order: Contract→Integration→E2E→Unit strictly followed? ✅ Yes
- Real dependencies used? ✅ Yes (actual package registries, real audit tools)
- Integration tests for: dependency updates, Jest→Vitest migration, dual package manager support
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? ✅ Yes (audit reports, update logs)
- Frontend logs → backend? N/A (tooling operation)
- Error context sufficient? ✅ Yes (package manager error reporting)

**Versioning**:
- Version number assigned? ✅ Yes (0.8.0 → 0.8.1, BUILD increment)
- BUILD increments on every change? ✅ Yes
- Breaking changes handled? ✅ Yes (separate tasks for breaking change resolution)

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

**Structure Decision**: Option 1 (Single project) - Tauri hybrid architecture with existing src/ and src-tauri/ structure

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
- Security audit contract → audit integration tests [P]
- Dependency scanning contract → scanning tests [P] 
- Update execution contract → update validation tests [P]
- Jest→Vitest migration contract → migration tests [P]
- Each data entity → validation tests [P]
- Implementation tasks to make all tests pass

**Ordering Strategy**:
- TDD order: Tests first, then implementation
- Security-first order: Audit and vulnerability fixes before feature updates
- Dependency order: 
  1. Security audit and fixes
  2. Package scanning and analysis  
  3. Jest→Vitest migration (isolated)
  4. Unused package removal
  5. Version updates (minor then major)
  6. Breaking change resolution (separate tasks)
- Mark [P] for parallel execution (independent operations)

**Estimated Task Categories**:
- Contract tests: 5 tasks (audit, scan, update, migrate, remove)
- Integration tests: 4 tasks (package managers, lock files, build validation)
- Implementation: 12-15 tasks (ordered by dependency risk)
- Validation: 3-4 tasks (final testing, rollback procedures)

**Total Estimated Output**: 24-28 numbered, ordered tasks in tasks.md

**Breaking Change Handling**:
- Separate feature branches for packages with breaking changes
- Each breaking change → dedicated task with migration steps
- Parallel resolution tracks to avoid blocking main updates

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
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no deviations)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*