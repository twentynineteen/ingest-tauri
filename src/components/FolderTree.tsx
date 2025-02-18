import { open } from '@tauri-apps/plugin-dialog'
import React, { useEffect } from 'react'

type Props = {
  onSelect: (folderPath: string) => void
  selectedFolder: string
}

// The FolderTree component is used by the BuildTree component
// to select a folder path to move footage and build folders

const FolderTree: React.FC<Props> = ({ onSelect, selectedFolder }) => {
  const [folderPath, setFolderPath] = React.useState<string>('')

  useEffect(() => {
    setFolderPath(selectedFolder)
  }, [selectedFolder])

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
    <div className="flex items-center justify-evenly rounded-lg py-3">
      <button
        onClick={openFolderPicker}
        className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
      >
        Select Destination
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
