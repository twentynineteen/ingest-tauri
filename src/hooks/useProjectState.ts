import { useState } from 'react'
import { selectFiles } from './useFileSelector'
import { FootageFile } from './useCameraAutoRemap'
import { createNamespacedLogger } from '../utils/logger'

const logger = createNamespacedLogger('useProjectState')

/**
 * Manages the core state and business logic for the BuildProject workflow
 * Encapsulates all project configuration state, file management, and user actions
 */
export function useProjectState() {
  const [title, setTitle] = useState('')
  const [numCameras, setNumCameras] = useState(2)
  const [files, setFiles] = useState<FootageFile[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [titleSanitized, setTitleSanitized] = useState(false)

  // Sanitize title to prevent folder creation from forward slashes and other OS-unsafe characters
  const sanitizeTitle = (input: string): string => {
    // Only replace OS-unsafe characters, preserve spaces as-is
    return input.replace(/[/\\:*?"<>|]/g, '-')
  }

  // Handle title change with sanitization
  const handleTitleChange = (newTitle: string) => {
    const sanitized = sanitizeTitle(newTitle)
    const wasSanitized = sanitized !== newTitle
    setTitle(sanitized)
    setTitleSanitized(wasSanitized)
  }

  // Select and add files to the project
  const handleSelectFiles = async () => {
    const newFiles = await selectFiles()
    setFiles(prev => [...prev, ...newFiles])
  }

  // Logic to mark a given file with the camera number
  const updateFileCamera = (index: number, camera: number) => {
    // Validate camera number is within valid range
    if (camera < 1 || camera > numCameras) {
      logger.warn(`Invalid camera number ${camera}. Must be between 1 and ${numCameras}`)
      return
    }

    const updatedFiles = files.map((item, idx) =>
      idx === index ? { ...item, camera } : item
    )
    setFiles(updatedFiles)
  }

  // Removes the selected file from the folder tree
  const handleDeleteFile = (index: number) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter((_, idx) => idx !== index)
      logger.log('Updated files:', updatedFiles)
      return updatedFiles
    })
  }

  // Clears all the fields to their initial state (does NOT reset completion state)
  const clearAllFields = () => {
    setTitle('')
    setNumCameras(2)
    setFiles([])
    setSelectedFolder('')
    setTitleSanitized(false)
  }

  return {
    // State
    title,
    numCameras,
    files,
    selectedFolder,
    titleSanitized,
    // Setters (for direct updates)
    setNumCameras,
    setSelectedFolder,
    setFiles, // Exposed for useCameraAutoRemap
    // Handlers (with business logic)
    handleTitleChange,
    handleSelectFiles,
    updateFileCamera,
    handleDeleteFile,
    clearAllFields
  }
}
