import React from 'react'

interface ProjectInputsProps {
  title: string
  onTitleChange: (value: string) => void
  numCameras: number
  onNumCamerasChange: (value: number) => void
}

const ProjectInputs: React.FC<ProjectInputsProps> = ({
  title,
  onTitleChange,
  numCameras,
  onNumCamerasChange
}) => {
  return (
    <div className="title-camera-inline flex flex-row gap-6 pt-3">
      {/* Project Title Input */}
      <div className="title-input w-full">
        <label
          htmlFor="project-title"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Project title
        </label>
        <input
          id="project-title"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 
            text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 
            block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 
            dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 
            dark:focus:border-blue-500"
          placeholder="Enter title here"
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          e.g. DBA - IB1234 - J Doe - Introductions 060626
        </p>
      </div>

      {/* Number of Cameras Input */}
      <div className="camera-input">
        <label
          htmlFor="number-input"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Number of cameras:
        </label>
        <input
          type="number"
          id="number-input"
          className="bg-gray-50 border border-gray-300 
            text-gray-900 text-sm rounded-lg focus:ring-blue-500 
            focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 
            dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
            dark:focus:ring-blue-500 dark:focus:border-blue-500 font-semibold"
          placeholder="2"
          value={numCameras}
          onChange={e => onNumCamerasChange(Number(e.target.value))}
          required
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Default: 2</p>
      </div>
    </div>
  )
}

export default ProjectInputs
