import { FolderPlus } from 'lucide-react'
import { STEP_CARD_ANIMATION } from '../../constants/animations'

interface CreateProjectStepProps {
  showSuccess: boolean
  title: string
  selectedFolder: string
  onCreateProject: () => void
}

export const CreateProjectStep: React.FC<CreateProjectStepProps> = ({
  showSuccess,
  title,
  selectedFolder,
  onCreateProject
}) => {
  return (
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
            <h2 className="text-sm font-semibold text-foreground">Create Project</h2>
            {!showSuccess && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Review and create your project
              </p>
            )}
          </div>
        </div>
        {!showSuccess && (
          <button
            onClick={onCreateProject}
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
  )
}
