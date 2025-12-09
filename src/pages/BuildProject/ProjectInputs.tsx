import { AlertCircle, Camera, FileText } from 'lucide-react'
import React from 'react'
import { PROJECT_LIMITS } from '../../constants/project'

interface ProjectInputsProps {
  title: string
  onTitleChange: (value: string) => void
  numCameras: number
  onNumCamerasChange: (value: number) => void
  showSanitizationWarning?: boolean
}

const ProjectInputs: React.FC<ProjectInputsProps> = ({
  title,
  onTitleChange,
  numCameras,
  onNumCamerasChange,
  showSanitizationWarning = false
}) => {
  return (
    <div className="flex flex-row gap-4">
      {/* Project Title Input */}
      <div className="flex-1">
        <label
          htmlFor="project-title"
          className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-foreground"
        >
          <FileText className="w-3.5 h-3.5 text-primary" />
          Project Title
        </label>
        <input
          id="project-title"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          className="bg-secondary border border-input text-foreground
            text-sm rounded-lg
            focus:ring-2 focus:ring-info focus:border-info
            hover:border-input/80
            block w-full px-3 py-2
            transition-all duration-200"
          placeholder="e.g. DBA - IB1234 - J Doe - Introductions 060626"
        />
        {showSanitizationWarning ? (
          <div className="flex items-start gap-1.5 mt-1.5 p-1.5 bg-warning/10 border border-warning/30 rounded-md">
            <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning">
              Some characters were changed to hyphens (/ \ : * ? &quot; &lt; &gt; |) to
              ensure compatibility
            </p>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Enter project title here</p>
        )}
      </div>

      {/* Number of Cameras Input */}
      <div className="w-40 flex-shrink-0">
        <label
          htmlFor="number-input"
          className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-foreground"
        >
          <Camera className="w-3.5 h-3.5 text-primary" />
          Cameras
        </label>
        <input
          type="number"
          id="number-input"
          min={PROJECT_LIMITS.MIN_CAMERAS}
          max={PROJECT_LIMITS.MAX_CAMERAS}
          className="bg-secondary border border-input
            text-foreground text-sm rounded-lg font-semibold
            focus:ring-2 focus:ring-info focus:border-info
            hover:border-input/80
            block w-full px-3 py-2
            transition-all duration-200"
          placeholder={String(PROJECT_LIMITS.DEFAULT_CAMERAS)}
          value={numCameras}
          onChange={e => onNumCamerasChange(Number(e.target.value))}
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">Number of cameras</p>
      </div>
    </div>
  )
}

export default ProjectInputs
