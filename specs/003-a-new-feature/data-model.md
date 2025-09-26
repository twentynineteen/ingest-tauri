# Data Model: Baker

**Date**: 2025-09-25  
**Feature**: Baker folder scanning and breadcrumbs management  
**Phase**: 1 (Design)

## Core Entities

### ProjectFolder

Represents a folder structure that matches BuildProject patterns.

**Fields**:
- `path: string` - Absolute filesystem path to project folder
- `name: string` - Folder name (typically project title)
- `isValid: boolean` - Whether folder passes structure validation
- `hasBreadcrumbs: boolean` - Whether breadcrumbs.json exists
- `lastScanned: Date` - When this folder was last scanned
- `cameraCount: number` - Number of camera folders detected
- `validationErrors: string[]` - List of validation issues (if any)

**Relationships**:
- Contains one BreadcrumbsFile (if exists)
- Contains multiple VideoFiles (in Camera folders)

**State Transitions**:
- Discovered → Validated → Processed
- Can transition from Valid to Invalid if structure changes

**Validation Rules**:
- Must contain: Footage/, Graphics/, Renders/, Projects/, Scripts/
- Footage/ must contain at least one "Camera N" subfolder
- Path must be accessible with read/write permissions

### BreadcrumbsFile

Represents metadata stored in breadcrumbs.json files.

**Fields**:
- `projectTitle: string` - Human-readable project name
- `numberOfCameras: number` - Count of camera angles/sources
- `files: FileInfo[]` - Array of footage files with camera assignments
- `parentFolder: string` - Path to project parent directory
- `createdBy: string` - Username of project creator
- `creationDateTime: string` - ISO timestamp of initial creation
- `lastModified?: string` - ISO timestamp of last update (Baker-added)
- `scannedBy?: string` - Tool that performed last scan (Baker-added)

**FileInfo Schema**:
```json
{
  "camera": number,
  "name": string,
  "path": string
}
```

**Validation Rules**:
- projectTitle must be non-empty string
- numberOfCameras must be positive integer
- files array must contain valid FileInfo objects
- timestamps must be valid ISO 8601 format
- camera numbers must be between 1 and numberOfCameras

**Backward Compatibility**:
- All existing fields preserved unchanged
- New fields are optional (lastModified, scannedBy)
- Maintains compatibility with Trello integration

### ScanResult

Aggregates outcomes from folder scanning operations.

**Fields**:
- `startTime: Date` - When scan operation began
- `endTime?: Date` - When scan completed (undefined if ongoing)
- `rootPath: string` - Starting directory for scan
- `totalFolders: number` - Total directories examined
- `validProjects: number` - Count of valid project folders found
- `updatedBreadcrumbs: number` - Count of existing breadcrumbs updated
- `createdBreadcrumbs: number` - Count of new breadcrumbs created
- `errors: ScanError[]` - List of errors encountered
- `projects: ProjectFolder[]` - Discovered project folders

**ScanError Schema**:
```json
{
  "path": string,
  "type": "permission" | "structure" | "filesystem" | "corruption",
  "message": string,
  "timestamp": string
}
```

**Calculated Properties**:
- `duration: number` - Scan time in milliseconds
- `successRate: number` - Percentage of successful operations
- `isComplete: boolean` - Whether scan finished

### ScanPreferences

User settings for Baker operations.

**Fields**:
- `autoUpdate: boolean` - Automatically apply changes without confirmation
- `createMissing: boolean` - Create breadcrumbs.json for folders lacking them
- `backupOriginals: boolean` - Keep .bak copies before modifying files
- `maxDepth: number` - Maximum directory recursion depth
- `includeHidden: boolean` - Process hidden/system folders
- `confirmBulkOperations: boolean` - Require confirmation for batch changes

**Default Values**:
- autoUpdate: false (require user confirmation)
- createMissing: true
- backupOriginals: true
- maxDepth: 10
- includeHidden: false
- confirmBulkOperations: true

## Data Flow

### Scan Operation Flow

1. **Discovery Phase**:
   ```
   User selects root folder
   → Traverse filesystem recursively
   → For each folder: check structure validity
   → Create ProjectFolder entities for valid candidates
   ```

2. **Validation Phase**:
   ```
   For each ProjectFolder:
   → Validate required subfolders exist
   → Count Camera folders in Footage/
   → Check for existing breadcrumbs.json
   → Set validation status and errors
   ```

3. **Analysis Phase**:
   ```
   For each valid ProjectFolder:
   → Read existing breadcrumbs.json (if present)
   → Scan actual files in Camera folders
   → Compare actual vs recorded files
   → Determine required updates
   ```

4. **Update Phase** (user-approved):
   ```
   For each selected ProjectFolder:
   → Backup existing breadcrumbs.json (if exists)
   → Generate updated/new breadcrumbs content
   → Write breadcrumbs.json file
   → Log operation result
   ```

### State Management

**Zustand Store Schema**:
```typescript
interface BakerStore {
  // Scan state
  scanStatus: 'idle' | 'scanning' | 'complete' | 'error' | 'cancelled'
  currentScan: ScanResult | null
  
  // User preferences
  preferences: ScanPreferences
  
  // UI state
  selectedProjects: string[] // ProjectFolder paths
  showPreview: boolean
  
  // Actions
  startScan: (rootPath: string) => Promise<void>
  cancelScan: () => void
  applyChanges: (projectPaths: string[]) => Promise<void>
  updatePreferences: (prefs: Partial<ScanPreferences>) => void
}
```

## File System Integration

### Directory Structure Expected

```
ProjectFolder/
├── breadcrumbs.json          # Metadata file (Baker manages)
├── Footage/
│   ├── Camera 1/            # Required: at least one camera folder
│   ├── Camera 2/            # Optional: additional cameras
│   └── Camera N/            # Variable count based on project
├── Graphics/                 # Required: assets folder
├── Renders/                  # Required: output folder  
├── Projects/                 # Required: project files folder
└── Scripts/                  # Required: documentation/scripts
```

### File Operation Safety

**Backup Strategy**:
- Create `.bak` copies before modifying existing breadcrumbs.json
- Atomic writes using temporary files
- Rollback capability in case of errors

**Permission Handling**:
- Check read/write access before operations
- Graceful degradation for permission-denied folders
- Option to request elevated permissions for restricted areas

**Error Recovery**:
- Transaction-like operations (all-or-nothing for bulk changes)
- Detailed error logging with context
- Retry mechanisms for transient failures

## Integration Points

### Existing Breadcrumbs Compatibility

Baker must maintain full compatibility with breadcrumbs.json files created by BuildProject and consumed by:

- **Trello Integration**: useAppendBreadcrumbs hook
- **Project Creation**: useCreateProject hook  
- **File Management**: Project folder operations

**Schema Extension Strategy**:
```json
{
  // Existing fields (never modified by Baker)
  "projectTitle": "User Project Name",
  "numberOfCameras": 2,
  "files": [...],
  "parentFolder": "/path/to/parent",
  "createdBy": "username",
  "creationDateTime": "2025-01-01T00:00:00Z",
  
  // Baker-added fields (optional)
  "lastModified": "2025-01-02T00:00:00Z",
  "scannedBy": "Baker v1.0"
}
```

### Tauri Backend Integration

**Command Interface**:
- Commands follow existing Tauri patterns (snake_case naming)
- Event-driven progress reporting for long operations
- Error handling consistent with other file operations
- Background processing to avoid UI blocking

**Event Streaming**:
- Progress events: folder count, current path, completion percentage
- Discovery events: valid project found, validation errors
- Completion events: final statistics, error summary

---

**Data Model Complete** ✅  
**Next**: Generate API contracts and component interfaces