use std::fs;
use std::path::PathBuf;
use tauri::command;
use std::env;
use std::io::Write; // For writing bytes to a file

/// Copies a Premiere Pro project template to the specified folder and renames it.
/// 
/// # Arguments
/// * `destination_folder` - The path to the destination folder where the file should be copied.
/// * `new_title` - The new name for the copied file (without the extension).
/// 
/// # Returns
/// * `Ok(())` if the operation is successful.
/// * `Err(String)` if an error occurs.
#[command]
pub fn copy_premiere_project(destination_folder: String, new_title: String) -> Result<(), String> {
    // Print the current working directory
    match env::current_dir() {
        Ok(path) => println!("Current working directory: {}", path.display()),
        Err(e) => eprintln!("Error getting current directory: {}", e),
    }

    // Include the file from the binary
    let file_data = include_bytes!("../assets/Premiere 4K Template 2025.prproj");

    // Define the destination path
    let destination_path = PathBuf::from(destination_folder.clone()).join(format!("{}.prproj", new_title));

    // Ensure the destination folder exists, create if necessary
    if !destination_path.parent().unwrap().exists() {
        println!("Destination folder does not exist. Creating it...");
        if let Err(e) = fs::create_dir_all(destination_path.parent().unwrap()) {
            let error_msg = format!("Error creating destination folder '{}': {}", destination_folder, e);
            eprintln!("{}", error_msg);
            return Err(error_msg);
        }
    }

    // Check if the destination file already exists
    if destination_path.exists() {
        let error_msg = format!(
            "Error: A file with the name '{}' already exists in the destination folder.",
            destination_path.display()
        );
        eprintln!("{}", error_msg);
        return Err(error_msg);
    }

    // Write the file data to the destination path
    let mut file = fs::File::create(&destination_path)
        .map_err(|e| format!("Error creating file: {}", e))?;
    file.write_all(file_data)
        .map_err(|e| format!("Error writing file: {}", e))?;

    println!("File successfully copied to {:?}", destination_path);
    Ok(())
}




use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use std::process::Command;
use std::path::Path;

/// Displays a confirmation dialog with Yes/No options and opens Finder/Explorer if Yes is selected.
///
/// # Arguments
/// * `message` - The message to be displayed in the dialog.
/// * `title` - The title of the dialog box.
/// * `destination` - The folder path to open if the user selects "Yes".
///
/// # Returns
/// * `Ok(())` if successful.
/// * `Err(String)` if an error occurs.
#[command]
pub fn show_confirmation_dialog(app: tauri::AppHandle, message: String, title: String, destination: String) -> Result<(), String> {
    // Display a confirmation dialog with "Yes" and "No" buttons
    let answer = app.dialog()
        .message(&message)
        .title(&title)
        .buttons(MessageDialogButtons::YesNo)
        .blocking_show();

    // If the user selects "Yes", open the Finder/File Explorer
    if answer {
        open_folder(destination)
    } else {
        println!("User selected No, no action taken.");
        Ok(())
    }
}

/// Opens Finder or File Explorer at the specified destination.
///
/// # Arguments
/// * `destination` - The folder path to open.
///
/// # Returns
/// * `Ok(())` if successful.
/// * `Err(String)` if an error occurs.
fn open_folder(destination: String) -> Result<(), String> {
    let path = Path::new(&destination);

    if !path.exists() {
        return Err(format!("Error: The destination path does not exist: {}", destination));
    }

    #[cfg(target_os = "macos")]
    let result = Command::new("open").arg(&destination).spawn();

    #[cfg(target_os = "windows")]
    let result = Command::new("explorer").arg(destination).spawn();

    #[cfg(target_os = "linux")]
    let result = Command::new("xdg-open").arg(destination).spawn();

    match result {
        Ok(_) => {
            println!("Opened folder: {}", destination);
            Ok(())
        }
        Err(e) => Err(format!("Failed to open folder: {}", e)),
    }
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