use serde::{Deserialize, Serialize};

/// Represents a video link (typically Sprout Video) associated with a project
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoLink {
    /// Full video URL (e.g., https://sproutvideo.com/videos/abc123)
    pub url: String,

    /// Extracted Sprout Video ID (e.g., "abc123")
    #[serde(rename = "sproutVideoId", skip_serializing_if = "Option::is_none")]
    pub sprout_video_id: Option<String>,

    /// User-provided or fetched video title
    pub title: String,

    /// Cached thumbnail URL from Sprout API
    #[serde(rename = "thumbnailUrl", skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,

    /// ISO 8601 timestamp of upload
    #[serde(rename = "uploadDate", skip_serializing_if = "Option::is_none")]
    pub upload_date: Option<String>,

    /// Original filename from Renders/ folder
    #[serde(rename = "sourceRenderFile", skip_serializing_if = "Option::is_none")]
    pub source_render_file: Option<String>,
}

/// Represents a Trello card associated with a project
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrelloCard {
    /// Full Trello card URL (e.g., https://trello.com/c/abc123/project-name)
    pub url: String,

    /// Extracted card ID (e.g., "abc123")
    #[serde(rename = "cardId")]
    pub card_id: String,

    /// Fetched card name/title from Trello API
    pub title: String,

    /// Optional board name from Trello API
    #[serde(rename = "boardName", skip_serializing_if = "Option::is_none")]
    pub board_name: Option<String>,

    /// ISO 8601 timestamp of last title fetch
    #[serde(rename = "lastFetched", skip_serializing_if = "Option::is_none")]
    pub last_fetched: Option<String>,
}