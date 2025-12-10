/**
 * useBakerScan Hook
 *
 * Custom React hook for managing Baker folder scanning operations.
 * Handles scan initiation, progress tracking, and cancellation.
 */

import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type {
  ScanCompleteEvent,
  ScanErrorEvent,
  ScanOptions,
  ScanProgressEvent,
  ScanResult,
  UseBakerScanResult
} from '@/types/baker'

export function useBakerScan(): UseBakerScanResult {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentScanId, setCurrentScanId] = useState<string | null>(null)
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null)

  // Set up event listeners for scan progress and completion
  useEffect(() => {
    const unlistenPromises: Promise<() => void>[] = []

    // Progress event listener
    unlistenPromises.push(
      listen<ScanProgressEvent>('baker_scan_progress', (event) => {
        const progressData = event.payload
        if (currentScanId && progressData.scanId === currentScanId) {
          setScanResult((prev) =>
            prev
              ? {
                  ...prev,
                  totalFolders: progressData.totalFolders,
                  validProjects: progressData.projectsFound
                }
              : null
          )
        }
      })
    )

    // Completion event listener
    unlistenPromises.push(
      listen<ScanCompleteEvent>('baker_scan_complete', (event) => {
        const completeData = event.payload
        if (currentScanId && completeData.scanId === currentScanId) {
          setScanResult(completeData.result)
          setIsScanning(false)
          setCurrentScanId(null)
        }
      })
    )

    // Error event listener
    unlistenPromises.push(
      listen<ScanErrorEvent>('baker_scan_error', (event) => {
        const errorData = event.payload
        if (currentScanId && errorData.scanId === currentScanId) {
          setError(errorData.error.message)
          setIsScanning(false)
          setCurrentScanId(null)
        }
      })
    )

    // Clean up listeners on unmount or when currentScanId changes
    return () => {
      Promise.all(unlistenPromises)
        .then((unlisteners) => {
          unlisteners.forEach((unlisten) => {
            if (unlisten && typeof unlisten === 'function') {
              unlisten()
            }
          })
        })
        .catch(() => {
          // Ignore cleanup errors in test environments
        })
    }
  }, [currentScanId])

  const startScan = useCallback(
    async (rootPath: string, options: ScanOptions) => {
      if (isScanning) {
        return // Prevent multiple simultaneous scans
      }

      try {
        setError(null)
        setIsScanning(true)
        setScanResult(null)

        const scanId = await invoke<string>('baker_start_scan', {
          rootPath,
          options
        })

        setCurrentScanId(scanId)

        // Poll for scan status updates
        const interval = setInterval(async () => {
          try {
            const status = await invoke<ScanResult>('baker_get_scan_status', { scanId })
            setScanResult(status)

            if (status.endTime) {
              setIsScanning(false)
              setCurrentScanId(null)
              clearInterval(interval)
              setStatusInterval(null)
            }
          } catch {
            // If status polling fails, scan might be complete or cancelled
            clearInterval(interval)
            setStatusInterval(null)
          }
        }, 500) // Poll every 500ms

        setStatusInterval(interval)
      } catch (scanError) {
        setError(scanError instanceof Error ? scanError.message : String(scanError))
        setIsScanning(false)
        setCurrentScanId(null)
      }
    },
    [isScanning]
  )

  const cancelScan = useCallback(async () => {
    if (currentScanId) {
      try {
        await invoke('baker_cancel_scan', { scanId: currentScanId })
        setIsScanning(false)
        setCurrentScanId(null)

        // Clear status polling interval
        if (statusInterval) {
          clearInterval(statusInterval)
          setStatusInterval(null)
        }
      } catch (cancelError) {
        setError(cancelError instanceof Error ? cancelError.message : String(cancelError))
      }
    }
  }, [currentScanId, statusInterval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval)
      }
    }
  }, [statusInterval])

  const clearResults = useCallback(() => {
    setScanResult(null)
    setError(null)
    if (!isScanning) {
      setCurrentScanId(null)
    }
  }, [isScanning])

  return {
    scanResult,
    isScanning,
    error,
    startScan,
    cancelScan,
    clearResults
  }
}
