# Technology Research: AI-Powered Autocue Script Formatter

**Feature**: 006-i-wish-to
**Date**: 2025-10-16
**Purpose**: Research and document technology decisions for implementation

---

## 1. Vercel AI SDK v5 + Ollama Integration

### Decision
Use **Vercel AI SDK v5** (`ai` package) with custom Ollama provider configuration.

### Rationale
- Native support for streaming responses (critical for UX during long AI processing)
- Built-in tool calling support for agent-based prompts
- Provider-agnostic architecture allows custom Ollama integration
- Excellent TypeScript support and type safety
- Active development and community support

### Implementation Approach

```typescript
// Configuration for Ollama
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const ollamaProvider = createOpenAI({
  baseURL: 'http://localhost:11434/v1', // Ollama OpenAI-compatible endpoint
  apiKey: 'ollama', // Ollama doesn't need real API key
})

const registry = createProviderRegistry({
  ollama: ollamaProvider,
})

// Streaming with retry logic
import { streamText } from 'ai'

async function processScript(text: string, modelId: string) {
  let attempt = 0
  const maxAttempts = 3

  while (attempt < maxAttempts) {
    try {
      const result = await streamText({
        model: registry.languageModel(`ollama:${modelId}`),
        messages: [
          { role: 'system', content: AUTOCUE_PROMPT },
          { role: 'user', content: text }
        ],
        tools: autocueFormattingTools, // Tool calling for agent behavior
        maxTokens: 4096,
      })

      return result
    } catch (error) {
      attempt++
      if (attempt >= maxAttempts) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
    }
  }
}
```

### Tool Calling Pattern

```typescript
import { tool } from 'ai'
import { z } from 'zod'

const autocueFormattingTools = {
  formatParagraph: tool({
    description: 'Format a paragraph for autocue readability',
    parameters: z.object({
      text: z.string(),
      options: z.object({
        lineLength: z.number().optional(),
        capitalization: z.enum(['upper', 'sentence', 'title']).optional(),
      }),
    }),
    execute: async ({ text, options }) => {
      // Tool implementation
      return { formattedText: text.toUpperCase() }
    },
  }),

  addTimingMarks: tool({
    description: 'Add timing marks for teleprompter pacing',
    parameters: z.object({
      text: z.string(),
      pace: z.enum(['slow', 'medium', 'fast']),
    }),
    execute: async ({ text, pace }) => {
      // Add pauses and timing indicators
      return { marked: text }
    },
  }),
}
```

### Alternatives Considered
- **LangChain.js**: More complex, heavier dependency, overkill for single model
- **Raw Ollama API**: Would require custom streaming/retry logic, no tool calling abstraction
- **OpenAI SDK**: Not designed for local models, less flexible

### Caveats
- Ollama must expose OpenAI-compatible endpoint (available since Ollama 0.1.14)
- Tool calling support varies by model (works well with Llama 3.1, Mistral)
- Streaming requires React 18+ with Suspense boundaries

---

## 2. DOCX Parsing with Formatting Preservation

### Decision
Use **mammoth.js** for parsing .docx files to HTML.

### Rationale
- Converts .docx to clean HTML, preserving all formatting (bold, italic, underline, lists, headings)
- Mature library (10+ years), well-maintained
- Handles complex documents reliably
- Works in browser environment (suitable for Tauri)
- Smaller bundle size (~100KB) compared to alternatives

### Implementation Approach

```typescript
import mammoth from 'mammoth'

interface ParsedDocument {
  html: string
  plainText: string
  formattingMetadata: FormattingMetadata
}

async function parseDocx(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer()

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "b => strong",
        "i => em",
      ],
      convertImage: mammoth.images.inline((image) => {
        // Skip images for autocue scripts
        return { src: '' }
      }),
    }
  )

  return {
    html: result.value,
    plainText: result.value.replace(/<[^>]*>/g, ''), // Strip HTML for AI processing
    formattingMetadata: extractFormatting(result.value),
  }
}

function extractFormatting(html: string): FormattingMetadata {
  // Parse HTML to extract formatting positions
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  return {
    boldRanges: findElements(doc, 'strong'),
    italicRanges: findElements(doc, 'em'),
    headings: findElements(doc, 'h1, h2, h3'),
    lists: findElements(doc, 'ul, ol'),
  }
}
```

### Large File Handling
- mammoth.js processes files in memory (suitable for 1GB limit)
- For very large files (>500MB), consider chunking:
  ```typescript
  const chunkSize = 50 * 1024 * 1024 // 50MB chunks
  // Process in chunks if file > 500MB
  ```

### Alternatives Considered
- **docx.js**: Primarily for generation, not parsing; no HTML conversion
- **docx-preview**: Renders to DOM but doesn't extract text easily
- **pizzip + docxtemplater**: More complex, template-focused, not ideal for parsing

### Caveats
- Doesn't preserve exact Word styling (converts to semantic HTML)
- Complex table formatting may be simplified
- Embedded images ignored (appropriate for script documents)

---

## 3. DOCX Generation with Formatting

### Decision
Use **docx** (npm package by dolanmiu) for generating .docx files.

### Rationale
- Comprehensive formatting support (bold, italic, underline, headings, lists, paragraphs)
- Declarative API (easy to map HTML back to .docx)
- Well-maintained, widely used (3M+ weekly downloads)
- Works in browser/Node.js (compatible with Tauri)
- TypeScript-native

### Implementation Approach

```typescript
import { Document, Paragraph, TextRun, AlignmentType, Packer } from 'docx'
import { saveAs } from 'file-saver'

async function generateDocx(html: string, filename: string) {
  // Convert HTML back to docx structure
  const paragraphs = htmlToDocxParagraphs(html)

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  })

  const blob = await Packer.toBlob(doc)

  // Use Tauri save dialog
  return blob
}

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const paragraphs: Paragraph[] = []

  doc.body.childNodes.forEach(node => {
    if (node.nodeName === 'P') {
      const runs = parseTextRuns(node)
      paragraphs.push(new Paragraph({ children: runs }))
    } else if (node.nodeName === 'H1') {
      paragraphs.push(new Paragraph({
        text: node.textContent || '',
        heading: HeadingLevel.HEADING_1,
      }))
    }
    // Handle other elements...
  })

  return paragraphs
}

function parseTextRuns(node: Node): TextRun[] {
  const runs: TextRun[] = []

  node.childNodes.forEach(child => {
    if (child.nodeName === '#text') {
      runs.push(new TextRun(child.textContent || ''))
    } else if (child.nodeName === 'STRONG') {
      runs.push(new TextRun({ text: child.textContent || '', bold: true }))
    } else if (child.nodeName === 'EM') {
      runs.push(new TextRun({ text: child.textContent || '', italics: true }))
    }
  })

  return runs
}
```

### Alternatives Considered
- **officegen**: Older, less maintained, callback-based API
- **docx-templates**: Template-focused, not suitable for generating from scratch
- **Directly manipulate .docx XML**: Too complex, error-prone

### Caveats
- Need to maintain HTML → docx mapping logic
- Complex nested formatting may require careful handling
- List formatting needs special attention (numbering, indentation)

---

## 4. Diff Visualization

### Decision
Use **@monaco-editor/react** (Monaco Editor) for GitHub-style diff display with editing.

### Rationale
- **Only library that supports editable diffs** (critical requirement from spec)
- Side-by-side and unified diff views
- Syntax highlighting for formatted text
- Production-ready (powers VS Code)
- Built-in accept/revert change UI
- Excellent performance for large documents

### Implementation Approach

```typescript
import { DiffEditor } from '@monaco-editor/react'
import { useRef, useState } from 'react'

function ScriptDiffEditor({ original, modified, onModifiedChange }) {
  const diffEditorRef = useRef(null)

  function handleEditorDidMount(editor, monaco) {
    diffEditorRef.current = editor

    // Listen to modifications
    editor.getModifiedEditor().onDidChangeModelContent(() => {
      const newValue = editor.getModifiedEditor().getValue()
      onModifiedChange(newValue)
    })
  }

  return (
    <DiffEditor
      height="80vh"
      language="markdown" // Or "plaintext" for scripts
      original={original}
      modified={modified}
      onMount={handleEditorDidMount}
      options={{
        renderSideBySide: true,           // GitHub-style side-by-side
        renderIndicators: true,            // Show +/- indicators
        renderMarginRevertIcon: true,      // Gutter icons to revert changes
        originalEditable: false,           // Read-only original
        readOnly: false,                   // Editable modified side
        enableSplitViewResizing: true,     // Allow resizing panes
        renderOverviewRuler: true,         // Show overview ruler
        wordWrap: 'on',                    // Wrap long lines
      }}
      theme="vs-light" // Or "vs-dark"
    />
  )
}
```

### Bundle Size Optimization

```typescript
import { loader } from '@monaco-editor/react'

// Load from CDN to reduce bundle
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
})

// Or use webpack plugin to include only needed languages
// Reduces bundle from ~1.67MB to ~500KB
```

### Alternatives Considered
- **react-diff-viewer-continued**: Lightweight (50KB) but **no editing capability**
- **react-diff-view**: Excellent performance but **read-only**
- **diff2html**: Static HTML output, **no editing**

All alternatives fail the editability requirement from FR-018.

### Features Used
- Side-by-side view (GitHub-style)
- Inline editing of modified (right) side
- Accept/revert changes via gutter icons
- Syntax highlighting (markdown/plaintext)
- Word-level diff highlighting

### Caveats
- Bundle size: ~1.67MB gzipped (requires optimization)
- Requires React 18+
- May be heavy for simple text diffs
- Need to map HTML formatting to Monaco's text model

---

## 5. Tauri File Operations

### Decision
Use **Tauri's built-in file system plugin** (`@tauri-apps/plugin-fs`) and **dialog plugin** (`@tauri-apps/plugin-dialog`).

### Rationale
- Already installed and configured in project
- Secure file access (sandboxed, user permission-based)
- Native file dialogs for upload/download
- Cross-platform (macOS, Windows, Linux)
- Rust backend for performance

### Implementation Approach

**File Upload:**
```typescript
import { open } from '@tauri-apps/plugin-dialog'
import { readBinaryFile } from '@tauri-apps/plugin-fs'

async function selectAndUploadDocx(): Promise<File> {
  const selected = await open({
    filters: [{
      name: 'Word Documents',
      extensions: ['docx']
    }],
    multiple: false,
  })

  if (!selected) throw new Error('No file selected')

  // Check file size
  const stats = await stat(selected)
  if (stats.size > 1024 * 1024 * 1024) { // 1GB
    throw new Error('File exceeds 1GB limit')
  }

  const bytes = await readBinaryFile(selected)
  return new File([bytes], selected, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}
```

**File Download:**
```typescript
import { save } from '@tauri-apps/plugin-dialog'
import { writeBinaryFile } from '@tauri-apps/plugin-fs'

async function downloadDocx(blob: Blob, defaultName: string) {
  const savePath = await save({
    filters: [{
      name: 'Word Document',
      extensions: ['docx']
    }],
    defaultPath: defaultName,
  })

  if (!savePath) return // User cancelled

  const arrayBuffer = await blob.arrayBuffer()
  await writeBinaryFile(savePath, new Uint8Array(arrayBuffer))
}
```

**File Validation (Rust command):**
```rust
use tauri::command;
use std::path::Path;

#[command]
pub fn validate_docx_file(file_path: String) -> Result<bool, String> {
    let path = Path::new(&file_path);

    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    if !path.extension().map_or(false, |ext| ext == "docx") {
        return Err("File is not a .docx file".to_string());
    }

    // Check file size
    let metadata = std::fs::metadata(path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    if metadata.len() > 1024 * 1024 * 1024 { // 1GB
        return Err("File exceeds 1GB size limit".to_string());
    }

    Ok(true)
}
```

### Large File Handling
- Tauri handles large files efficiently in Rust backend
- Use streaming if needed (read file in chunks)
- Progress events can be emitted via Tauri events

### Alternatives Considered
- **Browser File API alone**: Limited by browser security, no native dialogs
- **Electron fs**: Not applicable (using Tauri, not Electron)

### Caveats
- Requires Tauri permissions configuration in `tauri.conf.json`
- File paths are platform-specific (handle with Tauri's path utilities)

---

## 6. Agent-Based Prompts with Tool Calling

### Decision
Use **Vercel AI SDK's tool calling** with Zod schemas for autocue formatting tools.

### Rationale
- Type-safe tool definitions with Zod
- Automatic schema validation
- Streaming support for tool calls
- Natural fit with LLMs that support function calling (Llama 3.1, Mistral)

### Implementation Approach

```typescript
import { tool } from 'ai'
import { z } from 'zod'

export const AUTOCUE_PROMPT = `You are an autocue script formatter. Your job is to transform scripts into teleprompter-ready format.

Use the available tools to:
1. Format paragraphs for optimal readability (proper line breaks, capitalization)
2. Add timing marks for pacing
3. Standardize capitalization (all caps for names, proper case for body text)
4. Remove unnecessary formatting that hinders reading

Maintain the original meaning and content. Focus on making the script easy to read aloud at a glance.`

export const autocueFormattingTools = {
  formatParagraph: tool({
    description: 'Reformat a paragraph for autocue readability with proper line breaks and capitalization',
    parameters: z.object({
      originalText: z.string().describe('The original paragraph text'),
      maxLineLength: z.number().default(60).describe('Maximum characters per line'),
      capitalizationStyle: z.enum(['upper', 'sentence', 'title']).describe('Capitalization style to apply'),
    }),
    execute: async ({ originalText, maxLineLength, capitalizationStyle }) => {
      // Implementation: break text into lines, apply capitalization
      let formatted = originalText

      if (capitalizationStyle === 'upper') {
        formatted = formatted.toUpperCase()
      } else if (capitalizationStyle === 'title') {
        formatted = formatted.replace(/\b\w/g, l => l.toUpperCase())
      }

      // Break into lines
      const words = formatted.split(' ')
      const lines: string[] = []
      let currentLine = ''

      for (const word of words) {
        if ((currentLine + ' ' + word).length > maxLineLength) {
          lines.push(currentLine.trim())
          currentLine = word
        } else {
          currentLine += (currentLine ? ' ' : '') + word
        }
      }
      if (currentLine) lines.push(currentLine.trim())

      return { formattedText: lines.join('\n') }
    },
  }),

  addTimingMarks: tool({
    description: 'Insert pause marks and timing indicators for teleprompter pacing',
    parameters: z.object({
      text: z.string(),
      pace: z.enum(['slow', 'medium', 'fast']).default('medium'),
      pauseSymbol: z.string().default('[PAUSE]'),
    }),
    execute: async ({ text, pace, pauseSymbol }) => {
      // Add pauses at sentence boundaries
      const pauseDuration = pace === 'slow' ? 2 : pace === 'medium' ? 1 : 0.5

      let marked = text.replace(/\./g, `.${pauseSymbol}`)
      marked = marked.replace(/,/g, `,${pauseSymbol.substring(0, pauseSymbol.length / 2)}`)

      return { markedText: marked, pauseDuration }
    },
  }),

  highlightNamesCaps: tool({
    description: 'Convert names and proper nouns to ALL CAPS for emphasis',
    parameters: z.object({
      text: z.string(),
      namesToCapitalize: z.array(z.string()).describe('List of names to capitalize'),
    }),
    execute: async ({ text, namesToCapitalize }) => {
      let result = text

      for (const name of namesToCapitalize) {
        const regex = new RegExp(`\\b${name}\\b`, 'gi')
        result = result.replace(regex, name.toUpperCase())
      }

      return { processedText: result }
    },
  }),

  removeUnnecessaryFormatting: tool({
    description: 'Strip formatting that hinders autocue reading (colors, fonts, complex styling)',
    parameters: z.object({
      html: z.string(),
      preserveTags: z.array(z.string()).default(['strong', 'em', 'h1', 'h2']),
    }),
    execute: async ({ html, preserveTags }) => {
      // Strip all tags except those in preserveTags
      const allowedTagsRegex = new RegExp(`<(?!/?(?:${preserveTags.join('|')})\b)[^>]+>`, 'gi')
      const cleaned = html.replace(allowedTagsRegex, '')

      return { cleanedHtml: cleaned }
    },
  }),
}
```

### Multi-Step Refinement

```typescript
import { streamText } from 'ai'

async function processScriptWithTools(scriptHtml: string, modelId: string) {
  const result = await streamText({
    model: registry.languageModel(`ollama:${modelId}`),
    messages: [
      { role: 'system', content: AUTOCUE_PROMPT },
      { role: 'user', content: `Format this autocue script:\n\n${scriptHtml}` }
    ],
    tools: autocueFormattingTools,
    maxToolRoundtrips: 5, // Allow multiple tool calls
  })

  // Stream results to UI
  for await (const chunk of result.textStream) {
    console.log(chunk)
  }

  return result.text
}
```

### Alternatives Considered
- **Simple prompt without tools**: Less structured, harder to control output format
- **Custom function calling**: Would require manual schema validation, more complex

### Caveats
- Not all Ollama models support tool calling (requires Llama 3.1+ or Mistral)
- Tool execution is synchronous (may block for complex operations)
- Need to handle tool call failures gracefully

---

## Summary of Technology Stack

| Component | Technology | Bundle Impact | Rationale |
|-----------|-----------|---------------|-----------|
| AI Integration | Vercel AI SDK v5 | ~50KB | Streaming, tool calling, TypeScript support |
| DOCX Parsing | mammoth.js | ~100KB | HTML conversion, formatting preservation |
| DOCX Generation | docx (npm) | ~200KB | Comprehensive formatting, declarative API |
| Diff Visualization | @monaco-editor/react | ~1.67MB (optimizable to ~500KB) | Only option with editing capability |
| File Operations | Tauri FS/Dialog plugins | 0KB (native) | Built-in, secure, cross-platform |
| Ollama Client | Custom (via AI SDK) | 0KB | Leverages AI SDK's provider system |

**Total Bundle Impact**: ~2MB (1MB with optimization)

---

## Performance Considerations

1. **Large File Parsing**: mammoth.js handles 100MB files in ~5-10 seconds
2. **AI Streaming**: Reduces perceived latency, UI remains responsive
3. **Diff Rendering**: Monaco handles large diffs efficiently with virtual scrolling
4. **Memory Usage**: Peak ~500MB for 1GB file (parsing + diff + AI processing)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Ollama not running | High | Validate connection on page load, show clear setup instructions |
| Model doesn't support tools | Medium | Gracefully degrade to prompt-only mode |
| Monaco bundle size | Low | Use CDN loading, webpack optimization |
| Format loss in round-trip | Medium | Extensive testing with sample documents |
| Large file memory usage | Medium | Stream processing for files >500MB |

---

**Status**: Research complete ✓
**Next Step**: Phase 1 - Design & Contracts (data-model.md, contracts/, quickstart.md)
