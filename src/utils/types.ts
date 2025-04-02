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

// interface for camera number and footage filename
export interface FootageData {
  camera: number
  name: string
}

// interface for breadcrumb / project files first declared in BuildProject.tsx
export interface Breadcrumb {
  projectTitle?: string
  numberOfCameras?: number
  files?: FootageData[]
  parentFolder?: string
  createdBy?: string
  creationDateTime?: string
}
