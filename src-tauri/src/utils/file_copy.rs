use std::fs::File;
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::Path;
use tauri::{AppHandle, Emitter};

/// File Copy with Progress Tracking (No UI Freezing)
pub fn copy_file_with_progress(src: &Path, dest: &Path, app_handle: &AppHandle) -> std::io::Result<()> {
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