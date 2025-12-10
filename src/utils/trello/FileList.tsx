import React from 'react'
import { FootageData } from '@utils/types'

interface Props {
  files: FootageData[]
}

const FileList: React.FC<Props> = ({ files }) => (
  <>
    <p>
      <span className="text-foreground font-medium">Files:</span> {files.length} file(s)
    </p>
    <ul className="ml-5 list-disc">
      {files.map((file) => (
        <li key={file.path}>
          {file.name} (Camera {file.camera})
        </li>
      ))}
    </ul>
  </>
)

export default FileList
