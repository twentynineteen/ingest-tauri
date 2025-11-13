/**
 * RAG (Retrieval-Augmented Generation) Commands
 * Feature: 006-i-wish-to RAG Enhancement
 * Purpose: Vector similarity search for autocue script examples
 */

use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SimilarExample {
    pub id: String,
    pub title: String,
    pub category: String,
    pub before_text: String,
    pub after_text: String,
    pub similarity: f32,
}

/// Example with full metadata (extends SimilarExample)
/// Used for example management UI
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExampleWithMetadata {
    pub id: String,
    pub title: String,
    pub category: String,
    pub before_text: String,
    pub after_text: String,
    pub tags: Vec<String>,
    pub word_count: Option<i32>,
    pub quality_score: Option<i32>,
    pub source: String, // "bundled" or "user-uploaded"
    pub created_at: String,
}

/// User-provided metadata for uploading examples
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExampleMetadataInput {
    pub title: String,
    pub category: String,
    pub tags: Option<Vec<String>>,
    pub quality_score: Option<i32>,
}

/// Request payload for uploading a new example
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadExampleRequest {
    pub before_content: String,
    pub after_content: String,
    pub metadata: ExampleMetadataInput,
    pub embedding: Vec<f32>,
}

/// Request payload for replacing an existing example
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceExampleRequest {
    pub before_content: String,
    pub after_content: String,
    pub embedding: Vec<f32>,
}

/// Calculate cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }

    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let magnitude_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let magnitude_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if magnitude_a == 0.0 || magnitude_b == 0.0 {
        return 0.0;
    }

    dot_product / (magnitude_a * magnitude_b)
}

/// Convert BLOB to Vec<f32>
fn blob_to_vec_f32(blob: &[u8]) -> Vec<f32> {
    blob.chunks_exact(4)
        .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
        .collect()
}

#[tauri::command]
pub async fn search_similar_scripts(
    app: tauri::AppHandle,
    query_embedding: Vec<f32>,
    top_k: usize,
    min_similarity: Option<f32>,
) -> Result<Vec<SimilarExample>, String> {
    // Get database path from resources
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;

    let db_path = resource_path.join("embeddings/examples.db");

    if !db_path.exists() {
        return Err(format!(
            "Database not found at: {}. Run 'npm run embed:examples' first.",
            db_path.display()
        ));
    }

    // Open database connection
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database at {}: {}", db_path.display(), e))?;

    println!("[RAG] Query embedding dimensions: {}", query_embedding.len());
    println!("[RAG] Top K: {}, Min similarity: {:?}", top_k, min_similarity);

    // Fetch all examples with embeddings
    let mut stmt = conn
        .prepare(
            "SELECT e.script_id, s.title, s.category, s.before_text, s.after_text, e.embedding, e.dimension
             FROM embeddings e
             JOIN example_scripts s ON e.script_id = s.id
             WHERE s.quality_score >= 4
             ORDER BY s.quality_score DESC",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let mut results: Vec<SimilarExample> = Vec::new();

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,   // id
                row.get::<_, String>(1)?,   // title
                row.get::<_, String>(2)?,   // category
                row.get::<_, String>(3)?,   // before_text
                row.get::<_, String>(4)?,   // after_text
                row.get::<_, Vec<u8>>(5)?,  // embedding
                row.get::<_, i32>(6)?,      // dimension
            ))
        })
        .map_err(|e| format!("Failed to query database: {}", e))?;

    let mut total_examples = 0;
    let mut skipped_by_threshold = 0;

    for row_result in rows {
        let (id, title, category, before_text, after_text, embedding_blob, stored_dimension) =
            row_result.map_err(|e| format!("Failed to read row: {}", e))?;

        total_examples += 1;

        // Convert blob to vector
        let embedding = blob_to_vec_f32(&embedding_blob);

        println!("[RAG] Comparing with example '{}' (stored dim: {}, actual dim: {})",
                 title, stored_dimension, embedding.len());

        // Calculate similarity
        let similarity = cosine_similarity(&query_embedding, &embedding);
        println!("[RAG]   Similarity score: {:.4}", similarity);

        // Apply minimum similarity threshold
        if let Some(min_sim) = min_similarity {
            if similarity < min_sim {
                skipped_by_threshold += 1;
                println!("[RAG]   Skipped (below threshold {:.2})", min_sim);
                continue;
            }
        }

        results.push(SimilarExample {
            id,
            title,
            category,
            before_text,
            after_text,
            similarity,
        });
    }

    // Sort by similarity (descending)
    results.sort_by(|a, b| b.similarity.partial_cmp(&a.similarity).unwrap());

    println!("[RAG] Summary: {} total examples, {} passed threshold, returning top {} results",
             total_examples, total_examples - skipped_by_threshold, top_k.min(results.len()));

    // Return top K results
    results.truncate(top_k);

    Ok(results)
}

#[tauri::command]
pub async fn get_example_by_id(app: tauri::AppHandle, id: String) -> Result<SimilarExample, String> {
    // Get database path from resources
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;

    let db_path = resource_path.join("embeddings/examples.db");

    if !db_path.exists() {
        return Err(format!(
            "Database not found at: {}",
            db_path.display()
        ));
    }

    // Open database connection
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Fetch specific example
    let mut stmt = conn
        .prepare(
            "SELECT id, title, category, before_text, after_text
             FROM example_scripts
             WHERE id = ?",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let example = stmt
        .query_row(params![id], |row| {
            Ok(SimilarExample {
                id: row.get(0)?,
                title: row.get(1)?,
                category: row.get(2)?,
                before_text: row.get(3)?,
                after_text: row.get(4)?,
                similarity: 1.0, // Perfect match when fetching by ID
            })
        })
        .map_err(|e| format!("Example not found: {}", e))?;

    Ok(example)
}

#[tauri::command]
pub async fn get_all_examples(app: tauri::AppHandle) -> Result<Vec<SimilarExample>, String> {
    // Get database path from resources
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;

    let db_path = resource_path.join("embeddings/examples.db");

    if !db_path.exists() {
        return Err(format!(
            "Database not found at: {}",
            db_path.display()
        ));
    }

    // Open database connection
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Fetch all examples
    let mut stmt = conn
        .prepare(
            "SELECT id, title, category, before_text, after_text
             FROM example_scripts
             ORDER BY quality_score DESC, title ASC",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let examples = stmt
        .query_map([], |row| {
            Ok(SimilarExample {
                id: row.get(0)?,
                title: row.get(1)?,
                category: row.get(2)?,
                before_text: row.get(3)?,
                after_text: row.get(4)?,
                similarity: 1.0,
            })
        })
        .map_err(|e| format!("Failed to query database: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(examples)
}

/// T021: Get all examples with full metadata
#[tauri::command]
pub async fn get_all_examples_with_metadata(
    app: tauri::AppHandle,
) -> Result<Vec<ExampleWithMetadata>, String> {
    // Get database path from resources
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;

    let db_path = resource_path.join("embeddings/examples.db");

    if !db_path.exists() {
        return Err(format!(
            "Database not found at: {}",
            db_path.display()
        ));
    }

    // Open database connection
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Fetch all examples with metadata
    let mut stmt = conn
        .prepare(
            "SELECT id, title, category, before_text, after_text, tags, word_count, quality_score, source, created_at
             FROM example_scripts
             ORDER BY quality_score DESC, title ASC",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let examples = stmt
        .query_map([], |row| {
            let tags_str: Option<String> = row.get(5)?;
            let tags: Vec<String> = tags_str
                .map(|s| {
                    s.split(',')
                        .map(|t| t.trim().to_string())
                        .filter(|t| !t.is_empty())
                        .collect()
                })
                .unwrap_or_default();

            Ok(ExampleWithMetadata {
                id: row.get(0)?,
                title: row.get(1)?,
                category: row.get(2)?,
                before_text: row.get(3)?,
                after_text: row.get(4)?,
                tags,
                word_count: row.get(6)?,
                quality_score: row.get(7)?,
                source: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| format!("Failed to query database: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(examples)
}

// ============================================================================
// T022: Validation Helper Functions
// ============================================================================

/// Validate example title
fn validate_title(title: &str) -> Result<(), String> {
    let trimmed = title.trim();
    if trimmed.is_empty() {
        return Err("Title cannot be empty".to_string());
    }
    if trimmed.len() > 200 {
        return Err(format!("Title too long: {} chars (max 200)", trimmed.len()));
    }
    if title.contains('\n') || title.contains('\r') {
        return Err("Title cannot contain newlines".to_string());
    }
    Ok(())
}

/// Validate category enum
fn validate_category(category: &str) -> Result<(), String> {
    const VALID_CATEGORIES: &[&str] = &[
        "educational",
        "business",
        "narrative",
        "interview",
        "documentary",
        "user-custom",
    ];

    if !VALID_CATEGORIES.contains(&category) {
        return Err(format!(
            "Invalid category: '{}'. Valid options: {}",
            category,
            VALID_CATEGORIES.join(", ")
        ));
    }
    Ok(())
}

/// Validate text content length
fn validate_text_content(text: &str, field_name: &str) -> Result<(), String> {
    let trimmed = text.trim();
    if trimmed.len() < 50 {
        return Err(format!(
            "{} too short: {} chars (min 50)",
            field_name,
            trimmed.len()
        ));
    }
    if trimmed.len() > 100_000 {
        return Err(format!(
            "{} too long: {} chars (max 100,000)",
            field_name,
            trimmed.len()
        ));
    }
    Ok(())
}

/// Validate embedding dimensions
fn validate_embedding_dimensions(embedding: &[f32]) -> Result<(), String> {
    // Support both all-MiniLM-L6-v2 (384) and nomic-embed-text (768)
    const VALID_DIMENSIONS: &[usize] = &[384, 768];
    if !VALID_DIMENSIONS.contains(&embedding.len()) {
        return Err(format!(
            "Invalid embedding dimensions: expected {} or {}, got {}",
            VALID_DIMENSIONS[0],
            VALID_DIMENSIONS[1],
            embedding.len()
        ));
    }
    Ok(())
}

/// Calculate word count
fn calculate_word_count(text: &str) -> i32 {
    text.split_whitespace().count() as i32
}

// ============================================================================
// T023: Upload Example Command
// ============================================================================

#[tauri::command]
pub async fn upload_example(
    app: tauri::AppHandle,
    request: UploadExampleRequest,
) -> Result<String, String> {
    // Validate inputs
    validate_title(&request.metadata.title)?;
    validate_category(&request.metadata.category)?;
    validate_text_content(&request.before_content, "Before content")?;
    validate_text_content(&request.after_content, "After content")?;
    validate_embedding_dimensions(&request.embedding)?;

    // Generate UUID for new example
    let new_id = uuid::Uuid::new_v4().to_string();

    // Calculate word count
    let word_count = calculate_word_count(&request.before_content);

    // Get database path
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;
    let db_path = resource_path.join("embeddings/examples.db");

    // Open database connection
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Begin transaction
    conn.execute("BEGIN TRANSACTION", [])
        .map_err(|e| format!("Failed to begin transaction: {}", e))?;

    // Insert into example_scripts
    let tags_str = request
        .metadata
        .tags
        .map(|tags| tags.join(","))
        .unwrap_or_default();

    conn.execute(
        "INSERT INTO example_scripts (id, title, category, before_text, after_text, tags, word_count, quality_score, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            &new_id,
            &request.metadata.title,
            &request.metadata.category,
            &request.before_content,
            &request.after_content,
            &tags_str,
            word_count,
            request.metadata.quality_score,
            "user-uploaded",
        ],
    )
    .map_err(|e| format!("Failed to insert example: {}", e))?;

    // Convert embedding to binary
    let embedding_bytes: Vec<u8> = request
        .embedding
        .iter()
        .flat_map(|f| f.to_le_bytes().to_vec())
        .collect();

    // Insert embedding
    conn.execute(
        "INSERT INTO embeddings (script_id, embedding, dimension) VALUES (?, ?, ?)",
        params![&new_id, &embedding_bytes, request.embedding.len()],
    )
    .map_err(|e| format!("Failed to insert embedding: {}", e))?;

    // Commit transaction
    conn.execute("COMMIT", [])
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(new_id)
}

// ============================================================================
// T024: Replace Example Command
// ============================================================================

#[tauri::command]
pub async fn replace_example(
    app: tauri::AppHandle,
    id: String,
    request: ReplaceExampleRequest,
) -> Result<(), String> {
    // Validate inputs
    validate_text_content(&request.before_content, "Before content")?;
    validate_text_content(&request.after_content, "After content")?;
    validate_embedding_dimensions(&request.embedding)?;

    // Get database path
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;
    let db_path = resource_path.join("embeddings/examples.db");

    // Open database connection
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Check if example exists and is user-uploaded
    let source: String = conn
        .query_row(
            "SELECT source FROM example_scripts WHERE id = ?",
            params![&id],
            |row| row.get(0),
        )
        .map_err(|_| format!("Example not found: {}", id))?;

    if source == "bundled" {
        return Err(format!("Cannot replace bundled example: {}", id));
    }

    // Calculate new word count
    let word_count = calculate_word_count(&request.before_content);

    // Begin transaction
    conn.execute("BEGIN TRANSACTION", [])
        .map_err(|e| format!("Failed to begin transaction: {}", e))?;

    // Update example_scripts
    conn.execute(
        "UPDATE example_scripts SET before_text = ?, after_text = ?, word_count = ? WHERE id = ?",
        params![
            &request.before_content,
            &request.after_content,
            word_count,
            &id
        ],
    )
    .map_err(|e| format!("Failed to update example: {}", e))?;

    // Convert embedding to binary
    let embedding_bytes: Vec<u8> = request
        .embedding
        .iter()
        .flat_map(|f| f.to_le_bytes().to_vec())
        .collect();

    // Update embedding
    conn.execute(
        "UPDATE embeddings SET embedding = ? WHERE script_id = ?",
        params![&embedding_bytes, &id],
    )
    .map_err(|e| format!("Failed to update embedding: {}", e))?;

    // Commit transaction
    conn.execute("COMMIT", [])
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(())
}

// ============================================================================
// T025: Delete Example Command
// ============================================================================

#[tauri::command]
pub async fn delete_example(app: tauri::AppHandle, id: String) -> Result<(), String> {
    // Get database path
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;
    let db_path = resource_path.join("embeddings/examples.db");

    // Open database connection
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Check if example exists and is user-uploaded
    let source: String = conn
        .query_row(
            "SELECT source FROM example_scripts WHERE id = ?",
            params![&id],
            |row| row.get(0),
        )
        .map_err(|_| format!("Example not found: {}", id))?;

    if source == "bundled" {
        return Err(format!("Cannot delete bundled example: {}", id));
    }

    // Begin transaction
    conn.execute("BEGIN TRANSACTION", [])
        .map_err(|e| format!("Failed to begin transaction: {}", e))?;

    // Delete from embeddings (will cascade due to foreign key)
    conn.execute("DELETE FROM embeddings WHERE script_id = ?", params![&id])
        .map_err(|e| format!("Failed to delete embedding: {}", e))?;

    // Delete from example_scripts
    conn.execute("DELETE FROM example_scripts WHERE id = ?", params![&id])
        .map_err(|e| format!("Failed to delete example: {}", e))?;

    // Commit transaction
    conn.execute("COMMIT", [])
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(())
}
