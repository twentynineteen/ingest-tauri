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
    const remapped = files.map(file => ({
      ...file,
      camera: file.camera > numCameras ? 1 : file.camera
    }))

    setFiles(remapped)
  }, [numCameras])
}
