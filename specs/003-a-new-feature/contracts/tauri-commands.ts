/**
 * Baker Feature - Tauri Command Contracts
 * 
 * This file defines the interface contracts between the React frontend
 * and the Rust Tauri backend for Baker functionality.
 */

// ================== Data Types ==================

export interface ProjectFolder {
  path: string
  name: string
  isValid: boolean
  hasBreadcrumbs: boolean
  lastScanned: string // ISO timestamp
  cameraCount: number
  validationErrors: string[]
}

export interface BreadcrumbsFile {
  projectTitle: string
  numberOfCameras: number
  files: FileInfo[]
  parentFolder: string
  createdBy: string
  creationDateTime: string
  lastModified?: string
  scannedBy?: string
}

export interface FileInfo {
  camera: number
  name: string
  path: string
}

export interface ScanResult {
  startTime: string // ISO timestamp
  endTime?: string // ISO timestamp
  rootPath: string
  totalFolders: number
  validProjects: number
  updatedBreadcrumbs: number
  createdBreadcrumbs: number
  errors: ScanError[]
  projects: ProjectFolder[]
}

export interface ScanError {
  path: string
  type: 'permission' | 'structure' | 'filesystem' | 'corruption'
  message: string
  timestamp: string
}

export interface ScanOptions {
  maxDepth: number
  includeHidden: boolean
  createMissing: boolean
  backupOriginals: boolean
}

// ================== Tauri Commands ==================

/**
 * Initiates a folder scan operation for Baker
 * 
 * @param rootPath - Absolute path to start scanning from
 * @param options - Scanning preferences and options
 * @returns Promise<string> - Scan operation ID for tracking
 */
export declare function invoke(
  command: 'baker_start_scan',
  args: {
    rootPath: string
    options: ScanOptions
  }
): Promise<string>

/**
 * Gets the current status and results of an ongoing scan
 * 
 * @param scanId - ID returned from baker_start_scan
 * @returns Promise<ScanResult> - Current scan state and results
 */
export declare function invoke(
  command: 'baker_get_scan_status',
  args: {
    scanId: string
  }
): Promise<ScanResult>

/**
 * Cancels an ongoing scan operation
 * 
 * @param scanId - ID of scan to cancel
 * @returns Promise<void>
 */
export declare function invoke(
  command: 'baker_cancel_scan',
  args: {
    scanId: string
  }
): Promise<void>

/**
 * Validates a single folder's structure without full scan
 * 
 * @param folderPath - Absolute path to folder to validate
 * @returns Promise<ProjectFolder> - Validation results
 */
export declare function invoke(
  command: 'baker_validate_folder',
  args: {
    folderPath: string
  }
): Promise<ProjectFolder>

/**
 * Reads and parses an existing breadcrumbs.json file
 * 
 * @param projectPath - Path to project folder containing breadcrumbs.json
 * @returns Promise<BreadcrumbsFile | null> - Parsed breadcrumbs or null if not found
 */
export declare function invoke(
  command: 'baker_read_breadcrumbs',
  args: {
    projectPath: string
  }
): Promise<BreadcrumbsFile | null>

/**
 * Updates or creates breadcrumbs.json files for selected projects
 * 
 * @param projectPaths - Array of project folder paths to update
 * @param createMissing - Whether to create new breadcrumbs for folders without them
 * @param backupOriginals - Whether to create .bak copies before modifying
 * @returns Promise<BatchUpdateResult> - Results of batch operation
 */
export declare function invoke(
  command: 'baker_update_breadcrumbs',
  args: {
    projectPaths: string[]
    createMissing: boolean
    backupOriginals: boolean
  }
): Promise<BatchUpdateResult>

export interface BatchUpdateResult {
  successful: string[] // Paths where update succeeded
  failed: Array<{
    path: string
    error: string
  }>
  created: string[] // Paths where new breadcrumbs were created
  updated: string[] // Paths where existing breadcrumbs were updated
}

// ================== Tauri Events ==================

/**
 * Events emitted during scan operations for progress tracking
 */

export interface ScanProgressEvent {
  scanId: string
  foldersScanned: number
  totalFolders: number
  currentPath: string
  projectsFound: number
}

export interface ScanDiscoveryEvent {
  scanId: string
  projectPath: string
  isValid: boolean
  errors: string[]
}

export interface ScanCompleteEvent {
  scanId: string
  result: ScanResult
}

export interface ScanErrorEvent {
  scanId: string
  error: ScanError
}

// Event listener type definitions
export declare function listen(
  event: 'baker_scan_progress',
  handler: (event: { payload: ScanProgressEvent }) => void
): Promise<() => void>

export declare function listen(
  event: 'baker_scan_discovery',
  handler: (event: { payload: ScanDiscoveryEvent }) => void
): Promise<() => void>

export declare function listen(
  event: 'baker_scan_complete',
  handler: (event: { payload: ScanCompleteEvent }) => void
): Promise<() => void>

export declare function listen(
  event: 'baker_scan_error',
  handler: (event: { payload: ScanErrorEvent }) => void
): Promise<() => void>

// ================== Frontend Component Contracts ==================

/**
 * Props interface for the main Baker page component
 */
export interface BakerPageProps {
  // No props - component manages its own state
}

/**
 * Props for the folder selection component
 */
export interface FolderSelectorProps {
  selectedFolder: string
  onSelect: (folderPath: string) => void
  disabled?: boolean
}

/**
 * Props for scan progress display component  
 */
export interface ScanProgressProps {
  scanResult: ScanResult | null
  isScanning: boolean
}

/**
 * Props for project results table component
 */
export interface ProjectResultsProps {
  projects: ProjectFolder[]
  selectedProjects: string[]
  onSelectionChange: (selectedPaths: string[]) => void
  onPreviewBreadcrumbs: (projectPath: string) => void
}

/**
 * Props for batch operation controls
 */
export interface BatchActionsProps {
  selectedProjects: string[]
  onApplyChanges: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  disabled?: boolean
}

// ================== Hook Contracts ==================

/**
 * Custom hook for managing Baker scan operations
 */
export interface UseBakerScanResult {
  // State
  scanResult: ScanResult | null
  isScanning: boolean
  error: string | null
  
  // Actions
  startScan: (rootPath: string, options: ScanOptions) => Promise<void>
  cancelScan: () => void
  
  // Cleanup
  clearResults: () => void
}

/**
 * Custom hook for managing breadcrumbs operations
 */
export interface UseBreadcrumbsManagerResult {
  // Actions
  updateBreadcrumbs: (projectPaths: string[], options: {
    createMissing: boolean
    backupOriginals: boolean
  }) => Promise<BatchUpdateResult>
  
  // State
  isUpdating: boolean
  lastUpdateResult: BatchUpdateResult | null
  error: string | null
}

/**
 * Custom hook for Baker preferences management
 */
export interface UseBakerPreferencesResult {
  // State
  preferences: ScanOptions
  
  // Actions
  updatePreferences: (newPrefs: Partial<ScanOptions>) => void
  resetToDefaults: () => void
}