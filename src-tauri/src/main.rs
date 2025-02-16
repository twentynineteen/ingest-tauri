#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

use dotenv::dotenv;
use std::env;
use tauri::Manager;
use tauri_plugin_stronghold::Builder as StrongholdBuilder;

// logging
// Once enabled, logs will be stored in:
// Linux/macOS: ~/.local/share/<your-app>/log.txt
// Windows: C:\\Users\\<YourName>\\AppData\\Roaming\\<your-app>\\log.txt
use log::{ info };
use simple_logger::SimpleLogger;


// JWT Claims - data stored in token
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
    token_type: String,
}

#[derive(Serialize, Deserialize)]
struct User {
    username: String,
    password: String, // Store hashed password
}

// Load environment variables
fn load_env() {
    dotenv().ok();
}

fn main() {
    load_env();
    SimpleLogger::new().init().unwrap();

    info!("Tauri App Started");

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path")
                .join("salt.txt");

            app.handle().plugin(StrongholdBuilder::with_argon2(&salt_path).build())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
