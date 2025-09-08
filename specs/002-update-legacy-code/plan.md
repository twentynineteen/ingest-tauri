# Implementation Plan: Legacy useEffect to TanStack React Query Migration

**Branch**: `002-update-legacy-code` | **Date**: 2025-09-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-update-legacy-code/spec.md`

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
Migrate legacy useEffect data fetching patterns to TanStack React Query for improved caching, automatic refetching, loading states, and error handling across the Bucket video workflow application.

## Technical Context
**Language/Version**: TypeScript 5.7 with React 18.3  
**Primary Dependencies**: TanStack React Query 5.86.0, Tauri 2.0, Vite 6.3.5  
**Storage**: Tauri stronghold for secure storage, file system via Tauri plugins  
**Testing**: Jest + Testing Library  
**Target Platform**: Cross-platform desktop app (Tauri)
**Project Type**: single (Tauri app with React frontend)  
**Performance Goals**: Reduce redundant API calls, improve UI responsiveness  
**Constraints**: Maintain backward compatibility during transition, preserve existing workflows  
**Scale/Scope**: 15+ hook files with useEffect patterns, ~20 components affected

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Tauri desktop app) (max 3 ✓)
- Using framework directly? Yes (React Query directly, no wrapper classes)
- Single data model? Yes (existing data structures preserved)
- Avoiding patterns? Yes (no Repository/UoW, direct React Query usage)

**Architecture**:
- EVERY feature as library? This is a refactoring, preserving existing structure
- Libraries listed: Migration utilities, query key factories
- CLI per library: N/A for refactoring
- Library docs: Will update existing CLAUDE.md

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (tests first, then migrate)
- Git commits show tests before implementation? Will be enforced
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual Tauri APIs)
- Integration tests for: hook behavior changes, cache consistency
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Existing console logging preserved
- Frontend logs → backend? Via Tauri event system
- Error context sufficient? Enhanced with React Query error handling

**Versioning**:
- Version number assigned? 0.8.1 (BUILD increment)
- BUILD increments on every change? Yes
- Breaking changes handled? Migration strategy with gradual rollout

## Project Structure

### Documentation (this feature)
```
specs/002-update-legacy-code/
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
├── models/              # Data models and types
├── services/            # API services
├── hooks/               # Custom hooks (migration target)
├── components/          # React components
├── utils/               # Utility functions
└── lib/                 # React Query configuration

tests/
├── contract/            # API contract tests
├── integration/         # Hook integration tests
└── unit/                # Unit tests
```

**Structure Decision**: Option 1 (single Tauri desktop application)

## Phase 0: Outline & Research

Based on codebase analysis, I need to research:

1. **Current useEffect patterns**: Audit all existing useEffect usage for data fetching
2. **React Query best practices**: Migration strategies for existing patterns
3. **Cache invalidation strategies**: How to handle mutations and updates
4. **Error handling patterns**: Consistent error boundaries and retry logic
5. **Performance optimization**: Query key design and cache management

Research tasks identified:
- Analyze 15+ hook files with useEffect patterns
- Document current data fetching flows
- Research React Query migration patterns
- Design query key naming conventions
- Plan cache invalidation strategies

**Output**: research.md with migration strategy and patterns

## Phase 1: Design & Contracts

1. **Extract entities from codebase analysis** → `data-model.md`:
   - Query configurations for each data type
   - Cache invalidation rules
   - Loading state management
   - Error handling patterns

2. **Generate migration contracts** from functional requirements:
   - Hook migration signatures (before/after)
   - Query key specifications
   - Cache invalidation contracts
   - Error handling contracts

3. **Generate contract tests** from contracts:
   - Hook behavior tests (data fetching, caching, errors)
   - Cache consistency tests
   - Performance regression tests

4. **Extract test scenarios** from user stories:
   - Component mounting scenarios
   - Data staleness scenarios  
   - Error recovery scenarios
   - Network failure scenarios

5. **Update CLAUDE.md incrementally**:
   - Add React Query migration notes
   - Update hook usage patterns
   - Document new testing approaches

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md updates

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate migration tasks for each useEffect pattern found
- Each hook file → migration task [P] (parallel execution possible)
- Each component using migrated hooks → integration test task
- Performance validation tasks for caching behavior

**Ordering Strategy**:
- TDD order: Tests before migration
- Dependency order: Core hooks before dependent components
- Risk order: Low-risk migrations first, complex patterns last
- Mark [P] for parallel execution (independent hook files)

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

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
| N/A       | N/A        | N/A                                |

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
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*