use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

// Performance optimization constants
const PROGRESS_UPDATE_INTERVAL: Duration = Duration::from_millis(100); // Update UI every 100ms
const SKIP_PATTERNS: &[&str] = &[
    "node_modules", ".git", ".svn", ".hg", "vendor", "build", "dist", 
    "target", ".cache", "tmp", "temp", "__pycache__", ".DS_Store"
];

// Data structures matching TypeScript interfaces
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectFolder {
    path: String,
    name: String,
    #[serde(rename = "isValid")]
    is_valid: bool,
    #[serde(rename = "hasBreadcrumbs")]
    has_breadcrumbs: bool,
    #[serde(rename = "staleBreadcrumbs")]
    stale_breadcrumbs: bool,
    #[serde(rename = "lastScanned")]
    last_scanned: String,
    #[serde(rename = "cameraCount")]
    camera_count: i32,
    #[serde(rename = "validationErrors")]
    validation_errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreadcrumbsFile {
    #[serde(rename = "projectTitle")]
    project_title: String,
    #[serde(rename = "numberOfCameras")]
    number_of_cameras: i32,
    files: Vec<FileInfo>,
    #[serde(rename = "parentFolder")]
    parent_folder: String,
    #[serde(rename = "createdBy")]
    created_by: String,
    #[serde(rename = "creationDateTime")]
    creation_date_time: String,
    #[serde(rename = "folderSizeBytes")]
    folder_size_bytes: Option<u64>,
    #[serde(rename = "lastModified")]
    last_modified: Option<String>,
    #[serde(rename = "scannedBy")]
    scanned_by: Option<String>,
    #[serde(rename = "trelloCardUrl")]
    trello_card_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    camera: i32,
    name: String,
    path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    #[serde(rename = "startTime")]
    start_time: String,
    #[serde(rename = "endTime")]
    end_time: Option<String>,
    #[serde(rename = "rootPath")]
    root_path: String,
    #[serde(rename = "totalFolders")]
    total_folders: i32,
    #[serde(rename = "validProjects")]
    valid_projects: i32,
    #[serde(rename = "updatedBreadcrumbs")]
    updated_breadcrumbs: i32,
    #[serde(rename = "createdBreadcrumbs")]
    created_breadcrumbs: i32,
    errors: Vec<ScanError>,
    projects: Vec<ProjectFolder>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanError {
    path: String,
    r#type: String,
    message: String,
    timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanOptions {
    #[serde(rename = "maxDepth")]
    max_depth: i32,
    #[serde(rename = "includeHidden")]
    include_hidden: bool,
    #[serde(rename = "createMissing")]
    create_missing: bool,
    #[serde(rename = "backupOriginals")]
    backup_originals: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchUpdateResult {
    successful: Vec<String>,
    failed: Vec<FailedUpdate>,
    created: Vec<String>,
    updated: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedUpdate {
    path: String,
    error: String,
}

// Event payloads for progress tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgressEvent {
    #[serde(rename = "scanId")]
    scan_id: String,
    #[serde(rename = "foldersScanned")]
    folders_scanned: i32,
    #[serde(rename = "totalFolders")]
    total_folders: i32,
    #[serde(rename = "currentPath")]
    current_path: String,
    #[serde(rename = "projectsFound")]
    projects_found: i32,
}

// Scan state management
pub struct ScanState {
    scans: Arc<Mutex<HashMap<String, ScanResult>>>,
}

impl ScanState {
    pub fn new() -> Self {
        Self {
            scans: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

// Helper functions
fn get_current_timestamp() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn should_skip_directory(path: &Path) -> bool {
    if let Some(name) = path.file_name() {
        let name_str = name.to_string_lossy();
        SKIP_PATTERNS.iter().any(|pattern| name_str.contains(pattern))
    } else {
        false
    }
}

fn calculate_folder_size(path: &Path) -> Result<u64, std::io::Error> {
    let mut total_size = 0u64;
    
    fn visit_dir(dir: &Path, total: &mut u64) -> Result<(), std::io::Error> {
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();
                
                if path.is_dir() {
                    visit_dir(&path, total)?;
                } else {
                    if let Ok(metadata) = entry.metadata() {
                        *total += metadata.len();
                    }
                }
            }
        }
        Ok(())
    }
    
    visit_dir(path, &mut total_size)?;
    Ok(total_size)
}


fn check_breadcrumbs_stale(path: &Path) -> Result<bool, std::io::Error> {
    let breadcrumbs_path = path.join("breadcrumbs.json");
    
    if !breadcrumbs_path.exists() {
        return Ok(false); // No breadcrumbs file, so not stale
    }
    
    // Read existing breadcrumbs
    let content = fs::read_to_string(&breadcrumbs_path)?;
    let existing_breadcrumbs: BreadcrumbsFile = match serde_json::from_str(&content) {
        Ok(breadcrumbs) => breadcrumbs,
        Err(_) => return Ok(true), // Corrupted breadcrumbs file = stale
    };
    
    // Scan actual current files
    let mut actual_files = Vec::new();
    let footage_path = path.join("Footage");
    
    if let Ok(entries) = fs::read_dir(&footage_path) {
        for entry in entries {
            if let Ok(entry) = entry {
                let folder_name = entry.file_name();
                let name_str = folder_name.to_string_lossy().to_string();
                
                if name_str.starts_with("Camera ") && entry.path().is_dir() {
                    if let Some(camera_num_str) = name_str.strip_prefix("Camera ") {
                        if let Ok(camera_num) = camera_num_str.parse::<i32>() {
                            if let Ok(camera_files) = fs::read_dir(entry.path()) {
                                for file in camera_files {
                                    if let Ok(file) = file {
                                        let file_name = file.file_name().to_string_lossy().to_string();
                                        
                                        // Skip hidden files (starting with .) like .DS_Store
                                        if file_name.starts_with('.') {
                                            continue;
                                        }
                                        
                                        if file.path().is_file() {
                                            actual_files.push(FileInfo {
                                                camera: camera_num,
                                                name: file_name.clone(),
                                                path: format!("Footage/{}/{}", name_str, file_name),
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Compare files: check if counts or content differ
    if existing_breadcrumbs.files.len() != actual_files.len() {
        return Ok(true); // Different number of files = stale
    }
    
    // Sort both for comparison
    let mut existing_files = existing_breadcrumbs.files.clone();
    existing_files.sort_by(|a, b| a.camera.cmp(&b.camera).then_with(|| a.name.cmp(&b.name)));
    actual_files.sort_by(|a, b| a.camera.cmp(&b.camera).then_with(|| a.name.cmp(&b.name)));
    
    // Compare file names and camera assignments
    for (existing, actual) in existing_files.iter().zip(actual_files.iter()) {
        if existing.name != actual.name || existing.camera != actual.camera {
            return Ok(true); // Files differ = stale
        }
    }
    
    Ok(false) // Files match = not stale
}

fn validate_project_folder(path: &Path) -> (bool, Vec<String>, i32) {
    let mut errors = Vec::new();
    let mut camera_count = 0;

    if !path.exists() {
        errors.push("Folder does not exist".to_string());
        return (false, errors, 0);
    }

    // Check required subfolders
    let required_folders = vec!["Footage", "Graphics", "Renders", "Projects", "Scripts"];
    
    for folder in &required_folders {
        let subfolder = path.join(folder);
        if !subfolder.exists() || !subfolder.is_dir() {
            errors.push(format!("Missing required subfolder: {}", folder));
        }
    }

    // Count camera folders in Footage/
    let footage_path = path.join("Footage");
    if footage_path.exists() {
        if let Ok(entries) = fs::read_dir(&footage_path) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let file_name = entry.file_name();
                    let name_str = file_name.to_string_lossy();
                    if name_str.starts_with("Camera ") && entry.path().is_dir() {
                        camera_count += 1;
                    }
                }
            }
        }
    }

    if camera_count == 0 {
        errors.push("No Camera folders found in Footage directory".to_string());
    }

    (errors.is_empty(), errors, camera_count)
}

fn has_breadcrumbs_file(path: &Path) -> bool {
    let breadcrumbs_path = path.join("breadcrumbs.json");
    let exists = breadcrumbs_path.exists();
    
    // Debug logging - show both positive and negative results
    println!("[Baker] Breadcrumbs check: {} -> {}", path.display(), if exists { "FOUND" } else { "MISSING" });
    
    exists
}

fn scan_directory_recursive(
    root_path: &Path,
    options: &ScanOptions,
    app_handle: &AppHandle,
    scan_id: &str,
) -> Result<ScanResult, String> {
    let mut result = ScanResult {
        start_time: get_current_timestamp(),
        end_time: None,
        root_path: root_path.to_string_lossy().to_string(),
        total_folders: 0,
        valid_projects: 0,
        updated_breadcrumbs: 0,
        created_breadcrumbs: 0,
        errors: Vec::new(),
        projects: Vec::new(),
    };

    let mut folders_scanned = 0;
    let mut last_progress_update = Instant::now();

    fn visit_directory(
        dir: &Path,
        depth: i32,
        max_depth: i32,
        include_hidden: bool,
        result: &mut ScanResult,
        folders_scanned: &mut i32,
        app_handle: &AppHandle,
        scan_id: &str,
        last_progress_update: &mut Instant,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if depth > max_depth {
            return Ok(());
        }

        let entries = fs::read_dir(dir)?;
        
        for entry in entries {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                let file_name = entry.file_name();
                let name_str = file_name.to_string_lossy();
                
                // Skip hidden folders unless requested
                if !include_hidden && name_str.starts_with('.') {
                    continue;
                }

                // Performance optimization: Skip common non-project directories
                if should_skip_directory(&path) {
                    continue;
                }

                *folders_scanned += 1;
                result.total_folders = *folders_scanned;

                // Throttled progress event emission for better performance
                if last_progress_update.elapsed() >= PROGRESS_UPDATE_INTERVAL {
                    let progress_event = ScanProgressEvent {
                        scan_id: scan_id.to_string(),
                        folders_scanned: *folders_scanned,
                        total_folders: *folders_scanned,
                        current_path: path.to_string_lossy().to_string(),
                        projects_found: result.valid_projects,
                    };

                    let _ = app_handle.emit("baker_scan_progress", progress_event);
                    *last_progress_update = Instant::now();
                }

                // Check if this folder is a valid project
                let (is_valid, validation_errors, camera_count) = validate_project_folder(&path);
                let has_breadcrumbs = has_breadcrumbs_file(&path);
                
                // Debug logging for each folder checked
                println!("[Baker] Sub-folder: {} | Valid: {} | HasBreadcrumbs: {} | CameraCount: {}", 
                    path.display(), is_valid, has_breadcrumbs, camera_count);
                
                // Include folder if it's either valid OR has breadcrumbs
                if is_valid || has_breadcrumbs {
                    if is_valid {
                        result.valid_projects += 1;
                    }
                    
                    let stale_breadcrumbs = if has_breadcrumbs { 
                        check_breadcrumbs_stale(&path).unwrap_or(false) 
                    } else { 
                        false 
                    };
                    
                    let project_folder = ProjectFolder {
                        path: path.to_string_lossy().to_string(),
                        name: file_name.to_string_lossy().to_string(),
                        is_valid,
                        has_breadcrumbs,
                        stale_breadcrumbs,
                        last_scanned: get_current_timestamp(),
                        camera_count,
                        validation_errors: validation_errors.clone(),
                    };

                    result.projects.push(project_folder);
                } else if !validation_errors.is_empty() {
                    // Only recurse if folder is not a partial project structure
                    let has_footage_or_graphics = path.join("Footage").exists() || path.join("Graphics").exists();
                    
                    if !has_footage_or_graphics {
                        visit_directory(
                            &path,
                            depth + 1,
                            max_depth,
                            include_hidden,
                            result,
                            folders_scanned,
                            app_handle,
                            scan_id,
                            last_progress_update,
                        )?;
                    }
                }

                // Emit discovery event for valid projects or folders with breadcrumbs
                if is_valid || has_breadcrumbs {
                    let discovery_event = serde_json::json!({
                        "scanId": scan_id,
                        "projectPath": path.to_string_lossy(),
                        "isValid": is_valid,
                        "hasBreadcrumbs": has_breadcrumbs,
                        "errors": validation_errors
                    });

                    let _ = app_handle.emit("baker_scan_discovery", discovery_event);
                }
            }
        }

        Ok(())
    }

    // First check the root directory itself
    let (is_valid, validation_errors, camera_count) = validate_project_folder(root_path);
    let has_breadcrumbs = has_breadcrumbs_file(root_path);
    
    println!("[Baker] ===== ROOT FOLDER ANALYSIS =====");
    println!("[Baker] Path: {}", root_path.display());
    println!("[Baker] Valid BuildProject: {}", is_valid);
    println!("[Baker] Has breadcrumbs.json: {}", has_breadcrumbs);
    println!("[Baker] Camera count: {}", camera_count);
    if !validation_errors.is_empty() {
        println!("[Baker] Validation errors: {:?}", validation_errors);
    }
    println!("[Baker] ================================");
    
    if is_valid || has_breadcrumbs {
        if is_valid {
            result.valid_projects += 1;
        }
        
        let stale_breadcrumbs = if has_breadcrumbs { 
            check_breadcrumbs_stale(&root_path).unwrap_or(false) 
        } else { 
            false 
        };
        
        let project_folder = ProjectFolder {
            path: root_path.to_string_lossy().to_string(),
            name: root_path.file_name().unwrap_or_default().to_string_lossy().to_string(),
            is_valid,
            has_breadcrumbs,
            stale_breadcrumbs,
            last_scanned: get_current_timestamp(),
            camera_count,
            validation_errors: validation_errors.clone(),
        };

        result.projects.push(project_folder);
        
        // Emit discovery event for root folder
        let discovery_event = serde_json::json!({
            "scanId": scan_id,
            "projectPath": root_path.to_string_lossy(),
            "isValid": is_valid,
            "hasBreadcrumbs": has_breadcrumbs,
            "errors": validation_errors
        });
        let _ = app_handle.emit("baker_scan_discovery", discovery_event);
    }

    // Then scan subdirectories
    match visit_directory(
        root_path,
        0,
        options.max_depth,
        options.include_hidden,
        &mut result,
        &mut folders_scanned,
        app_handle,
        scan_id,
        &mut last_progress_update,
    ) {
        Ok(_) => {
            result.end_time = Some(get_current_timestamp());
            Ok(result)
        }
        Err(e) => {
            result.errors.push(ScanError {
                path: root_path.to_string_lossy().to_string(),
                r#type: "filesystem".to_string(),
                message: e.to_string(),
                timestamp: get_current_timestamp(),
            });
            result.end_time = Some(get_current_timestamp());
            Ok(result)
        }
    }
}

// Tauri commands
#[tauri::command]
pub async fn baker_start_scan(
    root_path: String,
    options: ScanOptions,
    state: State<'_, ScanState>,
    app_handle: AppHandle,
) -> Result<String, String> {
    let path = Path::new(&root_path);
    
    // Log scan initiation
    println!("[Baker] Starting scan: Path={}, MaxDepth={}, IncludeHidden={}", 
        root_path, options.max_depth, options.include_hidden);
    
    if !path.exists() {
        let error_msg = "Root path does not exist".to_string();
        println!("[Baker] Scan validation failed: {}", error_msg);
        return Err(error_msg);
    }

    if !path.is_dir() {
        let error_msg = "Root path is not a directory".to_string();
        println!("[Baker] Scan validation failed: {}", error_msg);
        return Err(error_msg);
    }

    if options.max_depth < 1 {
        return Err("Max depth must be at least 1".to_string());
    }

    let scan_id = Uuid::new_v4().to_string();
    println!("[Baker] Generated scan ID: {}", scan_id);

    // Start scan in background
    let scan_id_clone = scan_id.clone();
    let path_clone = path.to_path_buf();
    let options_clone = options.clone();
    let scans_ref = state.scans.clone();
    let app_handle_clone = app_handle.clone();

    tokio::spawn(async move {
        println!("[Baker] Starting background scan task for ID: {}", scan_id_clone);
        let scan_start = Instant::now();
        
        match scan_directory_recursive(&path_clone, &options_clone, &app_handle_clone, &scan_id_clone) {
            Ok(result) => {
                let scan_duration = scan_start.elapsed();
                println!("[Baker] Scan completed successfully in {:.2}s: {} projects found, {} folders scanned", 
                    scan_duration.as_secs_f32(), result.valid_projects, result.total_folders);
                
                // Store result
                if let Ok(mut scans) = scans_ref.lock() {
                    scans.insert(scan_id_clone.clone(), result.clone());
                }

                // Emit completion event
                let complete_event = serde_json::json!({
                    "scanId": scan_id_clone,
                    "result": result
                });

                let _ = app_handle_clone.emit("baker_scan_complete", complete_event);
            }
            Err(e) => {
                let scan_duration = scan_start.elapsed();
                println!("[Baker] Scan failed after {:.2}s with error: {}", scan_duration.as_secs_f32(), e);
                
                let error_event = serde_json::json!({
                    "scanId": scan_id_clone,
                    "error": {
                        "path": path_clone.to_string_lossy(),
                        "type": "filesystem",
                        "message": e,
                        "timestamp": get_current_timestamp()
                    }
                });

                let _ = app_handle_clone.emit("baker_scan_error", error_event);
            }
        }
    });

    Ok(scan_id)
}

#[tauri::command]
pub async fn baker_get_scan_status(
    scan_id: String,
    state: State<'_, ScanState>,
) -> Result<ScanResult, String> {
    let scans = state.scans.lock().map_err(|_| "Failed to acquire lock")?;
    
    scans
        .get(&scan_id)
        .cloned()
        .ok_or_else(|| "Scan ID not found".to_string())
}

#[tauri::command]
pub async fn baker_cancel_scan(
    scan_id: String,
    state: State<'_, ScanState>,
) -> Result<(), String> {
    // In a real implementation, we would need a way to signal the scan task to stop
    // For now, just mark the scan as completed
    let mut scans = state.scans.lock().map_err(|_| "Failed to acquire lock")?;
    
    if let Some(result) = scans.get_mut(&scan_id) {
        if result.end_time.is_none() {
            result.end_time = Some(get_current_timestamp());
        }
    } else {
        return Err("Scan ID not found".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn baker_validate_folder(folder_path: String) -> Result<ProjectFolder, String> {
    let path = Path::new(&folder_path);
    
    if !path.exists() {
        return Err("Folder does not exist".to_string());
    }

    let (is_valid, validation_errors, camera_count) = validate_project_folder(path);
    let has_breadcrumbs = has_breadcrumbs_file(path);
    let stale_breadcrumbs = if has_breadcrumbs { 
        check_breadcrumbs_stale(path).unwrap_or(false) 
    } else { 
        false 
    };

    Ok(ProjectFolder {
        path: folder_path.clone(),
        name: path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        is_valid,
        has_breadcrumbs,
        stale_breadcrumbs,
        last_scanned: get_current_timestamp(),
        camera_count,
        validation_errors,
    })
}

#[tauri::command]
pub async fn baker_read_breadcrumbs(project_path: String) -> Result<Option<BreadcrumbsFile>, String> {
    let path = Path::new(&project_path);
    
    if !path.exists() {
        return Err("Project path does not exist".to_string());
    }

    let breadcrumbs_path = path.join("breadcrumbs.json");
    
    if !breadcrumbs_path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&breadcrumbs_path)
        .map_err(|e| format!("Failed to read breadcrumbs file: {}", e))?;

    let breadcrumbs: BreadcrumbsFile = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse breadcrumbs file: {}", e))?;

    Ok(Some(breadcrumbs))
}

#[tauri::command]
pub async fn baker_update_breadcrumbs(
    project_paths: Vec<String>,
    create_missing: bool,
    backup_originals: bool,
) -> Result<BatchUpdateResult, String> {
    if project_paths.is_empty() {
        return Err("Project paths cannot be empty".to_string());
    }

    let mut result = BatchUpdateResult {
        successful: Vec::new(),
        failed: Vec::new(),
        created: Vec::new(),
        updated: Vec::new(),
    };

    for project_path in project_paths {
        let path = Path::new(&project_path);
        
        if !path.exists() {
            result.failed.push(FailedUpdate {
                path: project_path.clone(),
                error: "Path does not exist".to_string(),
            });
            continue;
        }

        let breadcrumbs_path = path.join("breadcrumbs.json");
        let exists = breadcrumbs_path.exists();

        if !exists && !create_missing {
            // Skip if doesn't exist and we're not creating missing
            continue;
        }

        // Create backup if requested and file exists
        if backup_originals && exists {
            let backup_path = path.join("breadcrumbs.json.bak");
            if let Err(e) = fs::copy(&breadcrumbs_path, &backup_path) {
                result.failed.push(FailedUpdate {
                    path: project_path.clone(),
                    error: format!("Failed to create backup: {}", e),
                });
                continue;
            }
        }

        // Generate breadcrumbs content
        let (is_valid, _, camera_count) = validate_project_folder(path);
        
        if !is_valid {
            result.failed.push(FailedUpdate {
                path: project_path.clone(),
                error: "Invalid project structure".to_string(),
            });
            continue;
        }

        // Scan for files in camera folders
        let mut files = Vec::new();
        let footage_path = path.join("Footage");
        
        if let Ok(entries) = fs::read_dir(&footage_path) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let folder_name = entry.file_name();
                    let name_str = folder_name.to_string_lossy();
                    
                    if name_str.starts_with("Camera ") && entry.path().is_dir() {
                        if let Some(camera_num_str) = name_str.strip_prefix("Camera ") {
                            if let Ok(camera_num) = camera_num_str.parse::<i32>() {
                                if let Ok(camera_files) = fs::read_dir(entry.path()) {
                                    for file in camera_files {
                                        if let Ok(file) = file {
                                            let file_name = file.file_name().to_string_lossy().to_string();
                                            
                                            // Skip hidden files (starting with .) like .DS_Store
                                            if file_name.starts_with('.') {
                                                continue;
                                            }
                                            
                                            if file.path().is_file() {
                                                files.push(FileInfo {
                                                    camera: camera_num,
                                                    name: file_name.clone(),
                                                    path: format!("Footage/{}/{}", name_str, file_name),
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        let breadcrumbs = if exists {
            // Update existing
            match fs::read_to_string(&breadcrumbs_path) {
                Ok(content) => {
                    match serde_json::from_str::<BreadcrumbsFile>(&content) {
                        Ok(mut existing) => {
                            existing.files = files;
                            // Preserve original creator and add Baker update suffix
                            if !existing.created_by.ends_with(" - updated by Baker") {
                                existing.created_by = format!("{} - updated by Baker", existing.created_by);
                            }
                            existing.last_modified = Some(get_current_timestamp());
                            existing.scanned_by = Some("Baker".to_string());
                            existing
                        }
                        Err(_) => {
                            // Create new if corrupted
                            BreadcrumbsFile {
                                project_title: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                                number_of_cameras: camera_count,
                                files,
                                parent_folder: path.parent().unwrap_or(path).to_string_lossy().to_string(),
                                created_by: "Baker".to_string(),
                                creation_date_time: get_current_timestamp(),
                                folder_size_bytes: calculate_folder_size(path).ok(),
                                last_modified: Some(get_current_timestamp()),
                                scanned_by: Some("Baker".to_string()),
                                trello_card_url: None,
                            }
                        }
                    }
                }
                Err(_) => {
                    result.failed.push(FailedUpdate {
                        path: project_path.clone(),
                        error: "Failed to read existing breadcrumbs".to_string(),
                    });
                    continue;
                }
            }
        } else {
            // Create new
            BreadcrumbsFile {
                project_title: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                number_of_cameras: camera_count,
                files,
                parent_folder: path.parent().unwrap_or(path).to_string_lossy().to_string(),
                created_by: "Baker".to_string(),
                creation_date_time: get_current_timestamp(),
                folder_size_bytes: calculate_folder_size(path).ok(),
                last_modified: Some(get_current_timestamp()),
                scanned_by: Some("Baker".to_string()),
                trello_card_url: None,
            }
        };

        // Write breadcrumbs file
        match serde_json::to_string_pretty(&breadcrumbs) {
            Ok(json_content) => {
                if let Err(e) = fs::write(&breadcrumbs_path, json_content) {
                    result.failed.push(FailedUpdate {
                        path: project_path.clone(),
                        error: format!("Failed to write breadcrumbs file: {}", e),
                    });
                } else {
                    result.successful.push(project_path.clone());
                    if exists {
                        result.updated.push(project_path);
                    } else {
                        result.created.push(project_path);
                    }
                }
            }
            Err(e) => {
                result.failed.push(FailedUpdate {
                    path: project_path.clone(),
                    error: format!("Failed to serialize breadcrumbs: {}", e),
                });
            }
        }
    }

    Ok(result)
}

#[tauri::command]
pub async fn baker_scan_current_files(project_path: String) -> Result<Vec<FileInfo>, String> {
    let path = Path::new(&project_path);
    
    if !path.exists() {
        return Err("Project path does not exist".to_string());
    }
    
    if !path.is_dir() {
        return Err("Project path is not a directory".to_string());
    }
    
    // Scan for files in camera folders (same logic as baker_update_breadcrumbs)
    let mut files = Vec::new();
    let footage_path = path.join("Footage");
    
    if let Ok(entries) = fs::read_dir(&footage_path) {
        for entry in entries {
            if let Ok(entry) = entry {
                let folder_name = entry.file_name();
                let name_str = folder_name.to_string_lossy();
                
                if name_str.starts_with("Camera ") && entry.path().is_dir() {
                    if let Some(camera_num_str) = name_str.strip_prefix("Camera ") {
                        if let Ok(camera_num) = camera_num_str.parse::<i32>() {
                            if let Ok(camera_files) = fs::read_dir(entry.path()) {
                                for file in camera_files {
                                    if let Ok(file) = file {
                                        let file_name = file.file_name().to_string_lossy().to_string();
                                        
                                        // Skip hidden files (starting with .) like .DS_Store
                                        if file_name.starts_with('.') {
                                            continue;
                                        }
                                        
                                        if file.path().is_file() {
                                            files.push(FileInfo {
                                                camera: camera_num,
                                                name: file_name.clone(),
                                                path: file.path().to_string_lossy().to_string(),
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Sort files by camera number and then by name
    files.sort_by(|a, b| a.camera.cmp(&b.camera).then_with(|| a.name.cmp(&b.name)));
    
    Ok(files)
}

#[tauri::command]
pub async fn get_folder_size(folder_path: String) -> Result<u64, String> {
    let path = Path::new(&folder_path);
    
    if !path.exists() {
        return Err(format!("Path does not exist: {}", folder_path));
    }
    
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", folder_path));
    }
    
    calculate_folder_size(path).map_err(|e| format!("Failed to calculate folder size: {}", e))
}