# Feature Specification: AI-Powered Autocue Script Formatter

**Feature Branch**: `006-i-wish-to`
**Created**: 2025-10-16
**Status**: Ready for Planning
**Input**: User description with 13 clarifications provided

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature: AI-powered autocue script formatting using local LLM
2. Extract key concepts from description
   → Actors: Video editors/producers
   → Actions: Upload document, select model, process with AI, review diff, edit, save
   → Data: DOCX files with formatting, AI responses, diff visualization
   → Constraints: Must preserve document formatting, 1GB file limit
3. All ambiguities resolved through user clarifications ✓
4. User scenarios defined with complete acceptance criteria ✓
5. Functional requirements are testable and unambiguous ✓
6. Key entities identified ✓
7. Review checklist passed ✓
8. Return: SUCCESS (spec ready for planning phase)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
As a video editor working on scripts for autocue/teleprompter, I need to upload my script document, have AI automatically format it for autocue presentation, see exactly what changed in a visual diff view, optionally edit the AI's suggestions, and download the final formatted script as a .docx file ready for use in teleprompter software.

### Acceptance Scenarios

1. **Given** I am on the Script Formatter page, **When** I click to upload a file and select a valid .docx file from my computer (up to 1GB), **Then** the system should parse and display the script text with all formatting preserved in a preview window

2. **Given** I have uploaded a script file, **When** I open the model selection dropdown, **Then** I should see only the currently available AI models (models that are online and accessible)

3. **Given** I have selected a file and chosen an available AI model, **When** I click submit, **Then** the system should send the script to the AI with a predefined autocue formatting prompt and display a progress indicator

4. **Given** my script is being processed by the AI, **When** processing is in progress, **Then** I should see a loading state indicating the system is working

5. **Given** AI processing has completed successfully, **When** results are returned, **Then** I should see a GitHub-style diff view showing the original text and AI-modified text side-by-side with changes highlighted

6. **Given** I am viewing the diff results, **When** I want to make manual adjustments, **Then** I should be able to edit the AI-generated text directly in the interface

7. **Given** I am satisfied with the formatted script (either AI-generated or after my edits), **When** I click save/download, **Then** the system should generate and download a .docx file with all formatting preserved

8. **Given** the AI service fails to respond, **When** the system detects an error, **Then** it should automatically retry up to 3 times before displaying an error message to me

### Edge Cases

- **What happens when the uploaded file is not a valid .docx format?**
  - System must reject the file immediately and display an error message: "Invalid file format. Please upload a .docx file."

- **What happens when the selected file exceeds 1GB?**
  - System must prevent the upload and display an error message: "File size exceeds 1GB limit. Please select a smaller file."

- **What happens when the document has no text content or is corrupted?**
  - System must validate document content after parsing and display an error: "Document is empty or corrupted. Please upload a valid script file."

- **What happens when the AI service returns an error after 3 retry attempts?**
  - System must display a user-friendly error message: "Unable to process your script. Please check your AI service connection in Settings and try again."

- **What happens when no AI models are available (e.g., Ollama service is down)?**
  - Dropdown should show a message: "No models available. Please check Ollama service in Settings."

- **What happens if the user has not configured the Ollama URL in settings?**
  - System should detect this on page load and display a warning with a link to Settings: "Ollama service not configured. Configure in Settings to use this feature."

- **What happens if the user tries to upload a second document while one is being processed?**
  - System should prevent this by disabling the upload button and displaying: "Please wait for current processing to complete."

- **What happens when the user navigates away while processing is in progress?**
  - System should show a browser confirmation dialog: "Processing in progress. Are you sure you want to leave?"

- **What happens when the downloaded .docx file fails to generate?**
  - System should display an error: "Failed to generate document. Please try again."

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to upload .docx (Microsoft Word) document files from their local filesystem via file picker dialog

- **FR-002**: System MUST parse uploaded .docx files and extract all text content while preserving formatting metadata (bold, italic, underline, paragraph breaks, headings, lists)

- **FR-003**: System MUST display the parsed script text with all original formatting visible in a preview window immediately after upload

- **FR-004**: System MUST validate uploaded files to ensure they are valid .docx format and reject invalid files with a clear error message

- **FR-005**: System MUST enforce a maximum file size limit of 1GB (1,024 MB) for uploads and reject larger files with a clear error message

- **FR-006**: System MUST validate that uploaded documents contain text content and reject empty or corrupted files with a clear error message

- **FR-007**: System MUST provide a dropdown list showing only currently available AI models (models that are online and responding)

- **FR-008**: System MUST detect when no AI models are available and display an appropriate message in the dropdown

- **FR-009**: System MUST detect when Ollama service is not configured and display a warning message with link to Settings

- **FR-010**: System MUST prevent users from processing multiple documents simultaneously (only one document at a time)

- **FR-011**: System MUST submit the parsed document text and formatting to the selected AI model when user clicks submit

- **FR-012**: System MUST send a predefined system prompt to the AI instructing it to format the script for autocue/teleprompter presentation

- **FR-013**: System MUST display a clear loading/progress indicator while the AI is processing the document

- **FR-014**: System MUST automatically retry failed AI requests up to 3 times before reporting an error to the user

- **FR-015**: System MUST display a user-friendly error message after 3 failed retry attempts, informing the user to check their Ollama service configuration

- **FR-016**: System MUST display AI-processed results in a GitHub-style diff view showing original text and modified text side-by-side with changes highlighted

- **FR-017**: System MUST preserve all original document formatting (bold, italic, underline, paragraphs, headings, lists) in the diff view

- **FR-018**: System MUST allow users to edit the AI-generated text directly within the diff view interface

- **FR-019**: System MUST provide a save/download button that becomes enabled after AI processing completes or user makes edits

- **FR-020**: System MUST generate a .docx file containing the final formatted script (either AI-generated or user-edited) with all formatting preserved

- **FR-021**: System MUST trigger a browser download when the user clicks save, providing the .docx file for download

- **FR-022**: System MUST store processing results temporarily in browser local storage to persist data between page refreshes during the editing session

- **FR-023**: System MUST warn users before navigating away if document processing is in progress

- **FR-024**: System MUST provide access to Ollama service URL configuration in the Settings page

- **FR-025**: System MUST validate Ollama service connectivity using the configured URL before allowing model selection

### Non-Functional Requirements

- **NFR-001**: Upload and parsing of a 100MB .docx file MUST complete within 30 seconds

- **NFR-002**: AI processing time MUST be displayed to the user so they understand the operation is progressing

- **NFR-003**: The diff view MUST clearly highlight additions, deletions, and modifications using distinct visual indicators (colors, strikethrough, etc.)

- **NFR-004**: The interface MUST remain responsive during AI processing (no UI freezing)

- **NFR-005**: Error messages MUST be clear, actionable, and user-friendly (avoid technical jargon)

### Key Entities

- **Script Document**: A .docx file containing autocue/teleprompter script text. Has attributes:
  - Filename (string)
  - File size in bytes (integer, max 1,073,741,824 bytes / 1GB)
  - Upload timestamp (datetime)
  - Raw text content (string)
  - Formatting metadata (bold, italic, underline, headings, lists)
  - Validation status (valid/invalid/corrupted)

- **AI Model**: Represents an available Ollama language model. Has attributes:
  - Display name (string, e.g., "Llama 3.1", "Mistral")
  - Model identifier (string, e.g., "llama3.1:latest")
  - Availability status (online/offline)
  - Last health check timestamp (datetime)
  - Relates to Processing Request

- **Processing Request**: Represents a single document processing operation. Has attributes:
  - Original document reference (Script Document)
  - Selected model reference (AI Model)
  - Processing status (pending/in-progress/completed/failed)
  - Retry count (integer, 0-3)
  - Submission timestamp (datetime)
  - Completion timestamp (datetime, nullable)
  - Error message (string, nullable)
  - Relates to Script Document, AI Model, and Processed Output

- **Processed Output**: The AI-generated autocue-formatted result. Has attributes:
  - Formatted text content (string)
  - Formatting metadata (preserves bold, italic, etc.)
  - Generation timestamp (datetime)
  - Diff data (array of changes: additions, deletions, modifications)
  - Edit history (tracks user edits after AI processing)
  - Relates to Processing Request and original Script Document

- **Ollama Configuration**: Service connection settings stored in application settings. Has attributes:
  - Service URL (string, e.g., "http://localhost:11434")
  - Connection status (configured/not-configured)
  - Last validation timestamp (datetime)
  - Last validation result (success/failure)

- **Autocue Formatting Prompt**: Predefined system instructions for AI. Has attributes:
  - Prompt text (string, defines autocue formatting rules)
  - Version (string, for tracking prompt iterations)
  - Agent/tools configuration (instructions for AI to act as formatting agent with specific tools)

---

## Technical Constraints (For Planning Phase)

**Note**: These are provided for the planning phase and implementation, not for business stakeholders.

### Required Technologies
- **AI SDK**: Vercel AI SDK v5
- **LLM Provider**: Local Ollama models only (Phase 1)
- **Document Parsing**: Library capable of reading .docx with formatting preservation
- **Diff Visualization**: GitHub-style diff component/library
- **File Generation**: Library capable of writing .docx with formatting
- **Storage**: Browser localStorage for temporary session data

### Integration Points
- **Settings Page**: Must add Ollama URL configuration field
- **Script Formatter Page**: Existing page at `src/pages/AI/ScriptFormatter/ScriptFormatter.tsx`

### Prompt Engineering Approach
- Prompt should be structured as an agent with tool-calling capabilities
- Define specific formatting tools (e.g., `format_paragraph`, `add_timing_marks`, `standardize_capitalization`)
- Allow iterative refinement through tool use

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details in core spec (tech details in separate section)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (all 13 clarified)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded (single-document, Ollama-only, Phase 1)
- [x] Dependencies identified (Ollama service, Settings integration)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities resolved (13 clarifications provided)
- [x] User scenarios defined (8 acceptance scenarios, 9 edge cases)
- [x] Requirements generated (25 functional, 5 non-functional)
- [x] Entities identified (6 key entities)
- [x] Review checklist passed
- [x] **READY FOR PLANNING PHASE**

---

## Clarifications Provided (Reference)

1. ✅ **AI Processing Purpose**: Format text for autocue/teleprompter scripts with predefined prompt
2. ✅ **API Key Management**: Ollama URL stored in Settings page (no API keys for local Ollama)
3. ✅ **Supported AI Providers**: Local Ollama models only (Phase 1)
4. ✅ **Output Format**: GitHub-style diff view showing changes side-by-side
5. ✅ **Result Persistence**: Temporary storage in browser localStorage during session
6. ✅ **Download Capability**: Yes, download as .docx file with formatting preserved
7. ✅ **Output Editability**: Yes, users can edit AI output before saving
8. ✅ **File Size Limits**: Maximum 1GB (1,024 MB)
9. ✅ **Error Handling Strategy**: Auto-retry 3 times before showing error
10. ✅ **Model Availability Display**: Only show available models in dropdown
11. ✅ **Usage Tracking**: Not required in Phase 1
12. ✅ **Processing Instructions**: Predefined prompt structured as agent with tools
13. ✅ **Concurrent Processing**: One document at a time only

---

## Success Criteria

This feature will be considered successful when:

1. **Upload Success Rate**: 95%+ of valid .docx files upload and parse correctly
2. **AI Processing Success Rate**: 90%+ of processing requests complete successfully (after retries)
3. **Formatting Preservation**: 100% of original formatting types (bold, italic, underline, headings, lists) are preserved in output
4. **User Completion Rate**: 80%+ of users who start processing complete the workflow (upload → process → download)
5. **Download Success Rate**: 98%+ of generated .docx files download successfully and open in Word/compatible software
6. **Error Recovery**: 100% of connection errors result in clear, actionable error messages
7. **Performance**: 95%+ of 10MB files process end-to-end in under 2 minutes

---