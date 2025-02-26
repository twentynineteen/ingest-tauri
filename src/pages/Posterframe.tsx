import { invoke } from '@tauri-apps/api/core'
import { appDataDir } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import { create, exists, readDir, readFile, writeFile } from '@tauri-apps/plugin-fs'
import React, { useEffect, useRef, useState } from 'react'

const Posterframe = () => {
  // State variables
  const [backgroundFolder, setBackgroundFolder] = useState<string | null>(null)
  const [backgroundFiles, setBackgroundFiles] = useState<string[]>([])
  const [videoTitle, setVideoTitle] = useState('')
  const [savePath, setSavePath] = useState<string | null>(null) // User-selected save path
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null) // Original path
  const [selectedFileBlob, setSelectedFileBlob] = useState<string | null>(null) // Blob URL

  useEffect(() => {
    console.log('Selected File Path:', selectedFilePath)
    console.log('Blob URL:', selectedFileBlob)
    console.log('Save Path:', savePath)
  }, [selectedFilePath, selectedFileBlob, savePath])

  const loadCustomFont = async () => {
    try {
      const fontPath = './assets/Cabrito.otf' // Adjust path if needed
      const fontData = await readFile(fontPath) // Read font as binary
      const fontBlob = new Blob([new Uint8Array(fontData)], { type: 'font/otf' }) // Create blob
      const fontUrl = URL.createObjectURL(fontBlob) // Convert to URL

      const font = new FontFace('Cabrito', `url(${fontUrl})`)
      await font.load() // Load font
      document.fonts.add(font) // Add to document
      console.log('Font successfully loaded!')
    } catch (error) {
      console.error('Error loading font:', error)
    }
  }

  const handleFileSelection = async (filePath: string) => {
    try {
      const fileData = await readFile(filePath)
      const blob = new Blob([new Uint8Array(fileData)], { type: 'image/jpeg' })
      const blobUrl = URL.createObjectURL(blob)

      setSelectedFilePath(filePath) // Store the original file path for dropdown
      setSelectedFileBlob(blobUrl) // Store the blob URL for image preview
    } catch (error) {
      console.error('Error reading image file:', error)
    }
  }

  // Function to open file dialog and select background image
  const selectBackground = async () => {
    const selectedFolder = await open({
      directory: true,
      multiple: false
    })

    if (typeof selectedFolder === 'string') {
      setBackgroundFolder(selectedFolder)

      // Read folder contents
      const files = await readDir(selectedFolder)
      const jpgFiles = files
        .filter(file => file.name?.endsWith('.jpg'))
        .map(file => `${selectedFolder}/${file.name}`)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())) // Sort A-Z

      setBackgroundFiles(jpgFiles)
      // Auto-select first file
      if (jpgFiles.length > 0) {
        handleFileSelection(jpgFiles[0])
      }
    }
  }

  const chooseSavePath = async () => {
    const selectedFolder = await open({
      directory: true,
      multiple: false
    })

    if (typeof selectedFolder === 'string') {
      setSavePath(selectedFolder)
    }
  }

  // Function to generate the thumbnail with text
  const generateThumbnail = async () => {
    if (!selectedFilePath || !videoTitle.trim()) {
      alert('Please select a background image and enter a title.')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = selectedFileBlob
    img.onload = async () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width
      canvas.height = img.height

      // Draw the background image
      ctx.drawImage(img, 0, 0, img.width, img.height)

      // Load the custom font from Tauri's assets folder
      // const fontPath = (await appDir()) + 'assets/Cabrito.ttf'
      await loadCustomFont()
      // const fontPath = './assets/Cabrito.otf'
      // const font = new FontFace('Cabrito', `url(${fontPath})`)

      // await font.load()
      // document.fonts.add(font)
      ctx.font = '37px Cabrito'

      // Set text styling
      ctx.fillStyle = 'white'
      ctx.textAlign = 'left'

      // Define text position
      const textX = 292
      const textY = 467

      // Wrap text (if needed)
      const maxWidth = 365
      const lineHeight = 45
      const words = videoTitle.split(' ')
      let line = ''
      let y = textY

      for (let word of words) {
        const testLine = line + word + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line.length > 0) {
          ctx.fillText(line, textX, y)
          line = word + ' '
          y += lineHeight
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, textX, y)

      // Generate the file name
      const fileName = `posterframe-${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
      const saveFilePath = `${savePath}/${fileName}`

      // Convert canvas to JPEG and save
      canvas.toBlob(async blob => {
        if (!blob) return

        const arrayBuffer = await blob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        try {
          await writeFile(saveFilePath, uint8Array)
          alert(`Thumbnail saved at: ${saveFilePath}`)

          // Open the renders folder
          invoke('open_folder', { path: savePath })
        } catch (error) {
          console.error('Error saving file:', error)
          alert(`Failed to save file: ${error.message}`)
        }
      }, 'image/jpeg')
    }
  }

  return (
    <div className="w-full pb-4 border-b mb-4">
      <h2 className="px-4 text-2xl font-semibold">Create a Posterframe</h2>
      <div className="px-4 mx-4">
        <div className="flex flex-col items-center space-y-4 mt-4">
          <div className="flex gap-4 mx-auto items-center">
            {/* Select Background Button */}
            <button
              onClick={selectBackground}
              className="text-white bg-gray-700 hover:bg-gray-800 
                focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium 
                rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center 
                me-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            >
              Select Background Folder
            </button>

            {/* Dropdown to select a file */}
            {backgroundFiles.length > 0 && (
              <select
                className="border px-2 py-1 rounded w-80"
                onChange={e => handleFileSelection(e.target.value)}
                value={selectedFilePath || ''}
              >
                {backgroundFiles.map(file => (
                  <option key={file} value={file}>
                    {file.split('/').pop()}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Display selected background */}
          {selectedFileBlob && (
            <img
              src={selectedFileBlob}
              alt="Selected Background"
              className="max-w-md mt-4"
            />
          )}

          {/* Title Input */}
          <input
            type="text"
            placeholder="Enter Video Title"
            value={videoTitle}
            onChange={e => setVideoTitle(e.target.value)}
            className="border px-2 py-1 rounded w-80"
          />
          <div className="flex gap-4 mx-auto items-center">
            <div className="">
              {/* Choose Save Path Button */}
              <button
                onClick={chooseSavePath}
                className="text-white bg-gray-700 hover:bg-gray-800 
                focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium 
                rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center 
                me-2 dark:bg-gray-600 dark:hover:bg-gray-700 
                dark:focus:ring-gray-800 p-0.5 justify-center"
              >
                Choose Save Path
              </button>
            </div>
            <div>
              {/* Generate Thumbnail Button */}
              <button
                onClick={generateThumbnail}
                className="inline-flex items-center justify-center 
            p-0.5 me-2 overflow-hidden text-sm font-medium 
            text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 
            to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 
            hover:text-white dark:text-white focus:ring-4 focus:outline-none 
            focus:ring-purple-200 dark:focus:ring-purple-800"
              >
                <span
                  className="px-5 py-2.5 transition-all ease-in duration-75 
              bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent 
              group-hover:dark:bg-transparent"
                >
                  Generate Thumbnail
                </span>
              </button>
            </div>
          </div>
          {/* Show selected save path */}
          {savePath && (
            <p className="text-sm text-gray-600 mt-4 text-center">Save to: {savePath}</p>
          )}

          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      </div>
    </div>
  )
}

export default Posterframe
