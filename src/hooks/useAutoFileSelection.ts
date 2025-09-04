import { useEffect } from 'react'

interface AutoFileSelectionProps {
  files: string[]
  selectedFilePath: string | null
  selectFile: (filePath: string) => void
}

export function useAutoFileSelection({ 
  files, 
  selectedFilePath, 
  selectFile 
}: AutoFileSelectionProps) {
  useEffect(() => {
    if (files.length > 0 && !selectedFilePath) {
      selectFile(files[0])
    }
  }, [files, selectedFilePath, selectFile])
}