import { open } from '@tauri-apps/plugin-dialog'
import React from 'react'

type Props = {
  onSelect: (folderPath: string) => void
}

// The FolderTree component is used by the BuildTree component
// to select a folder path to move footage and build folders

const FolderTree: React.FC<Props> = ({ onSelect }) => {
  const [folderPath, setFolderPath] = React.useState<string>('')

  const openFolderPicker = async () => {
    try {
      const result = await open({
        directory: true // This specifies that the picker should be for selecting directories.
      })

      if (result) {
        const selectedFolder = result as string // Ensure that `result` is a string path.
        setFolderPath(selectedFolder)
        // Notify the parent component of the new folder path.
        onSelect(selectedFolder)
      }
    } catch (error) {
      console.error('Error selecting folder:', error)
    }
  }

  return (
    <div>
      <button
        onClick={openFolderPicker}
        className="bg-secondary border-sm rounded-md px-8 shadow-xl"
      >
        Select Folder
      </button>
      {folderPath ? (
        <p className="text-sm text-gray-700 mt-2">Destination: {folderPath}</p>
      ) : (
        <p className="text-sm text-gray-700 mt-2"></p>
      )}
    </div>
  )
}

export default FolderTree
