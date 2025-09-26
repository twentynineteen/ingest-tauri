/**
 * useLiveBreadcrumbsReader Hook
 *
 * Enhanced breadcrumbs reader that shows current file system state
 * instead of stale cached breadcrumbs data.
 */

import { invoke } from '@tauri-apps/api/core'
import { useCallback, useState } from 'react'
import type { BreadcrumbsFile, FileInfo } from '../types/baker'

interface UseLiveBreadcrumbsReaderResult {
  breadcrumbs: BreadcrumbsFile | null
  isLoading: boolean
  error: string | null
  readLiveBreadcrumbs: (projectPath: string) => Promise<void>
  clearBreadcrumbs: () => void
}

export function useLiveBreadcrumbsReader(): UseLiveBreadcrumbsReaderResult {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbsFile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readLiveBreadcrumbs = useCallback(async (projectPath: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Read existing breadcrumbs file for metadata
      const existingBreadcrumbs = await invoke<BreadcrumbsFile | null>(
        'baker_read_breadcrumbs',
        {
          projectPath
        }
      )

      // Get actual current files from file system
      let actualFiles: FileInfo[] = []
      try {
        actualFiles = await invoke<FileInfo[]>('baker_scan_current_files', {
          projectPath
        })
      } catch (scanError) {
        console.warn(
          `Failed to scan current files for ${projectPath}, using cached data:`,
          scanError
        )
        // Fall back to existing breadcrumbs files if file system scan fails
        if (existingBreadcrumbs?.files) {
          actualFiles = existingBreadcrumbs.files
        }
      }

      if (existingBreadcrumbs) {
        // Create hybrid breadcrumbs with live file data
        const liveBreadcrumbs: BreadcrumbsFile = {
          ...existingBreadcrumbs,
          files: actualFiles,
          numberOfCameras: Math.max(1, Math.max(...actualFiles.map(f => f.camera), 0))
        }
        setBreadcrumbs(liveBreadcrumbs)
      } else if (actualFiles.length > 0) {
        // Create minimal breadcrumbs from file system data only
        const projectName = projectPath.split('/').pop() || 'Unknown Project'
        const liveBreadcrumbs: BreadcrumbsFile = {
          projectTitle: projectName,
          numberOfCameras: Math.max(1, Math.max(...actualFiles.map(f => f.camera), 0)),
          files: actualFiles,
          parentFolder: projectPath.split('/').slice(0, -1).join('/'),
          createdBy: 'Unknown',
          creationDateTime: new Date().toISOString()
        }
        setBreadcrumbs(liveBreadcrumbs)
      } else {
        setBreadcrumbs(null)
        setError('No breadcrumbs file found and no files detected in project')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to read project data'
      setError(errorMessage)
      setBreadcrumbs(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs(null)
    setError(null)
  }, [])

  return {
    breadcrumbs,
    isLoading,
    error,
    readLiveBreadcrumbs,
    clearBreadcrumbs
  }
}
