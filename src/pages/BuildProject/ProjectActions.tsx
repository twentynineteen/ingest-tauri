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
          className="text-white bg-gray-700 hover:bg-gray-800 
            focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium 
            rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center 
            me-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
        >
          Select Files
        </button>
      </div>

      <div className="clear-all">
        <button
          onClick={onClearAll}
          className="text-white bg-red-700 hover:bg-red-800 
            focus:ring-4 focus:outline-none focus:ring-red-300 
            font-medium rounded-lg text-sm px-5 py-2.5 text-center 
            inline-flex items-center me-2 dark:bg-red-600 
            dark:hover:bg-red-700 dark:focus:ring-red-800"
        >
          Clear All
        </button>
      </div>

      <div className="create-project">
        <button
          onClick={onCreateProject}
          className="inline-flex items-center justify-center 
            p-0.5 me-2 overflow-hidden text-sm font-medium 
            text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 
            to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 
            hover:text-white dark:text-white focus:ring-4 focus:outline-none 
            focus:ring-purple-200 dark:focus:ring-purple-800"
        >
          <span
            className="px-5 py-2.5 transition-all ease-in duration-75 
              bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent 
              group-hover:dark:bg-transparent"
          >
            Create Project
          </span>
        </button>
      </div>
    </div>
  )
}

export default ProjectActions
