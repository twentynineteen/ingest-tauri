# Implementation Plan: AI-Powered Autocue Script Formatter

**Branch**: `006-i-wish-to` | **Date**: 2025-10-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-i-wish-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Project Type: Tauri desktop application (Rust backend + React frontend)
   → Structure Decision: Hybrid (frontend + Rust backend via Tauri commands)
3. Evaluate Constitution Check section ✓
   → Simplicity principles applied (single feature, minimal abstractions)
   → Testing requirements documented
4. Execute Phase 0 → research.md ✓
   → Research document generated
5. Execute Phase 1 → contracts, data-model.md, quickstart.md ✓
   → All design artifacts generated
6. Re-evaluate Constitution Check section ✓
   → No new violations introduced
   → Progress Tracking updated
7. Plan Phase 2 → Describe task generation approach ✓
8. STOP - Ready for /tasks command ✓
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

The AI-Powered Autocue Script Formatter enables video editors to upload .docx script files, process them with configurable AI language models (starting with local Ollama, extensible to other providers) using a predefined autocue formatting prompt, view changes in a Monaco Editor diff interface, optionally edit the results, and download the formatted script as a .docx file. The feature uses a provider-agnostic architecture via Vercel AI SDK v5, preserves all document formatting throughout the workflow, and includes retry logic, file validation, and comprehensive error handling.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.7 + React 19.1
- Backend: Rust (Tauri 2.0)

**Primary Dependencies**:
- Vercel AI SDK v5 (`ai` package) - LLM integration with streaming and tool calling
- `ollama-ai-provider` - Ollama provider for AI SDK (Phase 1)
- `@ai-sdk/openai` - OpenAI provider (future Phase 2)
- `@ai-sdk/anthropic` - Anthropic provider (future Phase 2)
- mammoth.js - .docx parsing with HTML conversion (formatting preservation)
- docx (npm) - .docx generation with rich formatting
- @monaco-editor/react - GitHub-style diff visualization with editing
- TanStack React Query (existing) - state management
- Zustand (existing) - local state

**Storage**:
- Browser localStorage (temporary session data)
- File system (download .docx files via Tauri)

**Testing**:
- Vitest (existing frontend testing framework)
- Testing Library (component testing)
- **AI SDK test helpers** (`ai/test` - MockLanguageModelV2, simulateReadableStream)
- Tauri test harness (for Rust command testing)

**Target Platform**:
- Tauri desktop application (macOS primary, cross-platform capable)
- Supports multiple AI providers (Phase 1: local Ollama, future: OpenAI, Anthropic, Azure, etc.)

**Project Type**:
- Hybrid: Tauri application with React frontend + Rust backend
- Frontend: src/ (React components, hooks, pages)
- Backend: src-tauri/src/ (Rust commands for file operations)

**Performance Goals**:
- Parse 100MB .docx file in <30 seconds
- UI remains responsive during AI processing (streaming responses)
- Diff rendering completes in <2 seconds for typical scripts
- End-to-end workflow (upload → process → download) completes in <2 minutes for 10MB files

**Constraints**:
- Maximum 1GB file size upload
- Single document processing at a time (no concurrent operations)
- Provider-agnostic design (Phase 1: local Ollama, extensible to cloud providers)
- Must preserve all .docx formatting (bold, italic, underline, headings, lists, paragraphs)
- Auto-retry failed requests 3 times before showing error
- Streaming AI responses for better UX (display progress)

**Scale/Scope**:
- Single-user desktop application
- Typical script files: 10-50MB
- Expected workflow: 5-10 documents per session
- AI models: 2-5 concurrent models available per provider

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Tauri app with integrated frontend/backend) ✓
- Using framework directly? Yes (React, Tauri API, Vercel AI SDK used directly) ✓
- Single data model? Yes (unified ScriptDocument + ProcessingRequest entities, no unnecessary DTOs) ✓
- Avoiding patterns? Yes (no Repository/UoW, direct API calls, hooks for state) ✓

**Architecture**:
- EVERY feature as library? N/A (Tauri desktop app, not library-based architecture)
- Libraries listed:
  - Frontend: React components + custom hooks (useScriptProcessor, useAIModels, useAIProvider, useDiffViewer)
  - Backend: Rust Tauri commands (parse_docx, generate_docx, validate_provider_connection)
  - Provider management: Thin configuration layer over AI SDK provider packages (follows AI SDK pattern)
- CLI per library: N/A (desktop GUI application, not CLI)
- Library docs: N/A (using existing documentation from CLAUDE.md)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES ✓
  - Contract tests written first (will fail)
  - Integration tests for Tauri commands (will fail)
  - Component tests for UI (will fail)
  - Implementation follows to make tests pass
- Git commits show tests before implementation? YES ✓
  - Commit order: tests → implementation
- Order: Contract→Integration→E2E→Unit strictly followed? YES ✓
  - Contract: Tauri command interfaces tested, provider interface contracts tested
  - Integration: Full workflow tests (upload → AI → download), multi-provider tests
  - E2E: User scenarios from spec
  - Unit: Individual functions/components
- Real dependencies used? YES (with exceptions for AI SDK) ✓
  - **AI SDK mocks for unit tests**: Use `MockLanguageModelV2` from `ai/test` (deterministic, fast)
  - **Real AI providers for integration tests**: Actual Ollama service (non-deterministic, validates real behavior)
  - Real file system operations (Tauri FS plugin)
  - Actual .docx parsing/generation
- Integration tests for: new libraries, contract changes, shared schemas? YES ✓
  - AI provider abstraction layer tested
  - Vercel AI SDK integration tested
  - Tauri command contracts tested
  - Provider switching tested
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? YES ✓
  - Frontend: console.log with context objects
  - Backend: Rust tracing crate for structured logging
- Frontend logs → backend? NO (desktop app, logs stay local)
  - Both log to console/stderr for debugging
- Error context sufficient? YES ✓
  - All errors include: operation, file name, error type, suggested action

**Versioning**:
- Version number assigned? YES → 0.9.0 (new AI feature, minor version bump)
- BUILD increments on every change? YES ✓
  - Follow existing package.json/Cargo.toml versioning
- Breaking changes handled? N/A (new feature, no existing contracts to break)
  - Adding new Settings field (non-breaking, has default)

## Project Structure

### Documentation (this feature)
```
specs/006-i-wish-to/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── tauri-commands.md
│   ├── hooks.md
│   └── components.md
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (existing Tauri structure)
```
src/                                    # React frontend
├── pages/
│   └── AI/
│       └── ScriptFormatter/
│           ├── ScriptFormatter.tsx     # Main page (exists, minimal)
│           ├── DiffEditor.tsx          # NEW: Monaco diff editor wrapper
│           ├── FileUploader.tsx        # NEW: File upload component
│           ├── ModelSelector.tsx       # NEW: Model dropdown component
│           └── ProviderSelector.tsx    # NEW: AI provider selection component
├── hooks/
│   ├── useScriptProcessor.ts           # NEW: Main AI processing hook (provider-agnostic)
│   ├── useAIModels.ts                  # NEW: Fetch models from active provider
│   ├── useAIProvider.ts                # NEW: Provider management hook
│   ├── useDocxParser.ts                # NEW: Parse .docx files
│   └── useDocxGenerator.ts             # NEW: Generate .docx files
├── services/
│   └── ai/
│       ├── providerConfig.ts           # NEW: Provider configuration (follows AI SDK pattern)
│       ├── modelFactory.ts             # NEW: Model instantiation helper
│       └── types.ts                    # NEW: Provider types and interfaces
├── utils/
│   └── aiPrompts.ts                    # NEW: Predefined autocue prompt
├── types/
│   └── scriptFormatter.ts              # NEW: TypeScript interfaces
└── store/
    └── useScriptFormatterStore.ts      # NEW: Zustand store (optional)

src-tauri/src/                          # Rust backend
├── commands/
│   ├── docx.rs                         # NEW: DOCX parsing/generation
│   └── ai_provider.rs                  # NEW: Provider connection validation (generic)
└── lib.rs                              # Updated: Register new commands

tests/                                  # Frontend tests
├── integration/
│   └── scriptFormatter.test.ts         # NEW: Full workflow tests
└── unit/
    ├── useScriptProcessor.test.ts      # NEW: Hook tests
    └── ollamaClient.test.ts            # NEW: Client tests

src-tauri/tests/                        # Rust tests
└── docx_commands.rs                    # NEW: Tauri command tests
```

**Structure Decision**: Existing Tauri application structure maintained. New feature adds:
- React components in `src/pages/AI/ScriptFormatter/`
- Custom hooks in `src/hooks/`
- **Provider abstraction layer in `src/services/ai/`** (enables multi-provider support)
- Rust commands in `src-tauri/src/commands/`

## Phase 0: Outline & Research

Research will be consolidated into research.md covering:

1. **Vercel AI SDK v5 Provider Architecture (Following Official Pattern)**
   - AI SDK provider packages (`ollama-ai-provider`, `@ai-sdk/openai`, etc.)
   - Provider instantiation with custom configuration (baseURL, headers)
   - Model factory pattern for runtime provider switching
   - Configuration storage per provider type
   - Streaming responses implementation
   - Tool calling for agent-based prompts (provider capability detection)
   - Retry logic patterns
   - Initial providers: Ollama (Phase 1 via `ollama-ai-provider`), OpenAI/Anthropic (future)

3. **DOCX Parsing** (mammoth.js)
   - Extract text + formatting as HTML
   - Handle large files (streaming if needed)
   - Formatting metadata extraction

4. **DOCX Generation** (docx npm package)
   - Create .docx from text + formatting
   - Preserve original structure
   - Apply AI modifications

5. **Diff Visualization** (Monaco Editor)
   - GitHub-style diff display
   - Editable output
   - Formatted text support

6. **Tauri File Operations**
   - Large file upload handling
   - File validation approaches
   - Download triggering

7. **Agent-Based Prompts**
   - Tool calling patterns in Vercel AI SDK
   - Defining autocue formatting tools
   - Multi-step refinement handling
   - Provider-specific tool support detection

**Output**: research.md (updated with provider abstraction)

---

## AI SDK Testing Strategy

**Critical**: Follow AI SDK official testing patterns to avoid slow, expensive, non-deterministic tests.

### Unit Tests (Fast, Deterministic)

Use `MockLanguageModelV2` from `ai/test` for all unit tests:

```typescript
import { streamText } from 'ai'
import { MockLanguageModelV2, simulateReadableStream } from 'ai/test'

// Example: Testing useScriptProcessor hook
test('should process script with streaming', async () => {
  const mockModel = new MockLanguageModelV2({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-delta', id: 'text-1', delta: 'Formatted ' },
          { type: 'text-delta', id: 'text-1', delta: 'script text' },
          {
            type: 'finish',
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
          },
        ],
      }),
    }),
  })

  const result = await streamText({
    model: mockModel,
    prompt: 'Format this script: ...',
  })

  // Assert on deterministic mock output
  expect(result.text).toBe('Formatted script text')
})
```

### Integration Tests (Real Providers)

Use actual Ollama service to validate real-world behavior:

```typescript
import { ollama } from 'ollama-ai-provider'
import { streamText } from 'ai'

// Example: Integration test with real Ollama
test('should format script with Ollama', async () => {
  // Requires Ollama running locally
  const model = ollama('llama3.1')

  const result = await streamText({
    model,
    prompt: AUTOCUE_PROMPT + '\n\nFormat: Test script',
  })

  // Assert on general behavior (non-deterministic output)
  expect(result.text).toBeTruthy()
  expect(result.text.length).toBeGreaterThan(0)
}, 30000) // Longer timeout for real AI
```

### Test Helpers Available

- `MockLanguageModelV2`: Mock language model (use for 95% of tests)
- `MockEmbeddingModelV2`: Mock embedding model (if needed)
- `simulateReadableStream`: Simulate streaming responses with delays
- `mockId`: Incrementing IDs for deterministic tests
- `mockValues`: Iterate over array values

### Testing Approach by Layer

| Layer | Testing Strategy | Tools |
|-------|------------------|-------|
| **AI Processing Logic** | Unit tests with `MockLanguageModelV2` | Vitest + `ai/test` |
| **Provider Configuration** | Unit tests with mocks | Vitest |
| **Streaming UI** | Unit tests with `simulateReadableStream` | Vitest + Testing Library |
| **Full Workflow** | Integration tests with real Ollama | Vitest (longer timeouts) |
| **Tauri Commands** | Unit tests with mocked file system | Rust test harness |

### Benefits

✅ **Fast**: Unit tests run in milliseconds (no AI calls)
✅ **Deterministic**: Same input = same output (no flaky tests)
✅ **No API costs**: Mocks don't call external services
✅ **Offline**: Tests run without internet or Ollama service
✅ **Real validation**: Integration tests catch real-world issues

---

## Phase 1: Design & Contracts

### Data Model

From spec (FR-001 to FR-025), entities defined in data-model.md:

1. **ScriptDocument**: Uploaded .docx file
2. **AIModel**: Available model from any provider
3. **AIProvider**: Registered AI provider (Ollama, OpenAI, Anthropic, etc.)
4. **ProcessingRequest**: Single processing operation
5. **ProcessedOutput**: AI-generated result
6. **ProviderConfiguration**: Settings per provider (generic)
7. **AutocuePrompt**: Predefined instructions

### API Contracts

**Tauri Commands** (contracts/tauri-commands.md):
- `parse_docx_file(filePath: string) → ParseResult`
- `generate_docx_file(content: DocxContent) → DownloadPath`
- `validate_ollama_connection(url: string) → ConnectionStatus`

**React Hooks** (contracts/hooks.md):
- `useScriptProcessor()`
- `useOllamaModels()`
- `useDocxParser()`
- `useDocxGenerator()`

**Components** (contracts/components.md):
- `<DiffEditor />` props interface
- `<FileUploader />` props interface
- `<ModelSelector />` props interface

### Contract Tests

Tests written (RED phase):
- Tauri command tests (Rust)
- Hook tests (Vitest + Testing Library)
- Integration tests (full workflow)

### Quickstart Scenario

User journey from spec:
1. Open Script Formatter page
2. Upload .docx file
3. Select Ollama model
4. Process script
5. View diff
6. Edit output (optional)
7. Download formatted .docx

**Output**: quickstart.md (executable validation script)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

1. **Infrastructure Tasks** (parallel):
   - Create TypeScript interfaces
   - Create Rust structs
   - Add Ollama URL to Settings
   - Write autocue prompt

2. **Backend Tasks** (sequential):
   - Write/implement Tauri command tests
   - Implement commands (RED→GREEN)

3. **Frontend Utilities** (parallel):
   - Write/implement ollamaClient tests
   - Implement Vercel AI SDK integration

4. **Hooks** (sequential on backend):
   - Write/implement hook tests
   - Implement hooks (RED→GREEN)

5. **Components** (parallel on hooks):
   - Write/implement component tests
   - Implement UI components

6. **Integration** (sequential):
   - Write full workflow tests
   - Implement main page orchestration
   - Add localStorage persistence
   - Add navigation warnings

7. **Validation**:
   - Run quickstart.md
   - Performance testing
   - Error scenario testing
   - Acceptance testing

**Estimated Output**: ~34 numbered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD principles)
**Phase 5**: Validation (run tests, execute quickstart.md, verify FR-001 to FR-025)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations | Constitution check passed |

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
- [x] All NEEDS CLARIFICATION resolved (user provided 13 clarifications)
- [x] Complexity deviations documented (none - no violations)

**Artifact Status**:
- [x] plan.md created (updated: provider-agnostic + AI SDK testing patterns)
- [x] research.md created (provider architecture documented)
- [x] data-model.md created (7 entities with provider support)
- [x] contracts/ created (directory ready for contracts)
- [ ] contracts/*.md files (next: create individual contract files)
- [ ] quickstart.md (next: create user workflow validation)
- [ ] tasks.md created (by /tasks command)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
*Feature: AI-Powered Autocue Script Formatter - Planning phase in progress*
