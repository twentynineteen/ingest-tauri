#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::Path;
use std::sync::Arc;
use std::sync::Mutex;
use std::thread;
use tauri::Emitter;
use tauri::State;
use tauri::{command, AppHandle};
mod command;
use command::copy_premiere_project;
use command::show_confirmation_dialog;
use std::env;
use std::process::Command;
use tauri_plugin_updater;
mod sprout_upload;
use sprout_upload::get_folders;
use sprout_upload::upload_video;

/// This command gracefully restarts the application.
/// It spawns a new instance of the current executable and then exits.
#[tauri::command]
async fn graceful_restart(_app_handle: AppHandle) -> Result<(), String> {
    // Perform any cleanup needed before restarting.

    // In debug mode (development), the executable might not be available.
    // We can simply log and exit or do nothing.
    if cfg!(debug_assertions) {
        println!("Graceful restart is not supported in development mode.");
        return Ok(());
    }

    // Get the current executable's path.
    let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;

    // Check if the executable exists.
    if !current_exe.exists() {
        return Err(format!(
            "Executable not found at: {}",
            current_exe.display()
        ));
    }

    // Spawn a new instance of the application.
    Command::new(current_exe)
        .spawn()
        .map_err(|e| format!("Failed to spawn new process: {}", e))?;

    // Optionally, perform any final cleanup here.

    // Exit the current application.
    std::process::exit(0);
}

// logging
// Once enabled, logs will be stored in:
// Linux/macOS: ~/.local/share/<your-app>/log.txt
// Windows: C:\\Users\\<YourName>\\AppData\\Roaming\\<your-app>\\log.txt
use log::info;
use simple_logger::SimpleLogger;

struct AuthState {
    tokens: Mutex<Vec<String>>, // Simple token storage
}

/// Function to get the current username from the operating system
///
/// # Arguments
/// *
///
/// # Returns
/// * `Username` if successful.
/// * `Err(String)` if an error occurs.
#[command]
fn get_username() -> String {
    match env::var("USERNAME").or(env::var("USER")) {
        Ok(username) => username,
        Err(_) => "Unknown User".to_string(),
    }
}

#[tauri::command]
fn check_auth(token: String, state: State<AuthState>) -> String {
    let tokens = state.tokens.lock().unwrap();
    if tokens.contains(&token) {
        "authenticated".to_string()
    } else {
        "unauthorized".to_string()
    }
}

#[tauri::command]
fn add_token(token: String, state: State<AuthState>) {
    let mut tokens = state.tokens.lock().unwrap();
    tokens.push(token);
}

#[command]
fn move_files(
    files: Vec<(String, u32)>,
    base_dest: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    let app_handle = Arc::new(app_handle); // Allow sharing across threads
    let base_dest = Arc::new(base_dest); // Shared reference

    // Run file moving in a separate thread
    thread::spawn(move || {
        let mut moved_files = Vec::new();

        for (file_path, camera_number) in files {
            let src_path = Path::new(&file_path);
            let camera_folder =
                Path::new(base_dest.as_str()).join(format!("Footage/Camera {}", camera_number));

            // Ensure the Camera folder exists
            if !camera_folder.exists() {
                if let Err(e) = fs::create_dir_all(&camera_folder) {
                    eprintln!("Failed to create camera folder {}: {}", camera_number, e);
                    continue;
                }
            }

            let dest_file_path = camera_folder.join(src_path.file_name().unwrap());

            // Copy file with progress tracking
            if let Err(e) = copy_file_with_progress(&src_path, &dest_file_path, &app_handle) {
                eprintln!("Failed to copy file {}: {}", file_path, e);
                continue;
            }

            moved_files.push(dest_file_path.to_string_lossy().to_string());
        }

        // Emit completion event when done
        let _ = app_handle.emit("copy_complete", moved_files);
    });

    Ok(()) // Return immediately so UI remains responsive
}

// File Copy with Progress Tracking (No UI Freezing)
fn copy_file_with_progress(src: &Path, dest: &Path, app_handle: &AppHandle) -> std::io::Result<()> {
    let src_file = File::open(src)?;
    let dest_file = File::create(dest)?;
    let metadata = src.metadata()?;
    let total_size = metadata.len();
    let mut copied_size: u64 = 0;

    let mut reader = BufReader::new(src_file);
    let mut writer = BufWriter::new(dest_file);
    let mut buffer = [0; 8192];

    loop {
        let bytes_read = reader.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        writer.write_all(&buffer[..bytes_read])?;
        copied_size += bytes_read as u64;

        // Emit Progress Update
        let progress = (copied_size as f64 / total_size as f64) * 100.0;
        let _ = app_handle.emit("copy_progress", progress);
    }

    writer.flush()?;
    Ok(())
}

#[tauri::command]
fn open_folder(path: String) {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path)
            .spawn()
            .expect("Failed to open folder");
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(path.replace("/", "\\"))
            .spawn()
            .expect("Failed to open folder");
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .expect("Failed to open folder");
    }
}

fn main() {
    SimpleLogger::new().init().unwrap();

    info!("Tauri App Started");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            Ok(())
        })
        .manage(AuthState {
            tokens: Mutex::new(vec![]),
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_macos_permissions::init())
        .invoke_handler(tauri::generate_handler![
            get_folders,
            upload_video,
            graceful_restart,
            check_auth,
            add_token,
            move_files,
            copy_premiere_project,
            show_confirmation_dialog,
            get_username,
            open_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
