import { useQuery } from '@tanstack/react-query'
import { readFile } from '@tauri-apps/plugin-fs'
import { useCallback, useState } from 'react'

interface FileSelectionData {
  selectedFilePath: string | null
  selectedFileBlob: string | null
  isLoading: boolean
  selectFile: (filePath: string) => void
  clearSelection: () => void
}

export function useFileSelection(): FileSelectionData {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)

  const {
    data: selectedFileBlob,
    isLoading
  } = useQuery({
    queryKey: ['fileBlob', selectedFilePath],
    queryFn: async () => {
      if (!selectedFilePath) return null
      
      const file = await readFile(selectedFilePath)
      const blob = new Blob([new Uint8Array(file)], { type: 'image/jpeg' })
      return URL.createObjectURL(blob)
    },
    enabled: !!selectedFilePath
  })

  const selectFile = useCallback((filePath: string) => {
    setSelectedFilePath(filePath)
  }, [])

  const clearSelection = useCallback(() => {
    if (selectedFileBlob) {
      URL.revokeObjectURL(selectedFileBlob)
    }
    setSelectedFilePath(null)
  }, [selectedFileBlob])

  return {
    selectedFilePath,
    selectedFileBlob: selectedFileBlob || null,
    isLoading,
    selectFile,
    clearSelection
  }
}