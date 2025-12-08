import {
  useBreadcrumb,
  useCameraAutoRemap,
  useCopyProgress,
  useCreateProject,
  useProjectCompletion,
  useProjectState,
  useUsername
} from 'hooks'
import { useTrelloApiKeys } from 'hooks/useApiKeys'
import { FolderPlus, RefreshCw, Upload } from 'lucide-react'
import { useState } from 'react'
import { TrelloCardsManager } from '../../components/Baker/TrelloCardsManager'
import { STEP_CARD_ANIMATION, SUCCESS_ANIMATION } from '../../constants/animations'
import { createNamespacedLogger } from '../../utils/logger'
import FolderSelector from './FolderSelector'
import ProgressBar from './ProgressBar'
import ProjectFileList from './ProjectFileList'
import ProjectInputs from './ProjectInputs'

const logger = createNamespacedLogger('BuildProject')

// The BuildProject component is used for uploading footage from camera cards
// Footage can be marked with the relevant camera in order to place in the correct folder.

const BuildProject: React.FC = () => {
  // Project state and business logic
  const {
    title,
    numCameras,
    files,
    selectedFolder,
    titleSanitized,
    setNumCameras,
    setSelectedFolder,
    setFiles,
    handleTitleChange,
    handleSelectFiles,
    updateFileCamera,
    handleDeleteFile,
    clearAllFields
  } = useProjectState()

  const [loading, setLoading] = useState(false)

  // Page label - shadcn breadcrumb component
  useBreadcrumb([
    { label: 'Ingest footage', href: '/ingest/build' },
    { label: 'Build a project' }
  ])

  const username = useUsername()

  const { progress, completed } = useCopyProgress({
    operationId: 'build-project'
  })

  // Track completion with delayed animation trigger
  const { showSuccess, reset: resetCompletion } = useProjectCompletion({
    completed,
    loading,
    delayMs: SUCCESS_ANIMATION.delay
  })

  const { apiKey, apiToken } = useTrelloApiKeys()

  logger.log('BuildProject render - progress:', progress, 'completed:', completed)

  // Auto-remap camera assignments when numCameras changes
  useCameraAutoRemap(files, numCameras, setFiles)

  // Clears all fields including completion state
  const clearFields = () => {
    clearAllFields()
    resetCompletion() // Reset success state to re-expand cards
  }

  const { createProject } = useCreateProject()

  const handleCreateProject = () => {
    logger.log('Create Project clicked!')
    logger.log('Parameters:', { title, files: files.length, selectedFolder, numCameras })

    createProject({
      title,
      files,
      selectedFolder,
      numCameras,
      username: username.data || 'Unknown User',
      setMessage: () => {}, // No-op callback (message not displayed in UI)
      setLoading
    })
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden">
      {/* Project Configuration & File Explorer */}
      <div className="w-full max-w-full pb-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-card/50">
          <h1 className="text-2xl font-bold text-foreground">Build a Project</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure project settings, select footage files, and create organized folder
            structures
          </p>
        </div>

        <div className="px-6 py-4 space-y-4 max-w-full">
          {/* Step 1: Project Configuration */}
          <div
            className="bg-card border border-border rounded-xl shadow-sm max-w-full transition-all overflow-hidden"
            style={{
              maxHeight: showSuccess
                ? STEP_CARD_ANIMATION.collapsedHeight
                : STEP_CARD_ANIMATION.expandedHeight,
              padding: showSuccess
                ? STEP_CARD_ANIMATION.collapsedPadding
                : STEP_CARD_ANIMATION.expandedPadding,
              transitionDuration: `${STEP_CARD_ANIMATION.duration}ms`,
              transitionTimingFunction: STEP_CARD_ANIMATION.easing
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                1
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                Project Configuration
              </h2>
              {showSuccess && (
                <span className="text-xs text-muted-foreground ml-auto">{title}</span>
              )}
            </div>
            {!showSuccess && (
              <div className="mt-3">
                <ProjectInputs
                  title={title}
                  onTitleChange={handleTitleChange}
                  numCameras={numCameras}
                  onNumCamerasChange={setNumCameras}
                  showSanitizationWarning={titleSanitized}
                />
                <div className="mt-3">
                  <FolderSelector
                    selectedFolder={selectedFolder}
                    onSelect={setSelectedFolder}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Add Files */}
          <div
            className="bg-card border border-border rounded-xl shadow-sm max-w-full transition-all overflow-hidden"
            style={{
              maxHeight: showSuccess
                ? STEP_CARD_ANIMATION.collapsedHeight
                : STEP_CARD_ANIMATION.expandedHeight,
              padding: showSuccess
                ? STEP_CARD_ANIMATION.collapsedPadding
                : STEP_CARD_ANIMATION.expandedPadding,
              transitionDuration: `${STEP_CARD_ANIMATION.duration}ms`,
              transitionTimingFunction: STEP_CARD_ANIMATION.easing
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                  2
                </div>
                <h2 className="text-sm font-semibold text-foreground">Add Footage</h2>
                {showSuccess && files.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({files.length} file{files.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
              {!showSuccess && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectFiles}
                    className="inline-flex items-center justify-center gap-1.5
                      px-4 py-1.5 text-xs font-semibold
                      text-primary-foreground bg-primary hover:bg-primary/90
                      rounded-lg shadow-sm hover:shadow
                      focus:ring-2 focus:outline-none focus:ring-ring
                      transition-colors duration-200"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Select Files
                  </button>
                  {files.length > 0 && (
                    <button
                      onClick={clearFields}
                      className="inline-flex items-center justify-center gap-1.5
                        px-3 py-1.5 text-xs font-medium
                        text-muted-foreground border border-border bg-background
                        hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30
                        rounded-lg
                        focus:ring-2 focus:outline-none focus:ring-ring
                        transition-colors duration-200"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
            {!showSuccess && (
              <div className="mt-3">
                <ProjectFileList
                  files={files}
                  numCameras={numCameras}
                  onUpdateCamera={updateFileCamera}
                  onDeleteFile={handleDeleteFile}
                />
              </div>
            )}
          </div>

          {/* Step 3: Create Project */}
          <div
            className="bg-card border-2 border-primary/20 rounded-xl shadow-sm max-w-full transition-all overflow-hidden"
            style={{
              maxHeight: showSuccess
                ? STEP_CARD_ANIMATION.collapsedHeight
                : STEP_CARD_ANIMATION.expandedHeight,
              padding: showSuccess
                ? STEP_CARD_ANIMATION.collapsedPadding
                : STEP_CARD_ANIMATION.expandedPadding,
              transitionDuration: `${STEP_CARD_ANIMATION.duration}ms`,
              transitionTimingFunction: STEP_CARD_ANIMATION.easing
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Create Project
                  </h2>
                  {!showSuccess && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Review and create your project
                    </p>
                  )}
                </div>
              </div>
              {!showSuccess && (
                <button
                  onClick={handleCreateProject}
                  disabled={!title || !selectedFolder}
                  className="inline-flex items-center justify-center gap-2
                    px-6 py-2.5 text-sm font-semibold text-white
                    bg-gradient-to-r from-chart-4 to-chart-5
                    hover:from-chart-4/90 hover:to-chart-5/90
                    disabled:from-muted disabled:to-muted disabled:cursor-not-allowed disabled:opacity-50
                    rounded-lg shadow-md hover:shadow-lg
                    focus:ring-4 focus:outline-none focus:ring-chart-4/50
                    transition-colors duration-200"
                >
                  <FolderPlus className="w-4 h-4" />
                  Create Project
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 mt-4">
          <ProgressBar progress={progress} completed={completed} />
        </div>

        {/* Success Message & Post-completion Actions */}
        {showSuccess && !loading && selectedFolder && title && (
          <div
            className="px-6 mt-4 animate-in fade-in slide-in-from-bottom-4"
            style={{
              animation: `fadeInUp ${SUCCESS_ANIMATION.fadeInDuration}ms ${SUCCESS_ANIMATION.fadeInEasing}`,
              opacity: 0,
              animationFillMode: 'forwards'
            }}
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-success/10 via-success/5 to-transparent border-2 border-success/30 rounded-xl p-6 shadow-lg">
              {/* Start New Project Button - Top Right */}
              <button
                onClick={clearFields}
                className="absolute top-4 right-4 inline-flex items-center justify-center gap-2
                  px-4 py-2 text-xs font-semibold
                  text-foreground bg-card border border-border
                  hover:bg-secondary hover:border-primary/30
                  rounded-lg shadow-sm hover:shadow
                  focus:ring-2 focus:outline-none focus:ring-ring
                  transition-all duration-200 z-10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Start New Project
              </button>

              {/* Success Icon & Message */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-success/10 rounded-full p-3 border-2 border-success/30">
                    <svg
                      className="w-8 h-8 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-success text-center mb-2">
                Project Created Successfully!
              </h2>
              <p className="text-center text-muted-foreground text-sm mb-4">
                Your project has been created and is ready for editing
              </p>

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
  )
}

export default BuildProject
