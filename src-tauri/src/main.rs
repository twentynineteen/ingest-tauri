#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Module declarations
mod baker;
mod commands;
mod state;
mod utils;

// Imports
use log::info;
use simple_logger::SimpleLogger;
use std::sync::Mutex;

// Re-exports from modules
use baker::*;
use commands::*;
use state::AuthState;

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
        .manage(baker::ScanState::new())
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
            open_resource_file,
            get_username,
            open_folder,
            baker_start_scan,
            baker_get_scan_status,
            baker_cancel_scan,
            baker_validate_folder,
            baker_read_breadcrumbs,
            baker_update_breadcrumbs
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
