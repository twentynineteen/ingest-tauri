use std::fs;
use std::path::PathBuf;
use tauri::command;

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
    // Define the source file path
    let source_file = PathBuf::from("./assets/Premiere 4K Template 2023.prproj");

    // Check if the source file exists
    if !source_file.exists() {
        let error_msg = format!("Error: Source file not found at {:?}", source_file);
        eprintln!("{}", error_msg); // Log error to the console
        return Err(error_msg);
    } else {
        println!("Source file found: {:?}", source_file); // Log success
    }

    // Ensure the destination folder exists
    let destination_path = PathBuf::from(&destination_folder);
    if !destination_path.exists() {
        let error_msg = format!("Error: Destination folder does not exist: {}", destination_folder);
        eprintln!("{}", error_msg);
        return Err(error_msg);
    }

    // Create the new file path with the given title
    let new_file_path = destination_path.join(format!("{}.prproj", new_title));

    // Check if a file with the new name already exists to prevent overwriting
    if new_file_path.exists() {
        let error_msg = format!("Error: A file with the name '{}' already exists in the destination folder.", new_file_path.display());
        eprintln!("{}", error_msg);
        return Err(error_msg);
    }

    // Copy the file to the new location
    match fs::copy(&source_file, &new_file_path) {
        Ok(_) => {
            println!("File successfully copied to {:?}", new_file_path); // Log success
            Ok(())
        }
        Err(e) => {
            let error_msg = format!("Failed to copy file: {}", e);
            eprintln!("{}", error_msg);
            Err(error_msg)
        }
    }
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
