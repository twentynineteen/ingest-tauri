use std::sync::Mutex;

pub struct AuthState {
    pub tokens: Mutex<Vec<String>>, // Simple token storage
}