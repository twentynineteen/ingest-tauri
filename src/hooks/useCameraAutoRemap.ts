import { useEffect } from 'react'

export interface FootageFile {
  file: {
    path: string
    name: string
  }
  camera: number
}

export function useCameraAutoRemap(
  files: FootageFile[],
  numCameras: number,
  setFiles: (updated: FootageFile[]) => void
) {
  useEffect(() => {
    if (files.length === 0) return

    const hasInvalidCameras = files.some(file => file.camera > numCameras || file.camera < 1)
    
    if (!hasInvalidCameras) return

    const remapped = files.map(file => ({
      ...file,
      camera: (file.camera > numCameras || file.camera < 1) ? 1 : file.camera
    }))

    setFiles(remapped)
  }, [files, numCameras, setFiles])
}
