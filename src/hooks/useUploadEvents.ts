import { listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'

interface UseUploadEventsReturn {
  progress: number
  uploading: boolean
  message: string | null
  setUploading: (uploading: boolean) => void
  setProgress: (progress: number) => void
  setMessage: (message: string | null) => void
}

export const useUploadEvents = (): UseUploadEventsReturn => {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    console.log('Setting up event listeners...')

    const unlistenProgress = listen('upload_progress', event => {
      setProgress(event.payload as number)
    })

    const unlistenComplete = listen('upload_complete', event => {
      setMessage(event.payload as string)
      setUploading(false)
    })

    const unlistenError = listen('upload_error', event => {
      setMessage(event.payload as string)
      setUploading(false)
    })

    return () => {
      unlistenProgress.then(unsub => unsub())
      unlistenComplete.then(unsub => unsub())
      unlistenError.then(unsub => unsub())
    }
  }, [])

  return {
    progress,
    uploading,
    message,
    setUploading,
    setProgress,
    setMessage
  }
}