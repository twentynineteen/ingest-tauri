import { Button } from '@components/ui/button'
import { STEP_CARD_ANIMATION } from '@constants/animations'
import { FootageFile } from '@hooks/useCameraAutoRemap'
import { RefreshCw, Upload } from 'lucide-react'
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
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">Add Footage</h2>
            {!showSuccess && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Select footage files and assign camera numbers
              </p>
            )}
          </div>
          {showSuccess && files.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({files.length} file{files.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        {!showSuccess && (
          <div className="flex gap-2">
            <Button
              onClick={onSelectFiles}
              size="sm"
              className="gap-1.5 shadow-sm hover:shadow"
            >
              <Upload className="w-3.5 h-3.5" />
              Select Files
            </Button>
            {files.length > 0 && (
              <Button
                onClick={onClearAll}
                variant="outline"
                size="sm"
                className="gap-1.5
                  hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear
              </Button>
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
