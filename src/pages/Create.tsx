import { open } from '@tauri-apps/plugin-dialog'
import React from 'react'
import { useDropzone } from 'react-dropzone'

function FolderTree() {
  const [folderPath, setFolderPath] = React.useState<string>('')

  const openFolderPicker = async () => {
    try {
      const result = await open({
        directory: true // This specifies that the picker should be for selecting directories.
      })
      if (result) {
        setFolderPath(result as string) // Ensure that `result` is a string path.
      }
    } catch (error) {
      console.error('Error selecting folder:', error)
    }
  }

  return (
    <div>
      <button onClick={openFolderPicker}>Select Folder</button>
      {folderPath && <p className="text-sm text-gray-700 mt-2">Selected: {folderPath}</p>}
    </div>
  )
}

const Create: React.FC = () => {
  const [title, setTitle] = React.useState('')
  const [numCameras, setNumCameras] = React.useState(2)
  const [files, setFiles] = React.useState<{ file: File; camera: number }[]>([])

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'video/*': [] },
    onDrop: acceptedFiles => {
      const newFiles = acceptedFiles.map(file => ({ file, camera: 1 }))
      setFiles(prevFiles => [...prevFiles, ...newFiles])
    }
  })

  React.useEffect(() => {
    setFiles(prevFiles =>
      prevFiles.map(item => ({
        ...item,
        camera: item.camera > numCameras ? 1 : item.camera
      }))
    )
  }, [numCameras])

  const updateFileCamera = (index: number, camera: number) => {
    const updatedFiles = files.map((item, idx) =>
      idx === index ? { ...item, camera } : item
    )
    setFiles(updatedFiles)
  }

  return (
    <div className="">
      {/* Project Configuration & File Explorer */}
      <div className="w-full pl-2 pb-4 border-b mb-4">
        <h2 className="text-2xl font-semibold">Project Settings</h2>
        <div className="title flex flex-row gap-4 pt-3 justify-start">
          <p className="w-[200px]">Project title:</p>
          <input
            placeholder="enter title here"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-1/2 h-fit border rounded pl-3 shadow-xl"
          />
        </div>
        <div className="cameras flex flex-row gap-4 pt-3 justify-start">
          <p className="w-[200px]">Number of cameras: </p>
          <input
            type="number"
            min={1}
            value={numCameras}
            onChange={e => setNumCameras(Number(e.target.value))}
            className="w-1/2 border rounded pl-3 shadow-xl"
          />
        </div>
        <div className="project-menu flex flex-row justify-around pt-4 align-middle">
          <div className="folder-tree">
            <FolderTree />
          </div>
          <button className="mt-3 bg-gray-600 text-white px-4 py-2 rounded-xl shadow-xl">
            Create Project
          </button>
        </div>
      </div>
      {/* Drag and Drop Section */}
      <div
        className="w-1/2 h-1/3 p-4 border-dashed border-2 border-gray-300 rounded-2xl"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <p className="text-center text-gray-600">Drag & drop footage here</p>
        <ul>
          {files.map((item, idx) => (
            <li
              key={idx}
              className="text-sm text-gray-700 flex justify-between items-center"
            >
              {item.file.name}
              <select
                className="ml-2 border p-1 rounded mb-2"
                value={item.camera}
                onChange={e => updateFileCamera(idx, Number(e.target.value))}
              >
                {Array.from({ length: numCameras }, (_, i) => i + 1).map(cam => (
                  <option key={cam} value={cam}>
                    Camera {cam}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Create
