#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::create_dir_all;

use chrono::{Duration, Utc};
use dotenv::dotenv;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};

use std::env;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::command;
use tauri::AppHandle;
use tauri::Manager;
use tauri::State;
use argon2::{Argon2, PasswordVerifier, PasswordHash, PasswordHasher};
use argon2::password_hash::{SaltString, rand_core::OsRng};
use tauri_plugin_stronghold::stronghold::Stronghold;



// logging
// Once enabled, logs will be stored in:
// Linux/macOS: ~/.local/share/<your-app>/log.txt
// Windows: C:\\Users\\<YourName>\\AppData\\Roaming\\<your-app>\\log.txt
use log::{ info };
use simple_logger::SimpleLogger;

// Stronghold functions
// Stronghold function for storing a secure value
#[tauri::command]
async fn set_secure_value(
    state: State<'_, Stronghold>, 
    key: String, 
    value: String
) -> Result<(), String> {
    state
        .write_to_store(key, value.as_bytes()) // ✅ Store securely
        .await
        .map_err(|e| e.to_string())
}

// Stronghold function for retrieving a secure value
#[tauri::command]
async fn get_secure_value(
    state: State<'_, Stronghold>, 
    key: String
) -> Result<String, String> {
    let data = state
        .read_from_vault(&key)
        .await
        .map_err(|e| e.to_string())?;

    String::from_utf8(data).map_err(|e| e.to_string()) // ✅ Convert bytes to string
}

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

// Store refresh tokens in-memory (for session handling)
struct SessionStore {
    refresh_tokens: Mutex<Vec<String>>,
}

// Path for storing users
fn get_users_file_path(app: &AppHandle) -> PathBuf {
    let base_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");
    base_dir.join("users.json")
}

fn verify_password(password: &str, hashed_password: &str) -> bool {
    let argon2 = Argon2::default();

    // Parse the hashed password
    match PasswordHash::new(hashed_password) {
        Ok(parsed_hash) => argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok(),
        Err(_) => false, // Return false if the hash is invalid or incorrectly formatted
    }
}


// Load environment variables
fn load_env() {
    dotenv().ok();
}

fn get_env_var(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_string())
}

#[command]
fn register(app: AppHandle, username: String, password: String) -> Result<String, String> {
    let binding = get_users_file_path(&app);
    let path = Path::new(&binding);
    let parent_dir = path.parent().expect("Failed to get parent directory");

    // Ensure the directory exists before writing the file
    if !parent_dir.exists() {
        create_dir_all(parent_dir).expect("Failed to create data directory");
    }

    // Create the file if it doesn't exist
    if !path.exists() {
        fs::write(&path, "[]").expect("Failed to create users.json");
    }

    let mut users: Vec<User> = if path.exists() {
        let content =
            fs::read_to_string(path).map_err(|e| format!("Failed to read users file: {}", e))?;
        serde_json::from_str(&content).unwrap_or_else(|_| Vec::new())
    } else {
        Vec::new()
    };

    if users.iter().any(|u| u.username == username) {
        return Err("Username already exists".to_string());
    }

    // ✅ Properly hash the password using Argon2
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hashed = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Failed to hash password: {}", e))?
        .to_string(); // Convert to string format for storage

    users.push(User {
        username,
        password: password_hashed,
    });

    let updated_users =
        serde_json::to_string(&users).map_err(|e| format!("Failed to serialize users: {}", e))?;

    fs::write(&get_users_file_path(&app), updated_users)
        .map_err(|e| format!("Failed to save users: {}", e))?;

    Ok("Registration successful".to_string())
}


#[command]
fn login(
    app: AppHandle,
    username: String,
    password: String,
    state: State<SessionStore>,
) -> Result<String, String> {
    let binding = get_users_file_path(&app);
    let path = Path::new(&binding);
    if !path.exists() {
        return Err("User not found".to_string());
    }

    let content = fs::read_to_string(path).map_err(|_| "Failed to read users file")?;
    let users: Vec<User> = serde_json::from_str(&content).unwrap_or_else(|_| Vec::new());

    if let Some(user) = users.iter().find(|u| u.username == username) {
        if verify_password(&password, &user.password) {
            let access_token = create_jwt(&username, "access")?;
            let refresh_token = create_jwt(&username, "refresh")?;

            // Store the refresh token in session memory
            let mut refresh_tokens = state.refresh_tokens.lock().unwrap();
            refresh_tokens.push(refresh_token.clone());

            return Ok(access_token);
        } else {
            return Err("Incorrect password".to_string());
        }
    }

    Err("User not found".to_string())
}

fn create_jwt(username: &str, token_type: &str) -> Result<String, String> {
    let exp_time = if token_type == "access" {
        get_env_var("TOKEN_EXPIRY", "3600")
            .parse::<i64>()
            .unwrap_or(3600)
    } else {
        get_env_var("REFRESH_EXPIRY", "604800")
            .parse::<i64>()
            .unwrap_or(604800)
    };

    let expiration = Utc::now()
        .checked_add_signed(Duration::seconds(exp_time))
        .expect("Valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: username.to_owned(),
        exp: expiration,
        token_type: token_type.to_string(),
    };

    let secret_key = if token_type == "access" {
        get_env_var("JWT_SECRET", "default_secret")
    } else {
        get_env_var("REFRESH_SECRET", "default_refresh_secret")
    };

    let key = EncodingKey::from_secret(secret_key.as_ref());
    encode(&Header::default(), &claims, &key).map_err(|_| "Failed to generate token".to_string())
}

#[command]
fn refresh_access_token(
    state: State<SessionStore>,
    refresh_token: String,
) -> Result<String, String> {
    let refresh_tokens = state.refresh_tokens.lock().unwrap();

    if !refresh_tokens.contains(&refresh_token) {
        return Err("Invalid refresh token".to_string());
    }

    let key =
        DecodingKey::from_secret(get_env_var("REFRESH_SECRET", "default_refresh_secret").as_ref());

    let token_data = decode::<Claims>(&refresh_token, &key, &Validation::default())
        .map_err(|_| "Invalid refresh token".to_string())?;

    if token_data.claims.token_type != "refresh" {
        return Err("Invalid token type".to_string());
    }

    let new_access_token = create_jwt(&token_data.claims.sub, "access")?;
    Ok(new_access_token)
}

fn verify_jwt(token: &str) -> Result<Claims, String> {
    let key = DecodingKey::from_secret(get_env_var("JWT_SECRET", "my_secret_key").as_ref());
    let token_data = decode::<Claims>(token, &key, &Validation::default())
        .map_err(|_| "Invalid token".to_string())?;

    Ok(token_data.claims)
}

#[command]
fn check_auth(token: String) -> Result<String, String> {
    match verify_jwt(&token) {
        Ok(claims) => Ok(format!("User: {} is authenticated", claims.sub)),
        Err(err) => Err(err),
    }
}

fn main() {
    load_env();
    SimpleLogger::new().init().unwrap();

    info!("Tauri App Started");

    let stronghold_path = PathBuf::from("stronghold-storage.stronghold"); // Storage file
    let stronghold_password = b"super-secure-password".to_vec(); // Secure password

    let stronghold = Stronghold::new(&stronghold_path, stronghold_password)
        .expect("Failed to initialize Stronghold");

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(stronghold) // Ensure Stronghold state is managed
        .manage(SessionStore {
            refresh_tokens: Mutex::new(vec![]),
        })
        .invoke_handler(tauri::generate_handler![
            set_secure_value,
            get_secure_value,
            register,
            login,
            refresh_access_token,
            check_auth
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
