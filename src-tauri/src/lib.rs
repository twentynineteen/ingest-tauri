#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                // Import necessary modules from argon2 v0.5.3
                use argon2::{Argon2, PasswordHasher};
                use argon2::password_hash::{SaltString, rand_core::OsRng};

                let salt = SaltString::generate(&mut OsRng);

                // Use the default Argon2id parameters
                let argon2 = Argon2::default();

                let password_hash = argon2
                    .hash_password(password.as_ref(), &salt)
                    .expect("Failed to hash password");

                password_hash.hash.unwrap().as_bytes().to_vec()
            })
            .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
