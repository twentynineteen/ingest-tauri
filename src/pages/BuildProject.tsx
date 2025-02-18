import { Button } from '@components/components/ui/button'
import FolderTree from '@components/FolderTree'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { confirm, open } from '@tauri-apps/plugin-dialog'
import { exists, mkdir, remove, writeFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { Trash2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

// import {
//   checkFullDiskAccessPermissions,
//   requestFullDiskAccessPermissions
// } from 'tauri-plugin-macos-permissions-api'

// The BuildProject component is used for uploading footage from camera cards
// additionally, the folder tree structure is generated as is the Premiere Pro project
// React dropzone is used to select and map video files from a folder.
// Footage can be marked with the relevant camera in order to place in the correct folder.
// const handlePermissions = async () => {
//   console.log('checking permissions')
//   const res = await checkFullDiskAccessPermissions()
//   console.log(res)
// }
// const handleSetPermissions = async () => {
//   console.log('checking permissions')
//   const res = await requestFullDiskAccessPermissions()
//   console.log(res)
// }

async function moveSelectedFile(srcPath: string, destFolder: string) {
  try {
    const result = await invoke('move_file', { src: srcPath, dest: destFolder })
    console.log('Success:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

const BuildProject: React.FC = () => {
  const [title, setTitle] = useState('')
  const [numCameras, setNumCameras] = useState(2)
  const [files, setFiles] = useState<{ file: File; camera: number }[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')

  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)

  // 🔹 Listen for Progress Updates
  useEffect(() => {
    const unlistenProgress = listen<number>('copy_progress', event => {
      console.log('Progress Update:', event.payload) // Debugging log
      setProgress(event.payload)
    })

    const unlistenComplete = listen<string[]>('copy_complete', event => {
      console.log('File Transfer Completed:', event.payload) // Debugging log
      setCompleted(true)
    })

    return () => {
      unlistenProgress.then(f => f())
      unlistenComplete.then(f => f())
    }
  }, [])

  // Function to let users select files (instead of drag & drop)
  async function selectFiles() {
    try {
      const selectedFiles = await open({
        multiple: true, // Allow multiple file selection
        filters: [
          {
            name: 'Videos',
            extensions: ['braw', 'mp4', 'mov']
          }
        ]
      })

      if (Array.isArray(selectedFiles)) {
        // Map the selected files into our expected structure
        const newFiles = selectedFiles.map(filePath => ({
          file: { path: filePath, name: filePath.split('/').pop() || 'unknown' }, // Ensure filename is extracted
          camera: 1
        }))

        setFiles(prevFiles => [...prevFiles, ...newFiles])
      } else if (selectedFiles) {
        setFiles(prevFiles => [
          ...prevFiles,
          {
            file: {
              path: selectedFiles,
              name: selectedFiles.split('/').pop() || 'unknown'
            },
            camera: 1
          }
        ])
      }
    } catch (error) {
      console.error('Error selecting files:', error)
    }
  }

  // Clears all the fields to their initial state
  const clearFields = () => {
    setTitle('')
    setNumCameras(2)
    setFiles([])
    setSelectedFolder('')
  }

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'video/*': ['.braw'] },
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
      if (!overwrite) return // Abort the operation if the user doesn't want to overwrite

      // Remove the existing folder before creating a new one
      await remove(projectFolder, { recursive: true })
    }

    try {
      // Create the main project folder
      await mkdir(projectFolder, { recursive: true })

      // Create subfolders for each camera
      for (let cam = 1; cam <= numCameras; cam++) {
        await mkdir(`${projectFolder}/Footage/Camera ${cam}`, { recursive: true })
      }
      // reset the counter
      setProgress(0)
      setCompleted(false)

      // Prepare files for Tauri Rust backend
      const filesToMove: [string, number][] = files.map(({ file, camera }) => [
        file.path,
        camera
      ])

      // write boilerplate folders for projects and graphics
      await mkdir(`${projectFolder}/Graphics`, { recursive: true })
      await mkdir(`${projectFolder}/Renders`, { recursive: true })
      await mkdir(`${projectFolder}/Projects`, { recursive: true })

      // 🔹 Listen for Progress Updates
      const unlistenProgress = await listen<number>('copy_progress', event => {
        console.log('Progress Update:', event.payload) // Debugging log
        setProgress(event.payload)
      })

      // 🔹 Listen for Completion Event
      const unlistenComplete = await listen<string[]>('copy_complete', event => {
        console.log('File Transfer Completed:', event.payload) // Debugging log
        setCompleted(true)

        alert('Project created successfully!')
        clearFields()

        unlistenProgress() // Stop listening when done
        unlistenComplete()
      })

      // Invoke Tauri Rust command to move files
      const result = await invoke('move_files', {
        files: filesToMove,
        baseDest: projectFolder
      })

      // Write metadata JSON file
      const createdBy = localStorage.getItem('username') || 'Unknown User'
      const now = new Date()
      const formattedDateTime = now.toLocaleString()

      const projectData = {
        projectTitle: title.trim(),
        numberOfCameras: numCameras,
        files: files.map(item => item.file.name),
        parentFolder: selectedFolder,
        createdBy,
        creationDateTime: formattedDateTime
      }

      await writeTextFile(
        `${projectFolder}/project_info.json`,
        JSON.stringify(projectData, null, 2)
      )

      console.log('Files copied successfully:', result)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Error creating project: ' + error)
    }
  }

  return (
    <div className="">
      {/* Project Configuration & File Explorer */}
      <div className="w-full pl-4 pb-4 border-b mb-4">
        <h2 className="text-2xl font-semibold">Build a Project</h2>
        <div className="gap-20 px-6">
          <div className="py-4">
            <label
              htmlFor="helper-text"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Project title
            </label>
            <input
              id="helper-text"
              aria-describedby="helper-text-explanation"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Enter title here"
            />
            <p
              id="helper-text-explanation"
              className="mt-2 text-sm text-gray-500 dark:text-gray-400"
            >
              e.g. DBA - IB1234 - J Doe - Introductions 060626
            </p>
          </div>
          <div className="pt-2">
            <label
              htmlFor="number-input"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Number of cameras:
            </label>
            <input
              type="number"
              id="number-input"
              aria-describedby="helper-text-explanation"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 font-semibold"
              placeholder="2"
              defaultValue={2}
              required
            />
            <p
              id="helper-text-explanation"
              className="mt-2 text-sm text-gray-500 dark:text-gray-400"
            >
              Default: 2
            </p>
          </div>
          <div className="folder-tree mx-auto mt-6 ">
            {/* Pass an onSelect callback so FolderTree can update the selectedFolder state */}
            <FolderTree onSelect={setSelectedFolder} selectedFolder={selectedFolder} />
          </div>
        </div>
        <div className="project-menu flex flex-row justify-between items-center mt-8 mx-6 rounded-lg">
          <div>
            <div>
              <button
                onClick={selectFiles}
                // className="bg-gray-600 text-white px-4 py-2 rounded-xl shadow-md"
                className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
              >
                Select Files
              </button>
            </div>
          </div>
          <button
            onClick={handleCreateProject}
            className="inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800"
          >
            <span className="px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
              Create Project
            </span>
          </button>
          <button
            onClick={clearFields}
            className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
          >
            Clear All
          </button>
        </div>
        <div className="pt-4 justify-center items-center text-center ">
          <ul className="mx-2 justify-center">
            {files.map((item, idx) => (
              <li
                key={idx}
                className="my-4 text-sm text-gray-700 flex justify-between items-center"
              >
                <span className="px-4 truncate w-[200px] text-start">
                  {item.file.name}
                </span>{' '}
                <span className="nowrap truncate italic w-[300px]">
                  ({item.file.path}){' '}
                </span>
                {/* Display full path */}
                <div className="flex justify-center px-4 grid-cols-2 gap-4 flex-row items-center">
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
                  <button>
                    <Trash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          {/* 🔹 Show progress bar */}
          {progress > 0 && !completed && (
            <div className="w-full bg-gray-200 rounded-lg overflow-hidden mt-4">
              <div
                className="bg-blue-600 text-xs leading-none py-1 text-center text-white"
                style={{ width: `${progress}%` }}
              >
                {progress.toFixed(1)}%
              </div>
            </div>
          )}

          {/* 🔹 Show Completion Message */}
          {completed && (
            <p className="text-green-600 text-center">File transfer completed!</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuildProject
