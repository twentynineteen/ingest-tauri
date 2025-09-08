import { listen } from '@tauri-apps/api/event'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { queryKeys } from '../lib/query-keys'
import { createQueryOptions, ProgressState } from '../lib/query-utils'

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
  const queryClient = useQueryClient()
  const queryKey = queryKeys.files.progress(operationId)
  const listenersSetup = useRef(false)

  const { data } = useQuery(
    createQueryOptions(
      queryKey,
      async (): Promise<CopyProgressState> => {
        return {
          total: 100,
          completed: 0,
          percentage: 0,
          status: 'idle',
        }
      },
      'REALTIME',
      {
        staleTime: 0, // Always fresh for real-time updates
        gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
        refetchInterval: false, // No polling, event-driven
        refetchOnWindowFocus: false,
      }
    )
  )

  const currentState = data || { 
    total: 100, 
    completed: 0, 
    percentage: 0, 
    status: 'idle' as const 
  }

  useEffect(() => {
    if (listenersSetup.current) return
    listenersSetup.current = true

    let unlistenProgress: (() => void) | null = null
    let unlistenComplete: (() => void) | null = null
    let isMounted = true

    const setupListeners = async () => {
      try {
        unlistenProgress = await listen<number>('copy_progress', event => {
          if (!isMounted) return

          const progressValue = event.payload
          const newState: CopyProgressState = {
            total: 100,
            completed: progressValue,
            percentage: progressValue,
            status: progressValue >= 100 ? 'completed' : 'copying',
          }

          queryClient.setQueryData(queryKey, newState)
          
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

          const completedState: CopyProgressState = {
            total: 100,
            completed: 100,
            percentage: 100,
            status: 'completed',
          }

          queryClient.setQueryData(queryKey, completedState)
          
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
          error: error instanceof Error ? error.message : 'Unknown error',
        }
        
        queryClient.setQueryData(queryKey, errorState)
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
  }, [queryClient, queryKey, onProgress, onComplete])

  return {
    progress: currentState.percentage,
    completed: currentState.status === 'completed',
    status: currentState.status,
    error: currentState.error,
    isActive: currentState.status === 'copying',
  }
}

// Legacy function for backward compatibility
export function useCopyProgressLegacy(
  setProgress: (val: number) => void,
  setCompleted: (val: boolean) => void
) {
  return useCopyProgress({
    operationId: 'default',
    onProgress: setProgress,
    onComplete: setCompleted,
  })
}
