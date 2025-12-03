import { open } from '@tauri-apps/plugin-dialog'
import React from 'react'
import { logger } from '@/utils/logger'

type Props = {
  onSelect: (folderPath: string) => void
  selectedFolder: string
}

// The FolderTree component is used by the BuildTree component
// to select a folder path to move footage and build folders

const FolderTree: React.FC<Props> = ({ onSelect, selectedFolder }) => {
  // Use selectedFolder directly from props instead of syncing to local state
  // This eliminates the need for useEffect and makes the component simpler

  const openFolderPicker = async () => {
    try {
      const result = await open({
        directory: true // This specifies that the picker should be for selecting directories.
      })

      if (result) {
        const newSelectedFolder = result as string // Ensure that `result` is a string path.
        // Notify the parent component of the new folder path.
        onSelect(newSelectedFolder)
      }
    } catch (error) {
      logger.error('Error selecting folder:', error)
    }
  }

  return (
    <div className="flex items-center justify-evenly rounded-lg py-3">
      <button
        onClick={openFolderPicker}
        className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-hidden focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
      >
        Select Destination
      </button>
      {selectedFolder ? (
        <p className="text-sm text-gray-700 mt-2">Destination: {selectedFolder}</p>
      ) : (
        <p className="text-sm text-gray-700 mt-2"></p>
      )}
    </div>
  )
}

export default FolderTree
