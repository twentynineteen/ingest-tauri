import { Button } from '@components/ui/button'
import { STEP_CARD_ANIMATION } from '@constants/animations'
import { FolderPlus } from 'lucide-react'

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
  const isDisabled = !title.trim() || !selectedFolder

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
          <>
            <Button
              onClick={onCreateProject}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              aria-describedby={isDisabled ? 'create-btn-requirements' : undefined}
              title={
                isDisabled
                  ? 'Please enter a project title and select a folder'
                  : undefined
              }
              animationStyle="glow"
              className="px-6 py-2.5 font-semibold text-white
                bg-gradient-to-r from-chart-4 to-chart-5
                disabled:from-muted disabled:to-muted
                shadow-md"
            >
              <FolderPlus className="w-4 h-4" />
              Create Project
            </Button>
            {isDisabled && (
              <span id="create-btn-requirements" className="sr-only">
                Requires project title and selected folder
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
