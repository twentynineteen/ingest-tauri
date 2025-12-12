import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface WindowState {
  x: number
  y: number
  width: number
  height: number
}

const STORAGE_KEY = 'bucket-window-state'

/**
 * Hook to persist window position and size across sessions
 *
 * @example
 * ```tsx
 * function App() {
 *   useWindowState()  // Automatically saves and restores window state
 *   return <div>...</div>
 * }
 * ```
 */
export function useWindowState() {
  useEffect(() => {
    const window = getCurrentWindow()

    // Restore saved position/size
    const restoreWindowState = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) return

        const state: WindowState = JSON.parse(saved)
        await window.setPosition({ x: state.x, y: state.y })
        await window.setSize({ width: state.width, height: state.height })
      } catch {
        // Silently fail if window state can't be restored
      }
    }

    restoreWindowState()

    // Save position/size on changes
    const saveWindowState = async () => {
      try {
        const position = await window.outerPosition()
        const size = await window.outerSize()

        const state: WindowState = {
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Silently fail if window state can't be saved
      }
    }

    // Listen for changes
    const setupListeners = async () => {
      const unlistenResize = await window.onResized(() => saveWindowState())
      const unlistenMove = await window.onMoved(() => saveWindowState())

      return () => {
        unlistenResize()
        unlistenMove()
      }
    }

    let cleanup: (() => void) | null = null

    setupListeners().then((fn) => {
      cleanup = fn
    })

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [])
}
