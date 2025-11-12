# Data Model: AI-Powered Autocue Script Formatter

**Feature**: 006-i-wish-to
**Date**: 2025-10-16
**Based on**: [spec.md](spec.md) (FR-001 to FR-025)

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│  OllamaConfiguration│
│                     │
│  - serviceUrl       │
│  - connectionStatus │
│  - lastValidated    │
└─────────────────────┘
          │
          │ configures
          ▼
┌─────────────────────┐         ┌──────────────────────┐
│    ScriptDocument   │◄────────│   ProcessingRequest  │
│                     │  1:1    │                      │
│  - filename         │         │  - status            │
│  - fileSize         │         │  - retryCount        │
│  - uploadTimestamp  │         │  - submissionTime    │
│  - textContent      │         │  - completionTime    │
│  - htmlContent      │         │  - errorMessage      │
│  - formattingMeta   │         └──────────────────────┘
│  - validationStatus │                   │
└─────────────────────┘                   │ produces
          │                               │
          │ uses                          ▼
          │                    ┌──────────────────────┐
          ▼                    │   ProcessedOutput    │
┌─────────────────────┐        │                      │
│      AIModel        │        │  - formattedHtml     │
│                     │        │  - formattedText     │
│  - displayName      │        │  - diffData          │
│  - modelId          │        │  - editHistory       │
│  - availability     │        │  - generationTime    │
│  - lastHealthCheck  │        └──────────────────────┘
└─────────────────────┘
          │
          │ uses
          ▼
┌─────────────────────┐
│   AutocuePrompt     │
│                     │
│  - promptText       │
│  - version          │
│  - toolsConfig      │
└─────────────────────┘
```

---

## 1. ScriptDocument

**Purpose**: Represents an uploaded .docx script file with all content and formatting metadata.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` (UUID) | Required, unique | Unique identifier for the document |
| `filename` | `string` | Required, max 255 chars | Original filename with extension |
| `fileSize` | `number` | Required, > 0, ≤ 1073741824 (1GB) | File size in bytes |
| `uploadTimestamp` | `Date` | Required, auto-generated | When document was uploaded |
| `textContent` | `string` | Required | Plain text extracted from .docx (for AI processing) |
| `htmlContent` | `string` | Required | HTML representation with formatting (from mammoth.js) |
| `formattingMetadata` | `FormattingMetadata` | Required | Structured formatting information |
| `validationStatus` | `'valid' \| 'invalid' \| 'corrupted'` | Required, default: 'valid' | Validation result |
| `validationErrors` | `string[]` | Optional | List of validation error messages |

### FormattingMetadata Sub-Type

```typescript
interface FormattingMetadata {
  boldRanges: Range[]        // Positions of bold text
  italicRanges: Range[]      // Positions of italic text
  underlineRanges: Range[]   // Positions of underlined text
  headings: Heading[]        // H1, H2, H3 positions and text
  lists: ListItem[]          // Ordered/unordered list items
  paragraphs: Paragraph[]    // Paragraph boundaries
}

interface Range {
  start: number  // Character offset
  end: number    // Character offset
  text: string   // The formatted text
}

interface Heading {
  level: 1 | 2 | 3 | 4 | 5 | 6
  text: string
  position: number
}

interface ListItem {
  type: 'ordered' | 'unordered'
  text: string
  level: number  // Nesting level
  position: number
}

interface Paragraph {
  text: string
  start: number
  end: number
}
```

### Validation Rules (from FR-003, FR-005, FR-006)

```typescript
function validateScriptDocument(file: File): ValidationResult {
  const errors: string[] = []

  // FR-005: File size limit
  if (file.size > 1024 * 1024 * 1024) {
    errors.push('File size exceeds 1GB limit')
  }

  // FR-003: File format validation
  if (!file.name.endsWith('.docx')) {
    errors.push('File must be a .docx document')
  }

  // FR-006: Content validation (after parsing)
  if (textContent.trim().length === 0) {
    errors.push('Document is empty or corrupted')
  }

  return {
    status: errors.length === 0 ? 'valid' : 'invalid',
    errors
  }
}
```

### State Transitions

```
[Uploaded] ─validate─> [Valid] ──parse──> [Parsed]
    │
    └─validate─> [Invalid] (terminal)
    │
    └─parse error─> [Corrupted] (terminal)
```

### Storage

- **Location**: Browser memory (File object) + localStorage (metadata only)
- **Persistence**: Session-only (cleared on page refresh, but metadata persists)
- **Serialization**: Only metadata serialized to localStorage, file content kept in memory

---

## 2. AIModel

**Purpose**: Represents an available Ollama language model that can process scripts.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | Required, unique | Model identifier (e.g., "llama3.1:latest") |
| `displayName` | `string` | Required | Human-readable name (e.g., "Llama 3.1 70B") |
| `modelId` | `string` | Required | Ollama model ID |
| `availabilityStatus` | `'online' \| 'offline'` | Required | Current availability |
| `lastHealthCheck` | `Date` | Required | Last time availability was checked |
| `size` | `string` | Optional | Model size (e.g., "7B", "70B") |
| `capabilities` | `ModelCapabilities` | Required | What the model supports |

### ModelCapabilities Sub-Type

```typescript
interface ModelCapabilities {
  supportsToolCalling: boolean  // Can use Vercel AI SDK tools
  supportsStreaming: boolean    // Can stream responses
  maxTokens: number            // Maximum context length
}
```

### Validation Rules (from FR-007, FR-008)

```typescript
async function fetchAvailableModels(ollamaUrl: string): Promise<AIModel[]> {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`)
    const data = await response.json()

    return data.models
      .filter(m => m.status === 'online')  // FR-007: Only show available models
      .map(m => ({
        id: m.name,
        displayName: m.name.replace(':latest', ''),
        modelId: m.name,
        availabilityStatus: 'online',
        lastHealthCheck: new Date(),
        capabilities: {
          supportsToolCalling: ['llama3', 'mistral'].some(n => m.name.includes(n)),
          supportsStreaming: true,
          maxTokens: m.context_length || 4096,
        },
      }))
  } catch (error) {
    throw new Error('Failed to fetch models from Ollama service')
  }
}
```

### State Transitions

```
[Checking] ─health check─> [Online] ──periodic check──> [Online]
    │                                       │
    └─connection failed─> [Offline]        └─connection failed─> [Offline]
```

### Storage

- **Location**: React Query cache (fetched on-demand)
- **Persistence**: None (fetched fresh each session)
- **Refresh**: Every 30 seconds while page is active

---

## 3. ProcessingRequest

**Purpose**: Represents a single AI processing operation from upload to completion.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` (UUID) | Required, unique | Unique request identifier |
| `documentId` | `string` | Required, FK to ScriptDocument | Reference to document being processed |
| `modelId` | `string` | Required, FK to AIModel | Model used for processing |
| `status` | `ProcessingStatus` | Required | Current processing state |
| `retryCount` | `number` | Required, min: 0, max: 3 | Number of retry attempts (FR-014) |
| `submissionTimestamp` | `Date` | Required | When processing started |
| `completionTimestamp` | `Date \| null` | Optional | When processing finished |
| `errorMessage` | `string \| null` | Optional | Error details if failed |
| `streamingProgress` | `number` | Required, 0-100 | Percentage complete (for UI) |

### ProcessingStatus Enum

```typescript
type ProcessingStatus =
  | 'pending'       // Queued, not started
  | 'in_progress'   // Currently processing
  | 'streaming'     // Receiving AI response
  | 'completed'     // Successfully finished
  | 'failed'        // Failed after retries
```

### Validation Rules (from FR-010, FR-014, FR-015)

```typescript
function canRetry(request: ProcessingRequest): boolean {
  // FR-014: Auto-retry up to 3 times
  return request.status === 'failed' && request.retryCount < 3
}

function shouldBlockNewRequest(existingRequests: ProcessingRequest[]): boolean {
  // FR-010: Only one document at a time
  return existingRequests.some(r =>
    r.status === 'in_progress' || r.status === 'streaming'
  )
}
```

### State Transitions (from FR-014: 3 retries, FR-015: error after retries)

```
[Pending] ─start─> [In Progress] ─stream─> [Streaming] ─complete─> [Completed]
                        │                        │
                        │                        └─error (retry < 3)─> [In Progress]
                        │
                        └─error (retry >= 3)─> [Failed] (terminal)
```

### Storage

- **Location**: Zustand store (in-memory) + localStorage (metadata)
- **Persistence**: Metadata only (not AI response stream)
- **Cleanup**: Cleared after download or 24 hours

---

## 4. ProcessedOutput

**Purpose**: The AI-generated autocue-formatted result with diff data.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` (UUID) | Required, unique | Unique output identifier |
| `requestId` | `string` | Required, FK to ProcessingRequest | Parent request |
| `formattedHtml` | `string` | Required | AI-formatted HTML (preserves formatting) |
| `formattedText` | `string` | Required | Plain text version |
| `diffData` | `DiffData` | Required | Changes for diff viewer |
| `editHistory` | `Edit[]` | Required, default: [] | User edits after AI processing |
| `generationTimestamp` | `Date` | Required | When AI completed processing |
| `isEdited` | `boolean` | Required, default: false | Whether user made manual edits |

### DiffData Sub-Type

```typescript
interface DiffData {
  additions: Change[]
  deletions: Change[]
  modifications: Change[]
  originalLineCount: number
  modifiedLineCount: number
}

interface Change {
  type: 'add' | 'delete' | 'modify'
  lineNumber: number
  originalText?: string
  newText: string
  position: { start: number; end: number }
}
```

### Edit Sub-Type

```typescript
interface Edit {
  timestamp: Date
  type: 'manual' | 'ai_regenerate'
  changeDescription: string
  previousValue: string
  newValue: string
}
```

### Validation Rules (from FR-017, FR-018)

```typescript
function validateProcessedOutput(output: ProcessedOutput): boolean {
  // FR-017: Must preserve original formatting
  const originalFormattingTypes = extractFormattingTypes(originalHtml)
  const outputFormattingTypes = extractFormattingTypes(output.formattedHtml)

  return originalFormattingTypes.every(type =>
    outputFormattingTypes.includes(type)
  )
}
```

### State Transitions

```
[Generated] ─user edits─> [Edited] ─more edits─> [Edited]
    │                          │
    └─download─> [Downloaded]  └─download─> [Downloaded]
```

### Storage

- **Location**: localStorage (for session persistence per FR-022)
- **Persistence**: Until download or 24 hours (whichever comes first)
- **Serialization**: Full object serialized (including diff data)

---

## 5. OllamaConfiguration

**Purpose**: User settings for connecting to local Ollama service.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `serviceUrl` | `string` | Required, URL format, default: 'http://localhost:11434' | Ollama API endpoint |
| `connectionStatus` | `'configured' \| 'not-configured' \| 'error'` | Required | Current connection state |
| `lastValidationTimestamp` | `Date \| null` | Optional | Last time connection was tested |
| `lastValidationResult` | `ValidationResult \| null` | Optional | Result of last validation |

### ValidationResult Sub-Type

```typescript
interface ValidationResult {
  success: boolean
  errorMessage?: string
  modelsFound: number
  latencyMs: number
}
```

### Validation Rules (from FR-009, FR-024, FR-025)

```typescript
async function validateOllamaConnection(url: string): Promise<ValidationResult> {
  const start = Date.now()

  try {
    // FR-025: Validate connectivity
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      return {
        success: false,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
        modelsFound: 0,
        latencyMs: Date.now() - start,
      }
    }

    const data = await response.json()

    return {
      success: true,
      modelsFound: data.models?.length || 0,
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    return {
      success: false,
      errorMessage: error.message,
      modelsFound: 0,
      latencyMs: Date.now() - start,
    }
  }
}
```

### State Transitions

```
[Not Configured] ─set URL─> [Configured] ─validate success─> [Connected]
                                │
                                └─validate failed─> [Error]
                                        │
                                        └─retry─> [Configured]
```

### Storage

- **Location**: Settings page + localStorage (persisted)
- **Persistence**: Permanent (until user changes)
- **Default**: `http://localhost:11434`

---

## 6. AutocuePrompt

**Purpose**: Predefined system instructions for AI formatting (FR-012).

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `promptText` | `string` | Required | System prompt for AI |
| `version` | `string` | Required, semver format | Prompt version (e.g., "1.0.0") |
| `toolsConfig` | `ToolDefinition[]` | Required | Agent tools configuration |
| `createdAt` | `Date` | Required | When prompt was created |
| `updatedAt` | `Date` | Required | Last modification date |

### ToolDefinition Sub-Type

```typescript
interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, any>  // Zod schema as JSON
  enabled: boolean
}
```

### Current Prompt (v1.0.0)

```
You are an autocue script formatter. Your job is to transform scripts into teleprompter-ready format.

Use the available tools to:
1. Format paragraphs for optimal readability (proper line breaks, capitalization)
2. Add timing marks for pacing
3. Standardize capitalization (all caps for names, proper case for body text)
4. Remove unnecessary formatting that hinders reading

Maintain the original meaning and content. Focus on making the script easy to read aloud at a glance.
```

### Tools

1. **formatParagraph** - Reformat text with line breaks and capitalization
2. **addTimingMarks** - Insert pause indicators
3. **highlightNamesCaps** - Capitalize proper nouns
4. **removeUnnecessaryFormatting** - Clean distracting formatting

### Storage

- **Location**: `src/utils/aiPrompts.ts` (hardcoded)
- **Persistence**: Source code (not user-configurable in Phase 1)
- **Versioning**: Increment version on any change

---

## Relationships Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| `ScriptDocument` → `ProcessingRequest` | 1:many | One document can be processed multiple times |
| `AIModel` → `ProcessingRequest` | 1:many | One model can process many requests |
| `ProcessingRequest` → `ProcessedOutput` | 1:1 | Each request produces exactly one output |
| `OllamaConfiguration` → `AIModel` | 1:many | Config provides access to multiple models |
| `AutocuePrompt` → `ProcessingRequest` | 1:many | Same prompt used for all requests |

---

## Indexes & Performance

### localStorage Keys

```typescript
const STORAGE_KEYS = {
  OLLAMA_CONFIG: 'autocue:ollama-config',
  CURRENT_DOCUMENT: 'autocue:current-document',
  PROCESSING_REQUEST: 'autocue:processing-request',
  PROCESSED_OUTPUT: 'autocue:processed-output',
  SESSION_ID: 'autocue:session-id',
}
```

### React Query Keys

```typescript
export const queryKeys = {
  ollamaModels: (url: string) => ['ollama', 'models', url],
  processingRequest: (id: string) => ['processing', 'request', id],
  documentValidation: (filename: string) => ['document', 'validation', filename],
}
```

---

## Data Lifecycle

### Upload → Process → Download Flow

```
1. User uploads .docx
   → ScriptDocument created (in memory + localStorage metadata)

2. Document parsed
   → textContent & htmlContent & formattingMetadata populated

3. User selects model
   → AIModel fetched from Ollama (React Query cache)

4. User clicks "Format Script"
   → ProcessingRequest created (status: 'pending')
   → Request submitted to AI (status: 'in_progress')

5. AI streams response
   → ProcessingRequest updated (status: 'streaming', streamingProgress: 0-100)

6. AI completes
   → ProcessedOutput created
   → ProcessingRequest updated (status: 'completed')
   → DiffData generated

7. User edits (optional)
   → ProcessedOutput updated (editHistory appended, isEdited: true)

8. User downloads
   → .docx file generated from formattedHtml
   → Data persists in localStorage for 24 hours
```

### Cleanup Strategy

```typescript
// Clean up old data (runs on page load)
function cleanupOldData() {
  const sessionAge = Date.now() - getSessionStartTime()
  const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

  if (sessionAge > MAX_AGE) {
    localStorage.removeItem(STORAGE_KEYS.PROCESSED_OUTPUT)
    localStorage.removeItem(STORAGE_KEYS.PROCESSING_REQUEST)
  }
}
```

---

**Status**: Data model complete ✓
**Next Step**: Create API contracts (contracts/ directory)
