/**
 * useReducedMotion Hook
 *
 * Detects if the user has requested reduced motion via their system preferences.
 * Used to ensure animations respect accessibility requirements (WCAG 2.1 Level AAA).
 *
 * @returns {boolean} true if user prefers reduced motion
 *
 * @example
 * ```tsx
 * const shouldReduceMotion = useReducedMotion()
 *
 * <motion.div
 *   animate={shouldReduceMotion ? {} : { x: 100 }}
 *   transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
 * >
 *   {content}
 * </motion.div>
 * ```
 */

import { useEffect, useState } from 'react'

export const useReducedMotion = (): boolean => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(() => {
    // Initialize with media query result
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      return mediaQuery.matches
    }
    return false
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // Update state when preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setShouldReduceMotion(event.matches)
    }

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return shouldReduceMotion
}
