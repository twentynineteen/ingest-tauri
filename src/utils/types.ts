// types.ts
// Define the interface for a SproutVideo folder.
export interface SproutFolder {
  id: string
  name: string
  parent_id: string | null
}

// The expected API response from the Tauri command.
export interface GetFoldersResponse {
  folders: SproutFolder[]
}
