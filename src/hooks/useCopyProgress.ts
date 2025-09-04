import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'

export function useCopyProgress(
  setProgress: (val: number) => void,
  setCompleted: (val: boolean) => void
) {
  useEffect(() => {
    let unlistenProgress: (() => void) | null = null
    let unlistenComplete: (() => void) | null = null

    const setupListeners = async () => {
      unlistenProgress = await listen<number>('copy_progress', event => {
        setProgress(event.payload)
      })

      unlistenComplete = await listen<string[]>('copy_complete', () => {
        setCompleted(true)
      })
    }

    setupListeners()

    return () => {
      if (unlistenProgress) unlistenProgress()
      if (unlistenComplete) unlistenComplete()
    }
  }, [setProgress, setCompleted])
}
