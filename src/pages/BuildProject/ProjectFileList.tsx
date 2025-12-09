// components/BuildProject/ProjectFileList.tsx

import { Film, Trash2, Video } from 'lucide-react'
import React from 'react'
import { FILE_LIST_ANIMATION } from '../../constants/animations'

interface FootageFile {
  file: {
    name: string
    path: string
  }
  camera: number
}

interface ProjectFileListProps {
  files: FootageFile[]
  numCameras: number
  onUpdateCamera: (index: number, camera: number) => void
  onDeleteFile: (index: number) => void
}

const ProjectFileList: React.FC<ProjectFileListProps> = ({
  files,
  numCameras,
  onUpdateCamera,
  onDeleteFile
}) => {
  // Empty state
  if (files.length === 0) {
    return (
      <div className="mx-auto max-w-md py-6 px-6">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 bg-muted/20">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Film className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            No files selected yet
          </h3>
          <p className="text-xs text-muted-foreground text-center">
            Click &quot;Select Files&quot; to add footage to your project
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 w-full max-w-full">
      {files.map((item, idx) => (
        <div
          key={`${item.file.path}-${idx}`}
          className="group relative bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200 w-full max-w-full"
          style={{
            animation: `${FILE_LIST_ANIMATION.name} ${FILE_LIST_ANIMATION.duration}ms ${FILE_LIST_ANIMATION.easing} ${idx * FILE_LIST_ANIMATION.staggerDelay}ms both`
          }}
        >
          {/* File Icon and Info */}
          <div className="flex items-start gap-3 w-full max-w-full min-w-0">
            <div className="flex-shrink-0 mt-1">
              <div className="rounded-md bg-primary/10 p-2">
                <Video className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div
              className="flex-1 min-w-0 overflow-hidden"
              style={{ maxWidth: '100%', width: 0 }}
            >
              {/* File Name */}
              <h4
                className="text-sm font-semibold text-foreground mb-1 truncate"
                title={item.file.name}
              >
                {item.file.name}
              </h4>
              {/* File Path */}
              <p
                className="text-xs text-muted-foreground italic truncate"
                title={item.file.path}
              >
                {item.file.path}
              </p>
            </div>

            {/* Camera Selector & Delete Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Camera Badge/Selector */}
              <select
                aria-label={`Select camera for ${item.file.name}`}
                className="text-xs border border-input bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:bg-secondary/80 focus:ring-2 focus:ring-ring focus:outline-none transition-colors cursor-pointer"
                value={item.camera}
                onChange={e => onUpdateCamera(idx, Number(e.target.value))}
              >
                {Array.from({ length: numCameras }, (_, i) => i + 1).map(cam => (
                  <option key={cam} value={cam}>
                    Camera {cam}
                  </option>
                ))}
              </select>

              {/* Delete Button */}
              <button
                onClick={() => onDeleteFile(idx)}
                aria-label={`Delete ${item.file.name}`}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProjectFileList
