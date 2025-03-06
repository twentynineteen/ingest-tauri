import { invoke } from '@tauri-apps/api/core'
import { appDataDir, fontDir } from '@tauri-apps/api/path'
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
  const [selectedFontPath, setSelectedFontPath] = useState<string | null>(null) // Blob URL

  useEffect(() => {
    console.log('Selected File Path:', selectedFilePath)
    loadCustomFont()
    console.log('Selected Font Path:', selectedFontPath)
    console.log('Blob URL:', selectedFileBlob)
    console.log('Save Path:', savePath)
  }, [selectedFilePath, selectedFileBlob, savePath, selectedFontPath])

  const loadCustomFont = async () => {
    try {
      const fontPath = await fontDir() // Adjust path if needed
      const isFound = await exists(`${fontPath}/Cabrito.otf`)
      console.log(isFound)
      setSelectedFontPath(fontPath) // send to console log
      const fontData = await readFile(`${fontPath}/Cabrito.otf`) // Read font as binary
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
      // const maxWidth = 1280 // Limit width to 1280px
      // const scaleFactor = Math.min(1, 1280 / img.width) // Prevent upscaling // Increase this for sharper text
      const scaleFactor = 1 // Increase this for sharper text
      // Set canvas dimensions to match the image
      canvas.width = Math.floor(img.width * scaleFactor)
      canvas.height = Math.floor(img.height * scaleFactor)
      // Normalize coordinate system to use CSS pixels.
      ctx.scale(scaleFactor, scaleFactor)
      // Draw the background image
      ctx.drawImage(img, 0, 0, Math.floor(img.width), Math.floor(img.height))

      // Load the custom font from OS fonts folder
      await loadCustomFont()

      ctx.font = 'normal 37px Cabrito'

      // Set text styling
      ctx.fillStyle = 'white'
      ctx.textAlign = 'left'

      // Define text position
      const textX = 292
      const textY = 499 // 467

      // Use Subpixel Anti-Aliasing for Text
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Wrap text (if needed)
      const maxWidth = 365
      const lineHeight = 45
      const words = videoTitle.split(/\s+/) // Handle multiple spaces correctly
      let line = '',
        y = textY

      words.forEach((word, index) => {
        let testLine = line + word + ' '
        if (ctx.measureText(testLine).width > maxWidth && index > 0) {
          ctx.fillText(line.trim(), textX, y)
          line = word + ' '
          y += lineHeight
        } else {
          line = testLine
        }
      })
      ctx.fillText(line.trim(), textX, y)

      // Generate the file name
      const fileName = `posterframe-${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
      const saveFilePath = `${savePath}/${fileName}`

      // Convert canvas to JPEG and save
      const compressAndSaveImage = async (blob: Blob | null, quality = 0.95) => {
        if (!blob || !(blob instanceof Blob)) return // Check for null and correct type

        let arrayBuffer = await blob.arrayBuffer()
        let uint8Array = new Uint8Array(arrayBuffer)

        // console.log('length: ' + uint8Array.length)
        // console.log('quality: ' + quality)

        // Check if the file size is above 500KB, and reduce quality if needed
        while (uint8Array.length > 500 * 1024 && quality > 0.6) {
          const compressedBlob = await new Promise<Blob | null>(resolve =>
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality)
          )
          if (!compressedBlob) break // Prevents trying to access arrayBuffer() on null
          arrayBuffer = await compressedBlob.arrayBuffer()
          uint8Array = new Uint8Array(arrayBuffer)
          quality -= 0.05 // Reduce quality incrementally
        }

        try {
          await writeFile(saveFilePath, uint8Array)
          alert(
            `Thumbnail saved at: ${saveFilePath} (${(uint8Array.length / 1024).toFixed(1)} KB)`
          )
          invoke('open_folder', { path: savePath })
        } catch (error) {
          console.error('Error saving file:', error)
          alert(`Failed to save file: ${error.message}`)
        }
      }

      canvas.toBlob(blob => compressAndSaveImage(blob, 0.5), 'image/jpeg', 0.65)
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
