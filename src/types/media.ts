/**
 * Media Types - Video Links and Trello Cards
 * Feature: 004-embed-multiple-video
 */

/**
 * Represents a video link (typically Sprout Video) associated with a project
 */
export interface VideoLink {
  /** Full video URL (e.g., https://sproutvideo.com/videos/abc123) */
  url: string

  /** Extracted Sprout Video ID (e.g., "abc123") */
  sproutVideoId?: string

  /** User-provided or fetched video title */
  title: string

  /** Cached thumbnail URL from Sprout API */
  thumbnailUrl?: string

  /** ISO 8601 timestamp of upload */
  uploadDate?: string

  /** Original filename from Renders/ folder */
  sourceRenderFile?: string
}

/**
 * Represents a Trello card associated with a project
 */
export interface TrelloCard {
  /** Full Trello card URL (e.g., https://trello.com/c/abc123/project-name) */
  url: string

  /** Extracted card ID (e.g., "abc123") */
  cardId: string

  /** Fetched card name/title from Trello API */
  title: string

  /** Optional board name from Trello API */
  boardName?: string

  /** ISO 8601 timestamp of last title fetch */
  lastFetched?: string
}