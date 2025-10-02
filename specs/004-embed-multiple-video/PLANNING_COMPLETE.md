# Planning Complete: Sprout Video URL Auto-Fetch

**Date**: 2025-09-30
**Feature**: 004-embed-multiple-video (Phase 2 Enhancement)
**Branch**: `004-embed-multiple-video`

## Summary

Successfully planned and generated tasks for implementing **automatic Sprout Video URL parsing and metadata fetching** in the Baker video links section. This enhancement allows users to enter only a Sprout Video URL, and the system automatically extracts the video ID and fetches metadata (title, thumbnail, duration) from the Sprout Video API.

---

## Deliverables Generated

### 1. Updated Research Documentation
**File**: `specs/004-embed-multiple-video/research.md`

**New Section**: #6 - Sprout Video URL Parsing and API Fetching
- Researched Sprout Video API endpoints
- Documented URL patterns (public and embed formats)
- Defined implementation strategy
- Created code examples for all three layers (TypeScript, Rust, React)

**Key Findings**:
- API Endpoint: `GET https://api.sproutvideo.com/v1/videos/:id`
- Authentication: `SproutVideo-Api-Key` header (existing pattern)
- Response includes: id, title, description, duration, thumbnail URLs
- Two URL formats to support: public (`sproutvideo.com/videos/{id}`) and embed (`videos.sproutvideo.com/embed/{id}/...`)

### 2. Updated API Contracts
**File**: `specs/004-embed-multiple-video/contracts/tauri-commands.md`

**New Command**: #11 - `fetch_sprout_video_details`
```rust
pub async fn fetch_sprout_video_details(
    video_id: String,
    api_key: String,
) -> Result<SproutVideoDetails, String>
```

**New Hook**: `useSproutVideoApi`
```typescript
export function useSproutVideoApi() {
  const fetchVideoDetails = useMutation({
    mutationFn: async ({ videoUrl, apiKey }) => {
      const videoId = parseSproutVideoUrl(videoUrl)
      if (!videoId) throw new Error('Invalid Sprout Video URL format')

      return await invoke<SproutVideoDetails>('fetch_sprout_video_details', {
        videoId,
        apiKey
      })
    }
  })
  // ...
}
```

**New Helper**: `parseSproutVideoUrl(url: string): string | null`

### 3. Updated Implementation Plan
**File**: `specs/004-embed-multiple-video/plan.md`

**Updates**:
- Filled Technical Context with user requirements
- Passed Constitution Check (no violations)
- Updated Phase 2 task planning approach
- Marked Phases 0-2 complete
- Added new library to architecture section: `useSproutVideoApi`

### 4. Executable Task Breakdown
**File**: `specs/004-embed-multiple-video/tasks-url-parsing.md`

**Statistics**:
- **Total Tasks**: 33 (T001-T033)
- **Lines**: 370
- **Parallel Tasks**: 13 marked with [P]
- **Test Tasks**: 11 (must fail before implementation)

**Task Distribution**:
- Phase 3.1 Setup: 2 tasks
- Phase 3.2 Tests (TDD): 11 tasks ⚠️
- Phase 3.3 Implementation: 7 tasks
- Phase 3.4 UI Integration: 3 tasks
- Phase 3.5 Polish: 5 tasks
- Phase 3.6 Manual Testing: 5 tasks

---

## Technical Architecture

### Frontend (TypeScript/React)

**New Files to Create**:
1. `src/utils/parseSproutVideoUrl.ts` - URL parser with regex
2. `src/utils/__tests__/parseSproutVideoUrl.test.ts` - Parser tests
3. `src/hooks/useSproutVideoApi.ts` - React Query hook
4. `src/hooks/__tests__/useSproutVideoApi.test.ts` - Hook tests

**Files to Modify**:
1. `src/types/media.ts` - Add SproutVideoDetails interface
2. `src/components/Baker/VideoLinksManager.tsx` - Add auto-fetch UI
3. `src/utils/index.ts` - Export new parser
4. `src/hooks/index.ts` - Export new hook

### Backend (Rust/Tauri)

**New Files to Create**:
1. `src-tauri/src/commands/tests/sprout_video_tests.rs` - Command tests

**Files to Modify**:
1. `src-tauri/src/media.rs` - Add SproutVideoDetails struct
2. `src-tauri/src/commands/sprout_video.rs` - Add fetch command
3. `src-tauri/src/main.rs` - Register new command

---

## Implementation Strategy

### TDD Cycle (NON-NEGOTIABLE)

```
Phase 3.2: Write Tests (RED) ⚠️
    ├── T003-T006: URL parsing tests (MUST FAIL)
    ├── T007-T010: Tauri command tests (MUST FAIL)
    └── T011-T013: React hook tests (MUST FAIL)
         ↓
Phase 3.3: Implementation (GREEN) ✅
    ├── T014-T015: parseSproutVideoUrl implementation
    ├── T016-T018: Rust command implementation
    └── T019-T020: React hook implementation
         ↓
Phase 3.4: UI Integration
    └── T021-T023: VideoLinksManager updates
         ↓
Phase 3.5: Polish (REFACTOR) ♻️
    └── T024-T028: Edge cases, logging, docs
         ↓
Phase 3.6: Manual Testing
    └── T029-T033: End-to-end validation
```

### Parallel Execution Opportunities

**During Testing (Phase 3.2)**:
```bash
# Run all frontend tests together
npm run test src/utils/__tests__/parseSproutVideoUrl.test.ts \
             src/hooks/__tests__/useSproutVideoApi.test.ts

# Run all backend tests together
cd src-tauri && cargo test sprout_video_tests
```

**During Implementation (Phase 3.3)**:
- Terminal 1: Frontend URL parsing (T014-T015)
- Terminal 2: Backend Rust command (T016-T018)
- Terminal 3: Frontend React hook (T019-T020)

All three can be developed in parallel as they touch different files.

---

## User Experience Flow

### Before (Current State)
1. User clicks "Add Video"
2. User manually enters: URL, title, Sprout Video ID, thumbnail URL
3. User clicks "Add Video"

### After (New Flow)
1. User clicks "Add Video"
2. User enters Sprout Video URL only
3. System auto-fetches metadata (title, thumbnail, ID) via API
4. Form fields auto-populate ✨
5. User can override if needed
6. User clicks "Add Video"

### Error Handling
- **Invalid URL format** → Show inline error, allow manual entry
- **Network failure** → Show error message, allow retry or manual entry
- **Video not found (404)** → Show "Video not found or access denied"
- **No API key** → Prompt to add in Settings

---

## Performance Targets

- **URL Parsing**: <100ms (regex matching)
- **API Fetch**: <500ms (network request to Sprout API)
- **Total UX**: User sees auto-populated fields within 500ms of entering URL

Performance logging added in T027 to track API fetch duration.

---

## Testing Strategy

### Unit Tests (Vitest)
- URL parsing with various formats
- Invalid URL handling
- Edge cases (empty, malformed, wrong domain)

### Contract Tests (Rust)
- Mock Sprout API responses
- Success case (200 OK)
- Error cases (404, network failure, invalid JSON)

### Integration Tests (Vitest + React Testing Library)
- React hook with mocked Tauri invoke
- Success and error state management
- TanStack React Query integration

### Manual Tests
- Happy path with real Sprout Video URL
- Invalid URLs and error recovery
- Network offline scenario
- Manual override of auto-filled data
- Full quickstart workflow validation

---

## Git Status

**Modified Files** (not yet committed):
- `specs/004-embed-multiple-video/research.md`
- `specs/004-embed-multiple-video/contracts/tauri-commands.md`
- `specs/004-embed-multiple-video/plan.md`

**New Files** (untracked):
- `specs/004-embed-multiple-video/tasks-url-parsing.md`

**Recommendation**: Commit planning artifacts before starting implementation.

---

## Next Steps

### Option 1: Commit Planning Work
```bash
git add specs/004-embed-multiple-video/
git commit -m "plan: Add Sprout Video URL auto-fetch feature planning

- Research Sprout Video API endpoints and URL patterns
- Define fetch_sprout_video_details Tauri command contract
- Create useSproutVideoApi React Query hook design
- Generate 33 executable tasks with TDD approach
- Update contracts with command #11 and new hook
- Document URL parsing strategy and error handling

Tasks ready for implementation following RED-GREEN-REFACTOR cycle.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Option 2: Begin Implementation
Start with Phase 3.1 (Setup):
- T001: Add TypeScript types
- T002: Verify Rust dependencies

Then proceed to Phase 3.2 (Tests - MUST FAIL FIRST).

### Option 3: Review & Adjust
Review generated tasks and planning documents, make adjustments if needed.

---

## Constitutional Compliance ✅

**Simplicity**:
- No new external dependencies
- Uses existing patterns (React Query, Tauri invoke)
- Simple regex for URL parsing

**Architecture**:
- Follows library-first approach (reusable hook)
- Tauri command as API endpoint
- Clean separation: parsing (frontend), fetching (backend)

**Testing**:
- TDD enforced with explicit gates
- 11 tests MUST fail before implementation
- RED-GREEN-REFACTOR cycle documented

**Observability**:
- Error messages user-friendly
- Performance logging for slow API calls
- Backend logs for debugging

**Versioning**:
- Phase 2 enhancement to feature 004
- Backward compatible (optional feature)
- No breaking changes to existing code

---

## Success Criteria

This feature is complete when:

1. ✅ User can enter Sprout Video URL
2. ✅ System parses video ID automatically
3. ✅ System fetches metadata from API
4. ✅ Form fields auto-populate (title, thumbnail, ID)
5. ✅ User can override auto-filled values
6. ✅ Error states handled gracefully
7. ✅ All 33 tasks completed
8. ✅ All tests passing
9. ✅ Manual quickstart validation passes
10. ✅ Performance targets met (<500ms total)

---

## Questions or Modifications Needed?

If you need to adjust the planning:
- Add/remove tasks
- Change implementation approach
- Modify error handling strategy
- Adjust performance targets
- Update test coverage

Otherwise, ready to proceed with implementation! 🚀
