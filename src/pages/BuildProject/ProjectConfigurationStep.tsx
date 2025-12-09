import { STEP_CARD_ANIMATION } from '../../constants/animations'
import FolderSelector from './FolderSelector'
import ProjectInputs from './ProjectInputs'

interface ProjectConfigurationStepProps {
  showSuccess: boolean
  title: string
  onTitleChange: (newTitle: string) => void
  numCameras: number
  onNumCamerasChange: (numCameras: number) => void
  titleSanitized: boolean
  selectedFolder: string
  onSelectFolder: (folder: string) => void
}

export const ProjectConfigurationStep: React.FC<ProjectConfigurationStepProps> = ({
  showSuccess,
  title,
  onTitleChange,
  numCameras,
  onNumCamerasChange,
  titleSanitized,
  selectedFolder,
  onSelectFolder
}) => {
  return (
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
        <h2 className="text-sm font-semibold text-foreground">Project Configuration</h2>
        {showSuccess && (
          <span className="text-xs text-muted-foreground ml-auto">{title}</span>
        )}
      </div>
      {!showSuccess && (
        <div className="mt-3">
          <ProjectInputs
            title={title}
            onTitleChange={onTitleChange}
            numCameras={numCameras}
            onNumCamerasChange={onNumCamerasChange}
            showSanitizationWarning={titleSanitized}
          />
          <div className="mt-3">
            <FolderSelector selectedFolder={selectedFolder} onSelect={onSelectFolder} />
          </div>
        </div>
      )}
    </div>
  )
}
