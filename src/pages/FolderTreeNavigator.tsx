// FolderTreeNavigator.tsx
import { invoke } from '@tauri-apps/api/core'
import React, { useEffect, useState } from 'react'
import { GetFoldersResponse, SproutFolder } from '../utils/types'
import FolderTreeSprout from './FolderTreeSprout'

interface FolderTreeNavigatorProps {
  apiKey: string
}

const FolderTreeNavigator: React.FC<FolderTreeNavigatorProps> = ({ apiKey }) => {
  // State for the root folders and selected folder.
  const [rootFolders, setRootFolders] = useState<SproutFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<SproutFolder | null>(null)

  // Fetch root folders on component mount.
  useEffect(() => {
    async function fetchRootFolders() {
      try {
        // Fetch folders with no parent (root folders).
        const result = await invoke<GetFoldersResponse>('get_folders', {
          apiKey,
          parent_id: null
        })
        setRootFolders(result.folders)
      } catch (error) {
        console.error('Error fetching root folders:', error)
      }
    }
    if (apiKey) {
      fetchRootFolders()
    }
  }, [apiKey])

  return (
    <div>
      <h3>Select a Folder</h3>
      {/* Render each root folder using the recursive FolderTreeSprout component */}
      {rootFolders.map(folder => (
        <FolderTreeSprout
          key={folder.id}
          folder={folder}
          apiKey={apiKey}
          onSelect={folder => setSelectedFolder(folder)}
        />
      ))}
      {selectedFolder && <p>Selected Folder: {selectedFolder.name}</p>}
    </div>
  )
}

export default FolderTreeNavigator
