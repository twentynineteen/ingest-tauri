# Implementation Plan: BuildProject Trello Cards Array Migration

**Branch**: `004-embed-multiple-video` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)
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

Migrate BuildProject from legacy single Trello card storage (`trelloCardUrl`) to array-based storage (`trelloCards[]`) matching Baker's implementation. Replace `TrelloIntegrationModal` with Baker's `TrelloCardsManager` component to support multiple Trello cards per project, enabling users to link pre-production, production, and post-production cards to a single project.

**User Context**: @src/pages/Baker/ has a robust method of linking Trello cards which stores them in an array inside of breadcrumbs.json. Update @src/pages/BuildProject/ to link the Trello cards to the array instead of the separate trello card url - which is no longer required.

## Technical Context
**Language/Version**: TypeScript 5.7, Rust 1.75 (Tauri 2.0 backend)
**Primary Dependencies**: React 18.3, TanStack React Query, @radix-ui/react-tabs, Tauri plugins
**Storage**: JSON files (breadcrumbs.json in project directories)
**Testing**: Vitest + Testing Library (migrating from Jest)
**Target Platform**: macOS desktop (Tauri cross-platform app)
**Project Type**: Desktop application (Tauri frontend + Rust backend)
**Performance Goals**: Sub-second file I/O, smooth UI updates during breadcrumbs modifications
**Constraints**: Backward compatibility with existing breadcrumbs.json files (preserve `trelloCardUrl` field)
**Scale/Scope**: ~10-50 projects per user, 1-10 Trello cards per project, small JSON file operations

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Desktop app with Tauri frontend + backend) ✅
- Using framework directly? YES - React/Tauri without wrappers ✅
- Single data model? YES - BreadcrumbsFile struct used across frontend/backend ✅
- Avoiding patterns? YES - Direct component reuse, no new abstractions ✅

**Architecture**:
- EVERY feature as library? N/A - Desktop app, not library architecture
- Component reuse: Reusing Baker's TrelloCardsManager & VideoLinksManager ✅
- Hooks documented: useBreadcrumbsTrelloCards, useBreadcrumbsVideoLinks documented in code ✅

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES - Contract tests exist, will extend ✅
- Git commits show tests before implementation? YES - Following TDD workflow ✅
- Order: Contract→Integration→E2E→Unit strictly followed? YES ✅
- Real dependencies used? YES - Real file system, actual breadcrumbs.json files ✅
- Integration tests for: Component integration with existing Baker commands ✅
- FORBIDDEN: Implementation before test ✅

**Observability**:
- Structured logging included? YES - Tauri backend logs via tracing crate ✅
- Frontend logs → backend? N/A - Desktop app, shared console ✅
- Error context sufficient? YES - TanStack Query error boundaries + Tauri error propagation ✅

**Versioning**:
- Version number assigned? 0.8.3 (existing, will increment BUILD) ✅
- BUILD increments on every change? YES - Following semver ✅
- Breaking changes handled? YES - Backward compatibility via optional fields ✅

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

**Structure Decision**: Tauri desktop application structure (frontend `src/` + backend `src-tauri/src/`)

## Phase 0: Outline & Research ✅ COMPLETE

**Research Findings** (see [research.md](./research.md)):

1. ✅ **Baker Component Analysis**: TrelloCardsManager and VideoLinksManager are generic, reusable components
2. ✅ **Data Model Compatibility**: TypeScript/Rust types already defined for trelloCards[] array
3. ✅ **Backend Commands**: baker_* Tauri commands exist and functional for breadcrumbs operations
4. ✅ **UI Pattern**: Radix UI Tabs component (@radix-ui/react-tabs already installed)
5. ✅ **Backward Compatibility**: Optional field pattern preserves legacy trelloCardUrl field
6. ✅ **Migration Strategy**: Replace TrelloIntegrationModal with TrelloCardsManager component

**Key Decision**: Reuse Baker components directly without modification - they are project-path aware and generic.

**Output**: research.md complete with BuildProject-specific implementation findings

## Phase 1: Design & Contracts ✅ COMPLETE
*Prerequisites: research.md complete*

**Completed Artifacts**:

1. ✅ **data-model.md**: Comprehensive entity definitions
   - `VideoLink`: URL, sproutVideoId, title, thumbnailUrl, uploadDate, sourceRenderFile
   - `TrelloCard`: URL, cardId, title, boardName, lastFetched
   - `BreadcrumbsFile`: Enhanced with videoLinks[] and trelloCards[] arrays
   - Validation rules, state transitions, backward compatibility notes

2. ✅ **contracts/tauri-commands.md**: Tauri command API contracts
   - `baker_associate_video_link` - Add video to breadcrumbs
   - `baker_remove_video_link` - Remove video by index
   - `baker_reorder_video_links` - Reorder videos
   - `baker_get_video_links` - Retrieve all videos
   - `baker_associate_trello_card` - Add Trello card
   - `baker_remove_trello_card` - Remove card by index
   - `baker_get_trello_cards` - Retrieve all cards
   - `baker_fetch_trello_card_details` - Fetch card metadata from API
   - `fetch_sprout_video_details` - Fetch video metadata from Sprout API

3. ✅ **contracts/test-scenarios.md**: Integration test scenarios
   - Contract test templates for each command
   - Validation scenarios for edge cases
   - Error handling test cases

4. ✅ **quickstart.md**: Developer validation workflows
   - Workflow 1: Upload multiple videos and associate with project
   - Workflow 2: Link multiple Trello cards to project
   - Workflow 3: Baker preview of multiple media items
   - Workflow 4: BuildProject integration with Trello cards array

5. ✅ **CLAUDE.md updates**: Context documented in main CLAUDE.md file
   - Phase 004 feature description added
   - Data models and contracts referenced
   - Recent changes tracked

**Output**: All Phase 1 artifacts complete and validated

## Phase 2: BuildProject-Specific Task Planning

**Scope**: Migrate BuildProject to use Trello cards array instead of single trelloCardUrl

**Task Generation Strategy for BuildProject Migration**:
1. **Component Integration Tasks**:
   - Import TrelloCardsManager and VideoLinksManager into BuildProject
   - Replace TrelloIntegrationModal with array-based managers
   - Update success banner UI to show media management sections

2. **State Management Tasks**:
   - Verify useBreadcrumbsTrelloCards hook works with BuildProject paths
   - Test projectPath format compatibility (BuildProject vs Baker)
   - Ensure appStore breadcrumbs updates propagate correctly

3. **UI/UX Tasks**:
   - Replace "Link to Trello" button with embedded managers
   - Add Video Links section after project creation
   - Match Baker's styling and layout patterns
   - Add empty state messaging for zero cards/videos

4. **Backward Compatibility Tasks**:
   - Test reading legacy breadcrumbs with single trelloCardUrl
   - Verify migration from trelloCardUrl → trelloCards[] array
   - Ensure old breadcrumbs remain readable

5. **Integration Testing Tasks**:
   - E2E test: BuildProject creation → Add Trello card → Verify breadcrumbs
   - Cross-page test: BuildProject creates → Baker displays correctly
   - Regression test: Existing workflows still functional

**Ordering Strategy**:
1. Type definitions (already complete) ✅
2. Backend commands (already complete) ✅
3. Component imports and integration
4. UI layout updates
5. State management verification
6. Integration tests
7. Documentation updates

**Estimated Output**: 10-15 tasks specifically for BuildProject migration

**Note**: Baker implementation (phases 0-2) already complete. This focuses ONLY on BuildProject migration.

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

**No constitutional violations identified**. Implementation follows established patterns:
- Reuses existing components (TrelloCardsManager, VideoLinksManager)
- Uses existing data models and Tauri commands
- No new dependencies or architectural patterns required
- Backward compatibility via optional fields (standard Rust/serde pattern)


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning approach defined (/plan command) ✅
- [ ] Phase 3: BuildProject migration tasks generated (/tasks command) - NEXT STEP
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations: NONE ✅

**Implementation Status**:
- [x] Baker: TrelloCardsManager implemented and tested ✅
- [x] Baker: VideoLinksManager implemented and tested ✅
- [x] Backend: All Tauri commands implemented ✅
- [x] Types: TypeScript and Rust types defined ✅
- [ ] BuildProject: Component integration (PENDING)
- [ ] BuildProject: UI updates (PENDING)
- [ ] BuildProject: Testing (PENDING)

---

## Next Steps

**Ready for `/tasks` command** to generate BuildProject-specific implementation tasks.

**Focus Areas**:
1. Replace `TrelloIntegrationModal` with `TrelloCardsManager` in BuildProject.tsx
2. Add `VideoLinksManager` component to post-creation success UI
3. Update breadcrumbs state management for BuildProject workflow
4. Write integration tests for BuildProject → Baker cross-page functionality
5. Update CLAUDE.md with BuildProject migration notes

**Estimated Implementation Time**: 2-4 hours for component integration + testing

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
*Planning completed: 2025-10-01*