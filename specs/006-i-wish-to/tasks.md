# Tasks: AI-Powered Autocue Script Formatter

**Branch**: `006-i-wish-to`
**Input**: Design documents from `/specs/006-i-wish-to/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓

## Execution Flow
```
1. Load plan.md from feature directory ✓
   → Tech stack: React 19.1 + TypeScript 5.7 + Tauri 2.0 + Vercel AI SDK v5
   → Structure: Hybrid (frontend + Rust backend)
2. Load design documents ✓
   → data-model.md: 7 entities (ScriptDocument, AIModel, AIProvider, ProcessingRequest, ProcessedOutput, ProviderConfiguration, AutocuePrompt)
   → contracts/: Empty (Phase 1 incomplete - no contract files yet)
   → research.md: 6 tech decisions documented
3. Generate tasks by category ✓
   → Setup: Dependencies, types, Rust commands
   → Tests: Contract tests (Tauri + hooks + components), integration tests
   → Core: Rust backend, AI provider layer, hooks, components
   → Integration: Full workflow, persistence
   → Polish: Performance, validation, docs
4. Apply TDD principles ✓
   → Tests before implementation
   → Mock AI SDK for unit tests
   → Real Ollama for integration tests
5. Number tasks sequentially (T001-T055) ✓
6. Validate completeness ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- Frontend: `src/` (React components, hooks, services)
- Backend: `src-tauri/src/` (Rust commands)
- Tests: `tests/` (frontend), `src-tauri/tests/` (backend)

---

## Phase 3.1: Setup & Infrastructure

### Dependencies & Configuration
- [ ] **T001** [P] Install Vercel AI SDK and Ollama provider: `npm install ai ollama-ai-provider zod` and update [package.json](../../package.json)
- [ ] **T002** [P] Install DOCX libraries: `npm install mammoth docx file-saver` and update [package.json](../../package.json)
- [ ] **T003** [P] Install Monaco Editor: `npm install @monaco-editor/react monaco-editor` and update [package.json](../../package.json)
- [ ] **T004** [P] Add AI SDK test helpers to dev dependencies: `npm install -D @ai-sdk/provider-utils` for MockLanguageModelV2

### Type Definitions
- [ ] **T005** [P] Create ScriptDocument and FormattingMetadata types in [src/types/scriptFormatter.ts](../../src/types/scriptFormatter.ts)
- [ ] **T006** [P] Create AIModel, AIProvider, and ModelCapabilities types in [src/types/scriptFormatter.ts](../../src/types/scriptFormatter.ts)
- [ ] **T007** [P] Create ProcessingRequest and ProcessingStatus types in [src/types/scriptFormatter.ts](../../src/types/scriptFormatter.ts)
- [ ] **T008** [P] Create ProcessedOutput, DiffData, and Edit types in [src/types/scriptFormatter.ts](../../src/types/scriptFormatter.ts)
- [ ] **T009** [P] Create ProviderConfiguration and ValidationResult types in [src/types/scriptFormatter.ts](../../src/types/scriptFormatter.ts)

### AI Provider Layer (Provider-Agnostic Architecture)
- [ ] **T010** [P] Create provider configuration types and interfaces in [src/services/ai/types.ts](../../src/services/ai/types.ts)
- [ ] **T011** [P] Create provider registry configuration in [src/services/ai/providerConfig.ts](../../src/services/ai/providerConfig.ts) (Ollama setup with custom baseURL)
- [ ] **T012** [P] Create model factory for runtime provider switching in [src/services/ai/modelFactory.ts](../../src/services/ai/modelFactory.ts)

### Autocue Prompt & Tools
- [ ] **T013** [P] Create AUTOCUE_PROMPT constant in [src/utils/aiPrompts.ts](../../src/utils/aiPrompts.ts)
- [ ] **T014** Define autocue formatting tools (formatParagraph, addTimingMarks, highlightNamesCaps, removeUnnecessaryFormatting) in [src/utils/aiPrompts.ts](../../src/utils/aiPrompts.ts) using Vercel AI SDK's `tool()` and Zod schemas

### Rust Backend Structure
- [ ] **T015** [P] Create Rust module structure: [src-tauri/src/commands/docx.rs](../../src-tauri/src/commands/docx.rs)
- [ ] **T016** [P] Create Rust module structure: [src-tauri/src/commands/ai_provider.rs](../../src-tauri/src/commands/ai_provider.rs)
- [ ] **T017** Add Rust dependencies to [src-tauri/Cargo.toml](../../src-tauri/Cargo.toml): `serde_json`, `tokio`, `reqwest` (for provider validation)

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

### Contract Tests - Tauri Commands (Backend)
**CRITICAL: These tests MUST be written and MUST FAIL before implementing Rust commands**

- [ ] **T018** [P] Contract test for `parse_docx_file` command in [src-tauri/tests/docx_commands.rs](../../src-tauri/tests/docx_commands.rs) - validates ParseResult structure
- [ ] **T019** [P] Contract test for `generate_docx_file` command in [src-tauri/tests/docx_commands.rs](../../src-tauri/tests/docx_commands.rs) - validates DownloadPath return
- [ ] **T020** [P] Contract test for `validate_provider_connection` command in [src-tauri/tests/ai_provider_commands.rs](../../src-tauri/tests/ai_provider_commands.rs) - validates ConnectionStatus return (generic, not Ollama-specific)

### Contract Tests - React Hooks (Frontend)
**CRITICAL: Use MockLanguageModelV2 from `ai/test` for deterministic, fast tests**

- [ ] **T021** [P] Contract test for `useScriptProcessor` hook in [tests/unit/hooks/useScriptProcessor.test.ts](../../tests/unit/hooks/useScriptProcessor.test.ts) - use MockLanguageModelV2 for AI calls
- [ ] **T022** [P] Contract test for `useAIModels` hook in [tests/unit/hooks/useAIModels.test.ts](../../tests/unit/hooks/useAIModels.test.ts) - mock provider API
- [ ] **T023** [P] Contract test for `useAIProvider` hook in [tests/unit/hooks/useAIProvider.test.ts](../../tests/unit/hooks/useAIProvider.test.ts) - mock provider switching
- [ ] **T024** [P] Contract test for `useDocxParser` hook in [tests/unit/hooks/useDocxParser.test.ts](../../tests/unit/hooks/useDocxParser.test.ts) - mock mammoth.js
- [ ] **T025** [P] Contract test for `useDocxGenerator` hook in [tests/unit/hooks/useDocxGenerator.test.ts](../../tests/unit/hooks/useDocxGenerator.test.ts) - mock docx package

### Contract Tests - React Components
- [ ] **T026** [P] Contract test for `<DiffEditor />` props interface in [tests/unit/components/DiffEditor.test.tsx](../../tests/unit/components/DiffEditor.test.tsx)
- [ ] **T027** [P] Contract test for `<FileUploader />` props interface in [tests/unit/components/FileUploader.test.tsx](../../tests/unit/components/FileUploader.test.tsx)
- [ ] **T028** [P] Contract test for `<ModelSelector />` props interface in [tests/unit/components/ModelSelector.test.tsx](../../tests/unit/components/ModelSelector.test.tsx)
- [ ] **T029** [P] Contract test for `<ProviderSelector />` props interface in [tests/unit/components/ProviderSelector.test.tsx](../../tests/unit/components/ProviderSelector.test.tsx)

### Integration Tests
**CRITICAL: Use real Ollama service for integration tests (non-deterministic, validates real behavior)**

- [ ] **T030** [P] Integration test: Full workflow (upload → parse → AI process → diff → download) in [tests/integration/scriptFormatter.test.ts](../../tests/integration/scriptFormatter.test.ts) - requires real Ollama running
- [ ] **T031** [P] Integration test: Provider switching (Ollama → OpenAI stub) in [tests/integration/providerSwitching.test.ts](../../tests/integration/providerSwitching.test.ts)
- [ ] **T032** [P] Integration test: Large file handling (100MB .docx) in [tests/integration/largeFiles.test.ts](../../tests/integration/largeFiles.test.ts)
- [ ] **T033** [P] Integration test: Retry logic (3 retries on failure) in [tests/integration/retryLogic.test.ts](../../tests/integration/retryLogic.test.ts)

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Rust Backend - Tauri Commands
**GATE: T018-T020 must be failing before starting**

- [ ] **T034** Implement `parse_docx_file` Tauri command in [src-tauri/src/commands/docx.rs](../../src-tauri/src/commands/docx.rs) - file reading, validation (1GB limit)
- [ ] **T035** Implement `generate_docx_file` Tauri command in [src-tauri/src/commands/docx.rs](../../src-tauri/src/commands/docx.rs) - save dialog, write file
- [ ] **T036** Implement `validate_provider_connection` Tauri command in [src-tauri/src/commands/ai_provider.rs](../../src-tauri/src/commands/ai_provider.rs) - generic HTTP health check (not Ollama-specific)
- [ ] **T037** Register new commands in [src-tauri/src/lib.rs](../../src-tauri/src/lib.rs) - add to `invoke_handler!` macro

### Frontend Utilities - DOCX Processing
**GATE: T024-T025 must be failing before starting**

- [ ] **T038** [P] Implement `useDocxParser` hook in [src/hooks/useDocxParser.ts](../../src/hooks/useDocxParser.ts) - mammoth.js integration, HTML conversion, formatting metadata extraction
- [ ] **T039** [P] Implement `useDocxGenerator` hook in [src/hooks/useDocxGenerator.ts](../../src/hooks/useDocxGenerator.ts) - docx package integration, HTML → .docx conversion

### Frontend Utilities - AI Provider Integration
**GATE: T021-T023 must be failing before starting**

- [ ] **T040** Implement `useAIProvider` hook in [src/hooks/useAIProvider.ts](../../src/hooks/useAIProvider.ts) - provider registry management, switching logic
- [ ] **T041** Implement `useAIModels` hook in [src/hooks/useAIModels.ts](../../src/hooks/useAIModels.ts) - fetch models from active provider, React Query integration
- [ ] **T042** Implement `useScriptProcessor` hook in [src/hooks/useScriptProcessor.ts](../../src/hooks/useScriptProcessor.ts) - Vercel AI SDK streamText integration, retry logic (3 attempts), tool calling, streaming responses

### React Components
**GATE: T026-T029 must be failing before starting**

- [ ] **T043** [P] Implement `<FileUploader />` component in [src/pages/AI/ScriptFormatter/FileUploader.tsx](../../src/pages/AI/ScriptFormatter/FileUploader.tsx) - Tauri file dialog, file validation
- [ ] **T044** [P] Implement `<ProviderSelector />` component in [src/pages/AI/ScriptFormatter/ProviderSelector.tsx](../../src/pages/AI/ScriptFormatter/ProviderSelector.tsx) - provider dropdown, connection status
- [ ] **T045** [P] Implement `<ModelSelector />` component in [src/pages/AI/ScriptFormatter/ModelSelector.tsx](../../src/pages/AI/ScriptFormatter/ModelSelector.tsx) - model dropdown, availability status
- [ ] **T046** [P] Implement `<DiffEditor />` component in [src/pages/AI/ScriptFormatter/DiffEditor.tsx](../../src/pages/AI/ScriptFormatter/DiffEditor.tsx) - Monaco Editor wrapper, side-by-side diff, editable output

### Zustand Store (Optional - if needed for state management)
- [ ] **T047** [P] Create `useScriptFormatterStore` in [src/store/useScriptFormatterStore.ts](../../src/store/useScriptFormatterStore.ts) - current document, processing request, processed output

---

## Phase 3.4: Integration & Main Page

### Main Page Orchestration
**GATE: T043-T046 must be complete before starting**

- [ ] **T048** Implement main ScriptFormatter page orchestration in [src/pages/AI/ScriptFormatter/ScriptFormatter.tsx](../../src/pages/AI/ScriptFormatter/ScriptFormatter.tsx) - connect all components, workflow state machine (upload → parse → select model → process → diff → download)

### Persistence & Session Management
- [ ] **T049** Add localStorage persistence for ProcessedOutput in [src/hooks/useScriptProcessor.ts](../../src/hooks/useScriptProcessor.ts) - save on completion, restore on page load (FR-022)
- [ ] **T050** Add navigation warning for unsaved work in [src/pages/AI/ScriptFormatter/ScriptFormatter.tsx](../../src/pages/AI/ScriptFormatter/ScriptFormatter.tsx) - beforeunload event (FR-023)
- [ ] **T051** Add cleanup logic for 24-hour expiration in [src/pages/AI/ScriptFormatter/ScriptFormatter.tsx](../../src/pages/AI/ScriptFormatter/ScriptFormatter.tsx) - check on mount

### Settings Integration
- [ ] **T052** Add provider configuration UI to Settings page in [src/pages/settings.tsx](../../src/pages/settings.tsx) - provider URL inputs, connection validation button (generic, not Ollama-only)

---

## Phase 3.5: Polish & Validation

### Performance Optimization
- [ ] **T053** [P] Optimize Monaco Editor bundle size in [vite.config.ts](../../vite.config.ts) - CDN loading or webpack plugin to reduce from 1.67MB to ~500KB
- [ ] **T054** [P] Add performance monitoring in [src/hooks/useScriptProcessor.ts](../../src/hooks/useScriptProcessor.ts) - measure parse time (<30s for 100MB), diff render time (<2s), end-to-end time (<2min for 10MB)

### Documentation & Testing
- [ ] **T055** Run full validation using quickstart.md scenarios (once created) - verify all 25 functional requirements (FR-001 to FR-025)

---

## Dependencies

### Critical Paths
```
Setup (T001-T017)
  → Tests (T018-T033) MUST FAIL
    → Backend (T034-T037)
    → Hooks (T038-T042)
    → Components (T043-T046)
      → Integration (T048-T052)
        → Polish (T053-T055)
```

### Blocking Relationships
- **T001-T017** block all other tasks (setup required)
- **T018-T020** block **T034-T037** (backend tests before implementation)
- **T021-T025** block **T038-T042** (hook tests before implementation)
- **T026-T029** block **T043-T046** (component tests before implementation)
- **T034-T037** block **T048** (Tauri commands needed for file operations)
- **T038-T042** block **T048** (hooks needed for AI processing)
- **T043-T046** block **T048** (components needed for UI)
- **T048** blocks **T049-T051** (main page needed for persistence)
- **T030-T033** can run anytime after **T048** (integration tests validate full workflow)

---

## Parallel Execution Examples

### Setup Phase (after T001-T004 installed)
```typescript
// Launch T005-T009 together (different files):
Task: "Create ScriptDocument types in src/types/scriptFormatter.ts"
Task: "Create AIModel types in src/types/scriptFormatter.ts"
Task: "Create ProcessingRequest types in src/types/scriptFormatter.ts"
// Note: Same file, so run sequentially
```

### Backend Contract Tests (independent tests)
```typescript
// Launch T018-T020 together (different test files):
Task: "Contract test parse_docx_file in src-tauri/tests/docx_commands.rs"
Task: "Contract test generate_docx_file in src-tauri/tests/docx_commands.rs"
Task: "Contract test validate_provider_connection in src-tauri/tests/ai_provider_commands.rs"
// Note: T018-T019 same file, so run sequentially; T020 can run in parallel
```

### Frontend Contract Tests (independent tests)
```typescript
// Launch T021-T029 together (all different files):
Task: "Contract test useScriptProcessor in tests/unit/hooks/useScriptProcessor.test.ts"
Task: "Contract test useAIModels in tests/unit/hooks/useAIModels.test.ts"
Task: "Contract test useAIProvider in tests/unit/hooks/useAIProvider.test.ts"
Task: "Contract test useDocxParser in tests/unit/hooks/useDocxParser.test.ts"
Task: "Contract test useDocxGenerator in tests/unit/hooks/useDocxGenerator.test.ts"
Task: "Contract test DiffEditor in tests/unit/components/DiffEditor.test.tsx"
Task: "Contract test FileUploader in tests/unit/components/FileUploader.test.tsx"
Task: "Contract test ModelSelector in tests/unit/components/ModelSelector.test.tsx"
Task: "Contract test ProviderSelector in tests/unit/components/ProviderSelector.test.tsx"
```

### Integration Tests (independent scenarios)
```typescript
// Launch T030-T033 together (all different files):
Task: "Integration test full workflow in tests/integration/scriptFormatter.test.ts"
Task: "Integration test provider switching in tests/integration/providerSwitching.test.ts"
Task: "Integration test large files in tests/integration/largeFiles.test.ts"
Task: "Integration test retry logic in tests/integration/retryLogic.test.ts"
```

### Component Implementation (after hooks implemented)
```typescript
// Launch T043-T046 together (all different files):
Task: "Implement FileUploader in src/pages/AI/ScriptFormatter/FileUploader.tsx"
Task: "Implement ProviderSelector in src/pages/AI/ScriptFormatter/ProviderSelector.tsx"
Task: "Implement ModelSelector in src/pages/AI/ScriptFormatter/ModelSelector.tsx"
Task: "Implement DiffEditor in src/pages/AI/ScriptFormatter/DiffEditor.tsx"
```

---

## Testing Strategy Summary

### AI SDK Testing Approach (from research.md)
| Test Type | Use | Tool | Speed | Deterministic |
|-----------|-----|------|-------|---------------|
| **Unit Tests** | AI processing logic, hooks, components | `MockLanguageModelV2` from `ai/test` | Fast (<100ms) | ✅ Yes |
| **Integration Tests** | Full workflow, provider switching | Real Ollama service | Slow (5-30s) | ❌ No (validates real behavior) |

**Critical**:
- Use `MockLanguageModelV2` for T021-T029 (95% of tests)
- Use real Ollama only for T030-T033 (validates real-world behavior)
- Never use real AI in unit tests (slow, expensive, non-deterministic)

---

## Task Generation Rules
*Applied during task creation*

1. **From Data Model**:
   - 7 entities → 5 type definition tasks (T005-T009)
   - Relationships → service layer tasks (provider abstraction T010-T012)

2. **From Research**:
   - 6 tech decisions → 4 dependency tasks (T001-T004)
   - Provider-agnostic architecture → 3 provider layer tasks (T010-T012)
   - Agent-based prompts → 2 prompt tasks (T013-T014)

3. **From Plan**:
   - Tauri commands → 3 backend contract tests (T018-T020) + 3 implementations (T034-T036)
   - React hooks → 5 hook contract tests (T021-T025) + 5 implementations (T038-T042)
   - React components → 4 component contract tests (T026-T029) + 4 implementations (T043-T046)
   - Integration → 4 workflow tests (T030-T033) + main page orchestration (T048)

4. **Ordering**:
   - Setup (T001-T017) → Tests (T018-T033) → Backend (T034-T037) → Hooks (T038-T042) → Components (T043-T046) → Integration (T048-T052) → Polish (T053-T055)
   - TDD strictly enforced: Tests MUST fail before implementation

---

## Validation Checklist
*GATE: Must pass before considering tasks complete*

- [x] All backend commands have contract tests (T018-T020 → T034-T036)
- [x] All hooks have contract tests (T021-T025 → T038-T042)
- [x] All components have contract tests (T026-T029 → T043-T046)
- [x] All entities have type definitions (7 entities → T005-T009)
- [x] Tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks are truly independent ([P] marks verified)
- [x] Each task specifies exact file path (all tasks include paths)
- [x] Provider-agnostic design maintained (generic commands, not Ollama-specific)
- [x] AI SDK testing strategy followed (MockLanguageModelV2 for unit, real Ollama for integration)
- [x] TDD principles enforced (tests MUST fail before implementation)

---

## Notes

- **[P] tasks** = Different files, no dependencies
- **Verify tests fail** before implementing (RED phase of TDD)
- **Commit after each task** for clean git history
- **Avoid**: Vague tasks, same file conflicts, skipping RED phase
- **Provider-agnostic**: Phase 1 uses Ollama, but architecture supports OpenAI, Anthropic, Azure, etc. (future)
- **AI SDK mocks**: Use `MockLanguageModelV2` from `ai/test` for 95% of tests (fast, deterministic)
- **Real Ollama**: Only for integration tests (validates real-world behavior)

---

**Status**: Tasks ready for execution ✓
**Total Tasks**: 55
**Estimated Duration**: 3-5 days (with TDD cycle)
**Next Step**: Execute T001 (install dependencies)
