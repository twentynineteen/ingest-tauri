import {
  selectFiles,
  useBreadcrumb,
  useCameraAutoRemap,
  useCopyProgress,
  useCreateProject,
  useUsername
} from 'hooks'
import { useTrelloApiKeys } from 'hooks/useApiKeys'
import { FootageFile } from 'hooks/useCameraAutoRemap'
import React, { useState } from 'react'
import { TrelloCardsManager } from '../../components/Baker/TrelloCardsManager'
import FolderSelector from './FolderSelector'
import ProgressBar from './ProgressBar'
import ProjectActions from './ProjectActions'
import ProjectFileList from './ProjectFileList'
import ProjectInputs from './ProjectInputs'

// The BuildProject component is used for uploading footage from camera cards
// Footage can be marked with the relevant camera in order to place in the correct folder.

const BuildProject: React.FC = () => {
  const [title, setTitle] = useState('')
  const [numCameras, setNumCameras] = useState(2)
  const [files, setFiles] = useState<FootageFile[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [, setMessage] = useState('')

  // Track if title was sanitized to show warning
  const [titleSanitized, setTitleSanitized] = useState(false)

  // Page label - shadcn breadcrumb component
  useBreadcrumb([
    { label: 'Ingest footage', href: '/ingest/build' },
    { label: 'Build a project' }
  ])

  const username = useUsername()

  const { progress, completed } = useCopyProgress({
    operationId: 'build-project'
  })

  const { apiKey, apiToken } = useTrelloApiKeys()

  console.log('BuildProject render - progress:', progress, 'completed:', completed)

  useCameraAutoRemap(files, numCameras, setFiles)

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

  const handleSelectFiles = async () => {
    const newFiles = await selectFiles()
    setFiles(prev => [...prev, ...newFiles])
  }

  // Clears all the fields to their initial state
  const clearFields = () => {
    setTitle('')
    setNumCameras(2)
    setFiles([])
    setSelectedFolder('')
    setMessage('')
    setTitleSanitized(false)
  }

  // Logic to mark a given file with the camera number
  const updateFileCamera = (index: number, camera: number) => {
    // Validate camera number is within valid range
    if (camera < 1 || camera > numCameras) {
      console.warn(`Invalid camera number ${camera}. Must be between 1 and ${numCameras}`)
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
      console.log('Updated files:', updatedFiles) // Debugging
      return updatedFiles
    })
  }

  const { createProject } = useCreateProject()

  const handleCreateProject = () => {
    console.log('Create Project clicked!')
    console.log('Parameters:', { title, files: files.length, selectedFolder, numCameras })

    createProject({
      title,
      files,
      selectedFolder,
      numCameras,
      username: username.data || 'Unknown User',
      setMessage,
      setLoading
    })
  }

  return (
    <div className="">
      {/* Project Configuration & File Explorer */}
      <div className="w-full pb-4 border-b mb-4">
        <h2 className="px-4 text-2xl font-semibold">Build a Project</h2>
        <div className="px-4 mx-4">
          <ProjectInputs
            title={title}
            onTitleChange={handleTitleChange}
            numCameras={numCameras}
            onNumCamerasChange={setNumCameras}
            showSanitizationWarning={titleSanitized}
          />

          <FolderSelector selectedFolder={selectedFolder} onSelect={setSelectedFolder} />
        </div>
        <ProjectActions
          onSelectFiles={handleSelectFiles}
          onClearAll={clearFields}
          onCreateProject={handleCreateProject}
        />

        <div className="pt-4 justify-center items-center text-center ">
          <ProjectFileList
            files={files}
            numCameras={numCameras}
            onUpdateCamera={updateFileCamera}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        <div>
          <div className="progress mx-4">
            {/* 🔹 Show progress bar */}
            <ProgressBar progress={progress} completed={completed} />
          </div>

          {/* 🔹 Post-completion actions - shown after project completion */}
          {completed && !loading && selectedFolder && title && (
            <div className="pt-6 space-y-4 animate-fadeIn">
              <div className="mx-4 p-6 bg-linear-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-xs">
                <h3 className="text-lg font-semibold text-green-800 mb-4 text-center">
                  Project Created Successfully! 🎉
                </h3>

                {/* Trello Cards Manager */}
                <TrelloCardsManager
                  projectPath={`${selectedFolder}/${title}`}
                  trelloApiKey={apiKey}
                  trelloApiToken={apiToken}
                  autoSyncToTrello={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuildProject
