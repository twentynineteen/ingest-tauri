import FolderTree from '@components/FolderTree'
import { confirm } from '@tauri-apps/plugin-dialog'
import { exists, mkdir, remove, writeFile, writeTextFile } from '@tauri-apps/plugin-fs'
import React from 'react'
import { useDropzone } from 'react-dropzone'

// The BuildProject component is used for uploading footage from camera cards
// additionally, the folder tree structure is generated as is the Premiere Pro project
// React dropzone is used to select and map video files from a folder.
// Footage can be marked with the relevant camera in order to place in the correct folder.

const BuildProject: React.FC = () => {
  const [title, setTitle] = React.useState('')
  const [numCameras, setNumCameras] = React.useState(2)
  const [files, setFiles] = React.useState<{ file: File; camera: number }[]>([])
  const [selectedFolder, setSelectedFolder] = React.useState<string>('')

  // Clears all the fields to their initial state
  const clearFields = () => {
    setTitle('')
    setNumCameras(2)
    setFiles([])
    setSelectedFolder('')
  }

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'video/*': [] },
    onDrop: acceptedFiles => {
      const newFiles = acceptedFiles.map(file => ({ file, camera: 1 }))
      setFiles(prevFiles => [...prevFiles, ...newFiles])
    }
  })
  // Logic to handle files from the drag and drop window
  // Camera data is mapped to the corresponding file
  React.useEffect(() => {
    setFiles(prevFiles =>
      prevFiles.map(item => ({
        ...item,
        camera: item.camera > numCameras ? 1 : item.camera
      }))
    )
  }, [numCameras])

  // Logic to mark a given file with the camera number
  const updateFileCamera = (index: number, camera: number) => {
    const updatedFiles = files.map((item, idx) =>
      idx === index ? { ...item, camera } : item
    )
    setFiles(updatedFiles)
  }

  // Create the project folder structure and copy files into the corresponding subfolders.
  const handleCreateProject = async () => {
    if (!selectedFolder) {
      alert('Please select a destination folder.')
      return
    }
    if (!title.trim()) {
      alert('Please enter a project title.')
      return
    }

    // Check if no files have been added; prompt the user for confirmation.
    if (files.length === 0) {
      const confirmNoFiles = await confirm(
        'No files have been added to the drag and drop section. Are you sure you want to create the project?'
      )
      if (!confirmNoFiles) {
        return
      }
    }

    // Define the project folder path
    const projectFolder = `${selectedFolder}/${title.trim()}`

    // Check if the project folder already exists
    if (await exists(projectFolder)) {
      const overwrite = await confirm(
        `The folder "${projectFolder}" already exists. Do you want to overwrite it?`
      )
      if (!overwrite) {
        // Abort the operation if the user doesn't want to overwrite
        return
      } else {
        // Remove the existing folder recursively before creating a new one
        await remove(projectFolder, { recursive: true })
      }
    }

    try {
      // Create the main project folder (recursive ensures parent folders are created if needed)
      await mkdir(projectFolder, { recursive: true })

      // Create subfolders for each camera
      for (let cam = 1; cam <= numCameras; cam++) {
        await mkdir(`${projectFolder}/Footage/Camera ${cam}`, { recursive: true })
      }

      // Copy the dropped files into their respective camera folders
      for (const { file, camera } of files) {
        // Read file as an array buffer and convert it to a Uint8Array for writing.
        const arrayBuffer = await file.arrayBuffer()
        const data = new Uint8Array(arrayBuffer)
        const destination = `${projectFolder}/Footage/Camera ${camera}/${file.name}`
        await writeFile(destination, data)

        // write boilerplate folders for projects and graphics
        await mkdir(`${projectFolder}/Graphics`, { recursive: true })
        await mkdir(`${projectFolder}/Renders`, { recursive: true })
        await mkdir(`${projectFolder}/Projects`, { recursive: true })
      }

      // Retrieve the username from local storage
      const createdBy = localStorage.getItem('username') || 'Unknown User'

      // Format creationDateTime as 'dd-mm-yyyy hh:mm'
      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}`

      // Prepare project information to be saved as JSON
      const projectData = {
        projectTitle: title.trim(),
        numberOfCameras: numCameras,
        files: files.map(item => item.file.name),
        parentFolder: selectedFolder,
        createdBy,
        creationDateTime: formattedDateTime
      }

      // Convert the project data to a JSON string
      const projectDataJson = JSON.stringify(projectData, null, 2)

      // Define the path for the JSON file (e.g., "project_info.json" in the project folder)
      const jsonFilePath = `${projectFolder}/project_info.json`

      // Write the JSON file to the project folder
      await writeTextFile(jsonFilePath, projectDataJson)

      alert('Project created successfully!')
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Error creating project: ' + error)
    }
  }

  return (
    <div className="">
      {/* Project Configuration & File Explorer */}
      <div className="w-full pl-2 pb-4 border-b mb-4">
        <h2 className="text-2xl font-semibold">Build a Project</h2>
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
        <div className="project-menu flex flex-row justify-around pt-4 items-center mt-3">
          <div className="folder-tree">
            {/* Pass an onSelect callback so FolderTree can update the selectedFolder state */}
            <FolderTree onSelect={setSelectedFolder} />
          </div>
          <button
            onClick={handleCreateProject}
            className=" bg-gray-600 text-white px-4 py-2 rounded-xl shadow-xl"
          >
            Create Project
          </button>
          <button
            onClick={clearFields}
            className="bg-red-600 text-white px-4 py-2 rounded-xl shadow-xl"
          >
            Clear All
          </button>
        </div>
      </div>
      {/* Drag and Drop Section */}
      <div
        className="w-auto h-auto p-8 m-4 border-dashed border-2 border-gray-300 rounded-2xl"
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

export default BuildProject
