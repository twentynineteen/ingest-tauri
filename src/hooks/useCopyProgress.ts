import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'

export function useCopyProgress(
  setProgress: (val: number) => void,
  setCompleted: (val: boolean) => void
) {
  useEffect(() => {
    const unlistenProgress = listen<number>('copy_progress', event => {
      setProgress(event.payload)
    })

    const unlistenComplete = listen<string[]>('copy_complete', event => {
      setCompleted(true)
    })

    return () => {
      unlistenProgress.then(fn => fn())
      unlistenComplete.then(fn => fn())
    }
  }, [setProgress, setCompleted])
}
