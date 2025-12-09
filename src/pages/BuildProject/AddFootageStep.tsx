import { FootageFile } from 'hooks/useCameraAutoRemap'
import { RefreshCw, Upload } from 'lucide-react'
import { STEP_CARD_ANIMATION } from '../../constants/animations'
import ProjectFileList from './ProjectFileList'

interface AddFootageStepProps {
  showSuccess: boolean
  files: FootageFile[]
  numCameras: number
  onSelectFiles: () => void
  onUpdateCamera: (index: number, camera: number) => void
  onDeleteFile: (index: number) => void
  onClearAll: () => void
}

export const AddFootageStep: React.FC<AddFootageStepProps> = ({
  showSuccess,
  files,
  numCameras,
  onSelectFiles,
  onUpdateCamera,
  onDeleteFile,
  onClearAll
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
              onClick={onSelectFiles}
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
                onClick={onClearAll}
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
            onUpdateCamera={onUpdateCamera}
            onDeleteFile={onDeleteFile}
          />
        </div>
      )}
    </div>
  )
}
