import { listen } from '@tauri-apps/api/event'
import { useEffect, useRef, useState } from 'react'
import { createNamespacedLogger } from '../utils/logger'

const log = createNamespacedLogger('CopyProgress')

interface ProgressState {
  total: number
  completed: number
  percentage: number
}

interface CopyProgressState extends ProgressState {
  status: 'idle' | 'copying' | 'completed' | 'error'
  error?: string
}

interface UseCopyProgressOptions {
  operationId: string
  onProgress?: (progress: number) => void
  onComplete?: (completed: boolean) => void
}

interface UseCopyProgressReturn {
  progress: number
  completed: boolean
  status: CopyProgressState['status']
  error?: string
  isActive: boolean
}

export function useCopyProgress({
  operationId,
  onProgress,
  onComplete
}: UseCopyProgressOptions): UseCopyProgressReturn {
  log.debug('useCopyProgress hook called with operationId:', operationId)

  const listenersSetup = useRef(false)
  const [currentState, setCurrentState] = useState<CopyProgressState>({
    total: 100,
    completed: 0,
    percentage: 0,
    status: 'idle'
  })

  log.trace('useCopyProgress initial state:', currentState)

  useEffect(() => {
    log.trace(
      'useCopyProgress useEffect running, listenersSetup.current:',
      listenersSetup.current
    )

    if (listenersSetup.current) return
    listenersSetup.current = true

    let unlistenProgress: (() => void) | null = null
    let unlistenComplete: (() => void) | null = null
    let isMounted = true

    const setupListeners = async () => {
      log.debug('Setting up copy progress listeners...')
      try {
        unlistenProgress = await listen<number>('copy_progress', event => {
          if (!isMounted) return

          const progressValue = event.payload
          log.debug('Received copy_progress event:', progressValue)

          const newState: CopyProgressState = {
            total: 100,
            completed: progressValue,
            percentage: progressValue,
            status: progressValue >= 100 ? 'completed' : 'copying'
          }

          setCurrentState(newState)
          log.trace('Updated state:', newState)

          // Call legacy callbacks for backward compatibility
          if (onProgress) {
            onProgress(progressValue)
          }

          if (progressValue >= 100 && onComplete) {
            onComplete(true)
          }
        })

        unlistenComplete = await listen<string[]>('copy_complete', () => {
          if (!isMounted) return

          log.debug('Received copy_complete event')

          const completedState: CopyProgressState = {
            total: 100,
            completed: 100,
            percentage: 100,
            status: 'completed'
          }

          setCurrentState(completedState)

          if (onComplete) {
            onComplete(true)
          }
        })
      } catch (error) {
        console.error('Failed to setup copy progress listeners:', error)

        const errorState: CopyProgressState = {
          total: 100,
          completed: 0,
          percentage: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }

        setCurrentState(errorState)
      }
    }

    setupListeners()

    return () => {
      isMounted = false
      listenersSetup.current = false

      setTimeout(() => {
        try {
          if (unlistenProgress) unlistenProgress()
          if (unlistenComplete) unlistenComplete()
        } catch (error) {
          console.debug('Copy progress listener cleanup encountered errors:', error)
        }
      }, 0)
    }
  }, [onProgress, onComplete])

  const returnValue = {
    progress: currentState.percentage,
    completed: currentState.status === 'completed',
    status: currentState.status,
    error: currentState.error,
    isActive: currentState.status === 'copying'
  }

  // Only log when there's actual progress or state change to avoid spam
  if (currentState.status !== 'idle' || currentState.percentage > 0) {
    log.trace('useCopyProgress returning:', returnValue)
  }

  return returnValue
}

// Legacy function for backward compatibility
export function useCopyProgressLegacy(
  setProgress: (val: number) => void,
  setCompleted: (val: boolean) => void
) {
  return useCopyProgress({
    operationId: 'default',
    onProgress: setProgress,
    onComplete: setCompleted
  })
}
