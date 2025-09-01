use bytes::Bytes;
use futures_util::stream::unfold;
use futures_util::TryStreamExt;
use reqwest::multipart;
use reqwest::{Body, Client};
use serde_json::Value;
use std::fs::File;
use std::path::Path;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};
use tauri::Emitter;
use tauri::{command, AppHandle};
use tokio::io::{AsyncRead, AsyncReadExt, BufReader};
use tokio::sync::Mutex; // Import serde_json for JSON handling

#[command]
pub async fn get_folders(
    api_key: String,
    folder_id: Option<String>,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    // Build the URL based on whether a folder_id is provided.
    let mut url = "https://api.sproutvideo.com/v1/folders".to_string();
    if let Some(fid) = folder_id {
        // Assuming the API supports a query parameter like `folder_id`
        url = format!("{}?folder_id={}", url, fid);
    }
    let response = client
        .get(&url)
        .header("SproutVideo-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: Value = response.json().await.map_err(|e| e.to_string())?;
    Ok(json)
}

#[command]
pub fn upload_video(
    app_handle: AppHandle,
    file_path: String,
    api_key: String,
    folder_id: Option<String>,
) {
    tauri::async_runtime::spawn(async move {
        match upload_video_task(app_handle, file_path, api_key, folder_id).await {
            Ok(_) => println!("Upload successful"),
            Err(err) => println!("Upload failed: {}", err),
        }
    });
}

// Async Progress Tracking Reader using Tokio's AsyncRead API (with ReadBuf)
pub struct ProgressReader<R> {
    inner: R,
    progress: Arc<Mutex<u64>>,
    total_size: u64,
    app_handle: AppHandle,
}

impl<R: AsyncRead + Unpin> AsyncRead for ProgressReader<R> {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut tokio::io::ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        // Record the initial filled length
        let pre_filled = buf.filled().len();
        // Poll the inner reader
        let pinned_inner = Pin::new(&mut self.inner);
        let res = pinned_inner.poll_read(cx, buf);
        if let Poll::Ready(Ok(())) = &res {
            let post_filled = buf.filled().len();
            let bytes_read = post_filled - pre_filled;
            if bytes_read > 0 {
                // Use try_lock() to avoid blocking the async runtime.
                if let Ok(mut progress_guard) = self.progress.try_lock() {
                    *progress_guard += bytes_read as u64;
                    let percentage = (*progress_guard as f64 / self.total_size as f64) * 100.0;
                    println!("Upload progress: {:.2}%", percentage);
                    // Emit progress; if the lock wasn't available, we'll just skip this update.
                    let _ = self.app_handle.emit("upload_progress", percentage as u32);
                }
            }
        }
        res
    }
}

// Upload function that streams file data with progress tracking
async fn upload_video_task(
    app_handle: AppHandle,
    file_path: String,
    api_key: String,
    folder_id: Option<String>,
) -> Result<(), String> {
    // Open the file
    let file = File::open(&file_path).map_err(|e| e.to_string())?;
    let file_size = file.metadata().map_err(|e| e.to_string())?.len();

    // Convert the file into an async Tokio file and wrap it in a BufReader
    let file = tokio::fs::File::from_std(file);
    let reader = BufReader::new(file);

    // Set up the progress tracker
    let progress = Arc::new(Mutex::new(0));
    let progress_reader = ProgressReader {
        inner: reader,
        progress: progress.clone(),
        total_size: file_size,
        app_handle: app_handle.clone(),
    };

    // Extract the original filename
    let file_name = Path::new(&file_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("uploaded_video.mp4")
        .to_string();

    let client = Client::new();

    // Wrap the progress_reader into a request body.
    // Body::from_reader() is not available, so we use wrap_stream() with an adapter.
    // Here we convert the ProgressReader into a stream of byte vectors.
    let stream = unfold(progress_reader, |mut reader| async {
        let mut buf = vec![0u8; 8192];
        match reader.read(&mut buf).await {
            Ok(0) => None,
            Ok(n) => {
                buf.truncate(n);
                Some((Ok::<_, std::io::Error>(buf), reader))
            }
            Err(e) => Some((Err(e), reader)),
        }
    })
    // Convert each Vec<u8> into bytes::Bytes.
    .map_ok(Bytes::from);

    // Wrap the stream into a reqwest Body.
    let body = Body::wrap_stream(stream);

    let part = multipart::Part::stream_with_length(body, file_size)
        .file_name(file_name.clone())
        .mime_str("video/mp4")
        .map_err(|e| e.to_string())?;

    let mut form = multipart::Form::new().part("source_video", part);
    // If a folder_id was provided, add it as a text field.
    if let Some(fid) = folder_id {
        form = form.text("folder_id", fid);
    }

    println!("Starting upload to SproutVideo...");

    // Send the request asynchronously
    let response = client
        .post("https://api.sproutvideo.com/v1/videos")
        .header("SproutVideo-Api-Key", format!("{}", api_key))
        .multipart(form)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = response.status();
    // Parse the response body as JSON.
    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    println!("Upload Response: {:?}", response_json);

    if status.is_success() {
        println!("Upload complete!");
        let _ = app_handle.emit("upload_complete", response_json);
        Ok(())
    } else {
        let error_message = format!("Upload failed: HTTP {} - {:?}", status, response_json);
        let _ = app_handle.emit("upload_error", error_message.clone());
        Err(error_message)
    }
}