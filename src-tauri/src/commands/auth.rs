use tauri::State;
use crate::state::AuthState;

#[tauri::command]
pub fn check_auth(token: String, state: State<AuthState>) -> String {
    let tokens = state.tokens.lock().unwrap();
    if tokens.contains(&token) {
        "authenticated".to_string()
    } else {
        "unauthorized".to_string()
    }
}

#[tauri::command]
pub fn add_token(token: String, state: State<AuthState>) {
    let mut tokens = state.tokens.lock().unwrap();
    tokens.push(token);
}