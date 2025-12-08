import { logger } from '@/utils/logger'
import { open } from '@tauri-apps/plugin-dialog'
import React from 'react'

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
    <div className="flex items-center gap-3 rounded-lg py-2">
      <button
        onClick={openFolderPicker}
        className="inline-flex items-center justify-center gap-2
          px-5 py-2 text-sm font-semibold
          text-primary-foreground bg-primary hover:bg-primary/90
          rounded-lg shadow-sm hover:shadow
          focus:ring-4 focus:outline-none focus:ring-ring
          transition-colors duration-200 flex-shrink-0"
      >
        Select Destination
      </button>
      {selectedFolder ? (
        <div className="flex-1 min-w-0 px-3 py-2 bg-card border border-border rounded-lg overflow-hidden">
          <p className="text-sm font-medium text-foreground truncate" title={selectedFolder}>
            {selectedFolder}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-w-0 px-3 py-2 bg-muted/20 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground italic">
            No destination selected
          </p>
        </div>
      )}
    </div>
  )
}

export default FolderTree
