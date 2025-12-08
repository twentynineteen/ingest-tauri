// components/BuildProject/ProjectFileList.tsx

import { Trash2 } from 'lucide-react'
import React from 'react'

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
  if (files.length === 0) return null

  return (
    <ul className="mx-2 justify-center">
      {files.map((item, idx) => (
        <li
          key={`${item.file.path}-${idx}`} // Ensures unique key
          className="my-4 text-sm text-foreground flex justify-between items-center"
        >
          <span className="px-4 truncate w-48 text-start">{item.file.name}</span>
          <span className="truncate italic w-72">({item.file.path})</span>

          <div className="flex justify-center px-4 grid-cols-2 gap-4 flex-row items-center">
            {/* Camera select dropdown */}
            <select
              aria-label={`Select camera for ${item.file.name}`}
              className="ml-2 border border-input bg-background text-foreground p-1 rounded mb-2 focus:ring-2 focus:ring-ring focus:border-input"
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
              className="ml-2 text-destructive hover:text-destructive/80 transition-colors"
            >
              <Trash2 />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ProjectFileList
