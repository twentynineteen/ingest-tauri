import React from 'react'

interface File {
  id: string
  name: string
}

interface Props {
  files: File[]
}

const FileList: React.FC<Props> = ({ files }) => (
  <>
    <p>
      <span className="font-medium text-foreground">Files:</span> {files.length} file(s)
    </p>
    <ul className="list-disc ml-5">
      {files.map(file => (
        <li key={file.name}>{file.name}</li>
      ))}
    </ul>
  </>
)

export default FileList
