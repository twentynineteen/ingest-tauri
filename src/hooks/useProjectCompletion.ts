import { useEffect, useRef, useState } from 'react'

interface UseProjectCompletionOptions {
  completed: boolean
  loading: boolean
  delayMs?: number
}

/**
 * Manages the project completion state with animation delay
 * Follows React Query patterns by deriving state from external sources
 */
export function useProjectCompletion({
  completed,
  loading,
  delayMs = 100
}: UseProjectCompletionOptions) {
  const [showSuccess, setShowSuccess] = useState(false)
  const previousCompletedRef = useRef(completed)

  useEffect(() => {
    // Track state transitions
    const wasCompleted = previousCompletedRef.current
    const justCompleted = completed && !wasCompleted && !loading
    const justReset = !completed && wasCompleted

    // Update ref for next render
    previousCompletedRef.current = completed

    if (justCompleted) {
      // Delay showing success to allow collapse animation to be visible
      const timer = setTimeout(() => {
        setShowSuccess(true)
      }, delayMs)
      return () => clearTimeout(timer)
    }

    if (justReset) {
      // Immediately hide success when resetting
      setShowSuccess(false)
    }
  }, [completed, loading, delayMs])

  const reset = () => {
    setShowSuccess(false)
    previousCompletedRef.current = false
  }

  return { showSuccess, reset }
}
