import {
  selectFiles,
  useBreadcrumb,
  useCameraAutoRemap,
  useCopyProgress,
  useCreateProject,
  useUsername
} from 'hooks'
import { FootageFile } from 'hooks/useCameraAutoRemap'
import React, { useState } from 'react'
import TrelloIntegrationButton from '../../components/trello/TrelloIntegrationButton'
import TrelloIntegrationModal from '../../components/trello/TrelloIntegrationModal'
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

  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Trello integration state
  const [showTrelloModal, setShowTrelloModal] = useState(false)

  // Page label - shadcn breadcrumb component
  useBreadcrumb([
    { label: 'Ingest footage', href: '/ingest/build' },
    { label: 'Build a project' }
  ])

  const username = useUsername()

  useCopyProgress(setProgress, setCompleted)

  useCameraAutoRemap(files, numCameras, setFiles)

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
    setProgress(0)
    setCompleted(false)
    setMessage('')
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
    createProject({
      title,
      files,
      selectedFolder,
      numCameras,
      username,
      setProgress,
      setCompleted,
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
            onTitleChange={setTitle}
            numCameras={numCameras}
            onNumCamerasChange={setNumCameras}
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
          {/* 🔹 Show progress bar */}
          <ProgressBar progress={progress} completed={completed} />
          
          {/* 🔹 Post-completion actions - shown after project completion */}
          {completed && !loading && (
            <div className="pt-4 text-center space-y-3">
              <div className="flex justify-center gap-4">
                <TrelloIntegrationButton 
                  onClick={() => setShowTrelloModal(true)}
                />
                <button
                  onClick={clearFields}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Trello Integration Modal */}
      <TrelloIntegrationModal
        isOpen={showTrelloModal}
        onClose={() => setShowTrelloModal(false)}
      />
    </div>
  )
}

export default BuildProject
