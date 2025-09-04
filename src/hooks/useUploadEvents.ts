import { listen } from '@tauri-apps/api/event'
import { useEffect, useRef, useState } from 'react'

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
  const listenersSetup = useRef(false)

  useEffect(() => {
    // Prevent double setup in StrictMode
    if (listenersSetup.current) return

    console.log('Setting up event listeners...')
    listenersSetup.current = true

    let unlistenProgress: (() => void) | null = null
    let unlistenComplete: (() => void) | null = null
    let unlistenError: (() => void) | null = null
    let isMounted = true

    const setupListeners = async () => {
      try {
        unlistenProgress = await listen('upload_progress', event => {
          if (isMounted) {
            setProgress(event.payload as number)
          }
        })

        unlistenComplete = await listen('upload_complete', event => {
          if (isMounted) {
            setMessage(event.payload as string)
            setUploading(false)
          }
        })

        unlistenError = await listen('upload_error', event => {
          if (isMounted) {
            setMessage(event.payload as string)
            setUploading(false)
          }
        })
      } catch (error) {
        console.error('Failed to setup event listeners:', error)
      }
    }

    setupListeners()

    return () => {
      isMounted = false
      listenersSetup.current = false
      
      // Use setTimeout to defer cleanup and avoid race conditions
      setTimeout(() => {
        try {
          if (unlistenProgress) unlistenProgress()
          if (unlistenComplete) unlistenComplete()
          if (unlistenError) unlistenError()
        } catch (error) {
          // Silently handle cleanup errors to avoid console spam
          console.debug('Event listener cleanup completed with minor issues:', error)
        }
      }, 0)
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