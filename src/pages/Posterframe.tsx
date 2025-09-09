import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { useAutoFileSelection } from 'hooks/useAutoFileSelection'
import { useBackgroundFolder } from 'hooks/useBackgroundFolder'
import { useBreadcrumb } from 'hooks/useBreadcrumb'
import { useFileSelection } from 'hooks/useFileSelection'
import { usePosterframeAutoRedraw } from 'hooks/usePosterframeAutoRedraw'
import { usePosterframeCanvas } from 'hooks/usePosterframeCanvas'
import { useZoomPan } from 'hooks/useZoomPan'
import React, { useRef, useState } from 'react'

const Posterframe = () => {
  const [videoTitle, setVideoTitle] = useState('')
  const [savePath, setSavePath] = useState<string | null>(null)

  const { files: backgroundFiles, currentFolder, loadFolder, defaultFolder } = useBackgroundFolder()
  const { selectedFilePath, selectedFileBlob, selectFile } = useFileSelection()
  const { canvasRef, draw } = usePosterframeCanvas()
  const { zoomLevel, pan, setZoomLevel, setPan } = useZoomPan('posterframe-canvas')

  useBreadcrumb([
    { label: 'Upload content', href: '/upload/posterframe' },
    { label: 'Posterframe' }
  ])

  // Auto-redraw canvas when image or title changes
  usePosterframeAutoRedraw({
    draw,
    imageUrl: selectedFileBlob,
    title: videoTitle
  })

  // Auto-select first file when background files load
  useAutoFileSelection({
    files: backgroundFiles,
    selectedFilePath,
    selectFile,
    criteria: { preferImage: true } // Prefer images for posterframe
  })

  const chooseSavePath = async () => {
    const folder = await open({ directory: true, multiple: false })
    if (typeof folder === 'string') {
      setSavePath(folder)
    }
  }

  const generateThumbnail = async () => {
    if (!canvasRef.current || !savePath || !videoTitle.trim()) return

    const canvas = canvasRef.current
    canvas.toBlob(async blob => {
      if (!blob) return

      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const fileName = `posterframe-${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
      const fullPath = `${savePath}/${fileName}`

      try {
        await writeFile(fullPath, uint8Array)
        alert(`Thumbnail saved at: ${fullPath}`)
        invoke('open_folder', { path: savePath })
      } catch (err) {
        console.error('Save failed:', err)
        alert('Error saving file.')
      }
    }, 'image/jpeg')
  }

  // Canvas zoom and drag logic
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startCoords = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const startDragging = (e: React.MouseEvent) => {
    if (zoomLevel === 1) return
    setIsDragging(true)
    startCoords.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const handleDragging = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - startCoords.current.x
    const newY = e.clientY - startCoords.current.y
    setPan({ x: newX, y: newY })
  }

  const stopDragging = () => {
    setIsDragging(false)
  }


  return (
    <div className="w-full pb-4 border-b mb-4">
      <h2 className="px-4 text-2xl font-semibold">Create a Posterframe</h2>
      <div className="px-4 mx-4">
        <div className="flex flex-col items-center space-y-4 mt-4">
          <div className="flex gap-4 items-center">
            <button
              onClick={() =>
                open({ directory: true }).then(
                  path => typeof path === 'string' && loadFolder(path)
                )
              }
              className="text-white bg-gray-700 hover:bg-gray-800 rounded-lg px-4 py-2 text-sm"
            >
              Select Background Folder
            </button>

            {backgroundFiles.length > 0 && (
              <select
                className="border px-2 py-1 rounded w-80"
                value={selectedFilePath || ''}
                onChange={e => {
                  const path = e.target.value
                  selectFile(path)
                }}
              >
                {backgroundFiles.map(file => (
                  <option key={file} value={file}>
                    {file.split('/').pop()}
                  </option>
                ))}
              </select>
            )}

            {defaultFolder && currentFolder !== defaultFolder && (
              <button
                className="text-blue-600 text-sm hover:underline"
                onClick={() => loadFolder(defaultFolder)}
              >
                Use Default Background
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <h3 className="font-medium mb-2 text-sm text-muted-foreground">
              Live Preview
            </h3>

            {selectedFileBlob ? (
              <div
                className="relative border rounded shadow-sm overflow-hidden"
                style={{
                  width: '384px',
                  height: '216px',
                  position: 'relative',
                  cursor: isDragging ? 'grabbing' : zoomLevel !== 1 ? 'grab' : 'default'
                }}
                onMouseDown={startDragging}
                onMouseMove={handleDragging}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                ref={containerRef}
              >
                <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                    transformOrigin: 'top left',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: '100%',
                      height: '100%'
                    }}
                    className="max-w-md w-full border rounded shadow-sm transition-transform"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Select a background to preview the thumbnail
              </p>
            )}
          </div>

          {/* Title Input */}
          <input
            type="text"
            placeholder="Enter Video Title"
            value={videoTitle}
            onChange={e => setVideoTitle(e.target.value)}
            className="border px-2 py-1 rounded w-80"
          />

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel(z => Math.max(0.25, z - 0.25))}
              className="px-2 py-1 text-sm border rounded"
            >
              Zoom Out
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 text-sm border rounded"
            >
              Reset Zoom
            </button>
            <button
              onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}
              className="px-2 py-1 text-sm border rounded"
            >
              Zoom In
            </button>
          </div>

          {/* Save Path + Generate */}
          <div className="flex items-center gap-4">
            <button
              onClick={chooseSavePath}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Choose Save Path
            </button>

            <button
              onClick={generateThumbnail}
              className="inline-flex items-center justify-center 
            p-0.5 me-2 overflow-hidden text-sm font-medium 
            text-gray-900 rounded-lg group bg-linear-to-br from-purple-500 
            to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 
            hover:text-white dark:text-white focus:ring-4 focus:outline-hidden 
            focus:ring-purple-200 dark:focus:ring-purple-800"
            >
              <span
                className="px-5 py-2.5 transition-all ease-in duration-75 
              bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent 
              dark:group-hover:bg-transparent"
              >
                Generate Thumbnail
              </span>
            </button>
          </div>

          {savePath && (
            <p className="text-sm text-gray-600 mt-2 text-center">Save to: {savePath}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Posterframe
