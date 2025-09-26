import React from 'react'
import { FootageData } from 'utils/types'

interface Props {
  files: FootageData[]
}

const FileList: React.FC<Props> = ({ files }) => (
  <>
    <p>
      <span className="font-medium text-foreground">Files:</span> {files.length} file(s)
    </p>
    <ul className="list-disc ml-5">
      {files.map(file => (
        <li key={file.path}>
          {file.name} (Camera {file.camera})
        </li>
      ))}
    </ul>
  </>
)

export default FileList
