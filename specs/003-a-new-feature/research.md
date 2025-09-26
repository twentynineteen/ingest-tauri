# Research: Baker Implementation

**Date**: 2025-09-25  
**Feature**: Baker - Folder scanning and breadcrumbs management  
**Phase**: 0 (Research & Clarification)

## Research Questions Resolved

### 1. What constitutes "up to date information" in breadcrumbs.json?

**Decision**: Update file listings and metadata timestamps while preserving core project information

**Rationale**: 
- Breadcrumbs.json contains both static (project title, creation info) and dynamic (file listings) data
- "Up to date" means current file inventory matches actual folder contents
- Preserve user-created metadata (title, creator) but update discovered data (files, timestamps)

**Alternatives considered**:
- Complete regeneration: Rejected - loses user customizations
- Timestamp-only updates: Rejected - doesn't address file inventory changes
- No updates to existing files: Rejected - violates "up to date" requirement

**Implementation approach**: 
- Preserve: projectTitle, createdBy, creation timestamp
- Update: files array, modification timestamp, numberOfCameras (if determinable)

### 2. Should Baker create new breadcrumbs.json for folders without them?

**Decision**: Yes, create breadcrumbs.json for valid project folders that lack them

**Rationale**:
- User story explicitly mentions "if required, create a breadcrumbs file"
- Enables retroactive project tracking for pre-Baker projects
- Maintains consistency across all valid project folders

**Alternatives considered**:
- Update-only mode: Rejected - doesn't fulfill retroactive project management need
- Optional creation via user prompt: Considered - may implement as preference setting

**Implementation approach**:
- Scan folder structure to validate BuildProject pattern
- Detect camera folders to determine numberOfCameras
- Use folder name as projectTitle
- Set createdBy to "Baker" with scan timestamp

### 3. What validation rules determine if a folder "matches" BuildProject structure?

**Decision**: Require core subfolder structure with flexible camera numbering

**Rationale**:
- BuildProject creates: Footage/, Graphics/, Renders/, Projects/, Scripts/
- Footage/ contains "Camera X" subfolders where X = 1 to numberOfCameras
- This structure is the minimal signature of a BuildProject-created folder

**Validation Rules**:
1. **Required subfolders**: Footage/, Graphics/, Renders/, Projects/, Scripts/
2. **Camera folders**: At least one "Camera N" folder in Footage/
3. **No false positives**: Ignore folders with partial matches
4. **Case sensitivity**: Handle OS-specific case conventions

**Alternatives considered**:
- Presence of breadcrumbs.json only: Rejected - misses folders without metadata
- Any video folder: Rejected - too broad, many false positives
- Strict naming only: Rejected - doesn't handle user modifications

### 4. How to determine numberOfCameras for existing projects?

**Decision**: Count existing Camera X folders in Footage/ directory

**Rationale**:
- Camera folders follow "Camera N" pattern where N is sequential
- Counting provides accurate camera count for retroactive breadcrumbs
- Handles cases where users added/removed cameras post-creation

**Implementation approach**:
- Regex pattern: `/Camera (\d+)/` in Footage/ directory
- Count unique camera numbers
- Handle gaps (Camera 1, Camera 3 = 2 cameras with gap)

### 5. Should file updates include size, modification dates, or just names?

**Decision**: Include filename and relative path, exclude file system metadata

**Rationale**:
- Original breadcrumbs.json format stores: {camera: number, name: string}
- File system metadata (size, dates) changes frequently and bloats storage
- Primary use case is project tracking, not file system monitoring

**File information format**:
```json
{
  "files": [
    {
      "camera": 1,
      "name": "footage_001.mp4",
      "path": "Footage/Camera 1/footage_001.mp4"
    }
  ]
}
```

### 6. Performance approach for large-scale scanning

**Decision**: Asynchronous Rust backend with progress streaming

**Rationale**:
- Rust backend provides filesystem performance
- Async scanning prevents UI blocking
- Progress events enable real-time user feedback
- Stream results to handle memory efficiently

**Technical approach**:
- Tauri command for scan initiation
- Background tokio tasks for folder traversal
- Event streaming for progress updates
- Cancellation support for large operations

### 7. Error handling for permission/access errors

**Decision**: Graceful degradation with detailed error reporting

**Rationale**:
- Large drives often have permission-restricted folders
- Complete scan failure due to one inaccessible folder is unacceptable
- Users need visibility into what was skipped and why

**Error handling strategy**:
- Continue scanning after permission errors
- Log all errors with specific paths and reasons
- Provide summary of successful vs failed operations
- Option to retry failed operations with elevated permissions

## Technology Decisions

### Tauri Commands Architecture

**Decision**: Create dedicated Tauri commands for Baker operations

**Commands planned**:
- `scan_for_projects`: Initiate folder scanning
- `validate_project_folder`: Check single folder validity
- `update_breadcrumbs`: Update/create breadcrumbs.json files
- `cancel_scan`: Stop ongoing scan operations

### Frontend State Management

**Decision**: Zustand store for scan state and results management

**State structure**:
- Current scan status (idle, scanning, complete, error)
- Progress information (folders scanned, projects found)
- Scan results (valid projects, errors encountered)
- User preferences (auto-update, confirmation prompts)

### UI Component Strategy

**Decision**: Follow existing BuildProject page patterns with Baker-specific adaptations

**Component hierarchy**:
- BakerPage (main container, similar to BuildProject.tsx)
- FolderSelector (reuse existing component)
- ScanProgress (progress bar and status)
- ProjectResults (table of discovered projects)
- BatchActions (apply changes to selected projects)

## Integration Points

### Navigation Integration

**Location**: Add to "Ingest footage" section in app sidebar
**Route**: `/ingest/baker`
**Breadcrumb**: "Ingest footage > Baker"

### Existing Code Reuse

**Components to reuse**:
- FolderSelector from BuildProject
- ProgressBar component pattern
- Breadcrumb navigation system

**Hooks to extend**:
- Create useBreadcrumbsManager for batch operations
- Extend useBreadcrumb for Baker-specific navigation

### Breadcrumbs Schema Compatibility

**Decision**: Maintain backward compatibility with existing breadcrumbs.json format

**Schema consistency**:
- Preserve existing field names and types
- Add optional Baker-specific metadata (scanDate, scannedBy)
- Ensure compatibility with Trello integration features

---

**All NEEDS CLARIFICATION items resolved** ✅  
**Ready for Phase 1: Design & Contracts**