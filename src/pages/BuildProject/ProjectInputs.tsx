import React from 'react'

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
    <div className="title-camera-inline flex flex-row gap-6 pt-3">
      {/* Project Title Input */}
      <div className="title-input w-full">
        <label
          htmlFor="project-title"
          className="block mb-2 text-sm font-medium text-foreground"
        >
          Project title
        </label>
        <input
          id="project-title"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          className="bg-secondary border border-input text-foreground
            text-sm rounded-lg focus:ring-info focus:border-info
            block w-full p-2.5"
          placeholder="Enter title here"
        />
        {showSanitizationWarning ? (
          <p className="mt-2 text-sm text-warning">
            Some characters were changed to hyphens (/ \ : * ? " &lt; &gt; |) to ensure
            compatibility
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            e.g. DBA - IB1234 - J Doe - Introductions 060626
          </p>
        )}
      </div>

      {/* Number of Cameras Input */}
      <div className="camera-input">
        <label
          htmlFor="number-input"
          className="block mb-2 text-sm font-medium text-foreground"
        >
          Number of cameras:
        </label>
        <input
          type="number"
          id="number-input"
          className="bg-secondary border border-input
            text-foreground text-sm rounded-lg focus:ring-info
            focus:border-info block w-full p-2.5 font-semibold"
          placeholder="2"
          value={numCameras}
          onChange={e => onNumCamerasChange(Number(e.target.value))}
          required
        />
        <p className="mt-2 text-sm text-muted-foreground">Default: 2</p>
      </div>
    </div>
  )
}

export default ProjectInputs
