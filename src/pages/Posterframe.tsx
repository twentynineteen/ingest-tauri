import { useAutoFileSelection } from '@hooks/useAutoFileSelection'
import { useBackgroundFolder } from '@hooks/useBackgroundFolder'
import { useBreadcrumb } from '@hooks/useBreadcrumb'
import { useFileSelection } from '@hooks/useFileSelection'
import { usePosterframeAutoRedraw } from '@hooks/usePosterframeAutoRedraw'
import { usePosterframeCanvas } from '@hooks/usePosterframeCanvas'
import { useZoomPan } from '@hooks/useZoomPan'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import React, { useRef, useState } from 'react'

import { logger } from '@/utils/logger'

const Posterframe = () => {
  const [videoTitle, setVideoTitle] = useState('')
  const [savePath, setSavePath] = useState<string | null>(null)

  const {
    files: backgroundFiles,
    currentFolder,
    loadFolder,
    defaultFolder
  } = useBackgroundFolder()
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
    canvas.toBlob(async (blob) => {
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
        logger.error('Save failed:', err)
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
    <div className="mb-4 w-full border-b pb-4">
      <h2 className="px-4 text-2xl font-semibold">Create a Posterframe</h2>
      <div className="mx-4 px-4">
        <div className="mt-4 flex flex-col items-center space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                open({ directory: true }).then(
                  (path) => typeof path === 'string' && loadFolder(path)
                )
              }
              className="text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-sm"
            >
              Select Background Folder
            </button>

            {backgroundFiles.length > 0 && (
              <select
                className="w-80 rounded border px-2 py-1"
                value={selectedFilePath || ''}
                onChange={(e) => {
                  const path = e.target.value
                  selectFile(path)
                }}
              >
                {backgroundFiles.map((file) => (
                  <option key={file} value={file}>
                    {file.split('/').pop()}
                  </option>
                ))}
              </select>
            )}

            {defaultFolder && currentFolder !== defaultFolder && (
              <button
                className="text-info text-sm hover:underline"
                onClick={() => loadFolder(defaultFolder)}
              >
                Use Default Background
              </button>
            )}
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-muted-foreground mb-2 text-sm font-medium">
              Live Preview
            </h3>

            {selectedFileBlob ? (
              <div
                className="relative overflow-hidden rounded border shadow-sm"
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
                    className="w-full max-w-md rounded border shadow-sm transition-transform"
                  />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Select a background to preview the thumbnail
              </p>
            )}
          </div>

          {/* Title Input */}
          <input
            type="text"
            placeholder="Enter Video Title"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            className="w-80 rounded border px-2 py-1"
          />

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.25))}
              className="rounded border px-2 py-1 text-sm"
            >
              Zoom Out
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="rounded border px-2 py-1 text-sm"
            >
              Reset Zoom
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              className="rounded border px-2 py-1 text-sm"
            >
              Zoom In
            </button>
          </div>

          {/* Save Path + Generate */}
          <div className="flex items-center gap-4">
            <button
              onClick={chooseSavePath}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-4 py-2"
            >
              Choose Save Path
            </button>

            <button
              onClick={generateThumbnail}
              className="text-foreground group me-2 inline-flex items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-purple-500 to-pink-500 p-0.5 text-sm font-medium group-hover:from-purple-500 group-hover:to-pink-500 hover:text-white focus:ring-4 focus:ring-purple-200 focus:outline-hidden"
            >
              <span className="bg-card rounded-md px-5 py-2.5 transition-all duration-75 ease-in group-hover:bg-transparent">
                Generate Thumbnail
              </span>
            </button>
          </div>

          {savePath && (
            <p className="text-muted-foreground mt-2 text-center text-sm">
              Save to: {savePath}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Posterframe
