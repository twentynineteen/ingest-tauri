import { FolderPlus, RefreshCw, Upload } from 'lucide-react'
import React from 'react'

interface ProjectActionsProps {
  onSelectFiles: () => void
  onClearAll: () => void
  onCreateProject: () => void
}

const ProjectActions: React.FC<ProjectActionsProps> = ({
  onSelectFiles,
  onClearAll,
  onCreateProject
}) => {
  return (
    <div className="flex flex-row gap-3 items-center justify-center mt-4 mx-8">
      {/* Primary Action - Select Files (First Step) */}
      <button
        onClick={onSelectFiles}
        className="inline-flex items-center justify-center gap-2
          px-5 py-2 text-sm font-semibold
          text-primary-foreground bg-primary hover:bg-primary/90
          rounded-lg shadow-sm hover:shadow
          focus:ring-4 focus:outline-none focus:ring-ring
          transition-colors duration-200"
      >
        <Upload className="w-4 h-4" />
        Select Files
      </button>

      {/* Secondary Action - Create Project (Final Step, Most Prominent) */}
      <button
        onClick={onCreateProject}
        className="inline-flex items-center justify-center gap-2
          px-5 py-2 text-sm font-semibold text-white
          bg-gradient-to-r from-chart-4 to-chart-5
          hover:from-chart-4/90 hover:to-chart-5/90
          rounded-lg shadow-md hover:shadow-lg
          focus:ring-4 focus:outline-none focus:ring-chart-4/50
          transition-colors duration-200"
      >
        <FolderPlus className="w-4 h-4" />
        Create Project
      </button>

      {/* Tertiary Action - Clear All (Rarely Used, Subtle) */}
      <button
        onClick={onClearAll}
        className="inline-flex items-center justify-center gap-2
          px-5 py-2 text-sm font-semibold
          text-muted-foreground border border-border bg-background
          hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30
          rounded-lg
          focus:ring-4 focus:outline-none focus:ring-ring
          transition-colors duration-200"
      >
        <RefreshCw className="w-4 h-4" />
        Clear All
      </button>
    </div>
  )
}

export default ProjectActions
