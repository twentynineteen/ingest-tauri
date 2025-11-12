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

    // Fetch all examples with embeddings
    let mut stmt = conn
        .prepare(
            "SELECT e.script_id, s.title, s.category, s.before_text, s.after_text, e.embedding
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
            ))
        })
        .map_err(|e| format!("Failed to query database: {}", e))?;

    for row_result in rows {
        let (id, title, category, before_text, after_text, embedding_blob) =
            row_result.map_err(|e| format!("Failed to read row: {}", e))?;

        // Convert blob to vector
        let embedding = blob_to_vec_f32(&embedding_blob);

        // Calculate similarity
        let similarity = cosine_similarity(&query_embedding, &embedding);

        // Apply minimum similarity threshold
        if let Some(min_sim) = min_similarity {
            if similarity < min_sim {
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
