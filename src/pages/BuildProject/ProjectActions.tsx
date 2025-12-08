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
    <div className="project-menu flex flex-row justify-around items-center mt-8 mx-6 rounded-lg">
      <div className="select-files">
        <button
          onClick={onSelectFiles}
          className="text-primary-foreground bg-primary hover:bg-primary/90
            focus:ring-4 focus:outline-hidden focus:ring-ring font-medium
            rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center
            me-2"
        >
          Select Files
        </button>
      </div>

      <div className="clear-all">
        <button
          onClick={onClearAll}
          className="text-destructive-foreground bg-destructive hover:bg-destructive/90
            focus:ring-4 focus:outline-hidden focus:ring-ring
            font-medium rounded-lg text-sm px-5 py-2.5 text-center
            inline-flex items-center me-2"
        >
          Clear All
        </button>
      </div>

      <div className="create-project">
        <button
          onClick={onCreateProject}
          className="inline-flex items-center justify-center
            p-0.5 me-2 overflow-hidden text-sm font-medium
            text-foreground rounded-lg group bg-gradient-to-br from-purple-500
            to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500
            hover:text-white dark:text-white focus:ring-4 focus:outline-hidden
            focus:ring-ring"
        >
          <span
            className="px-5 py-2.5 transition-all ease-in duration-75
              bg-background rounded-md group-hover:bg-transparent"
          >
            Create Project
          </span>
        </button>
      </div>
    </div>
  )
}

export default ProjectActions
