/**
 * useBreadcrumbsPreview Hook
 * 
 * Custom hook for managing breadcrumbs preview functionality.
 * Generates previews of changes Baker will make to breadcrumbs files.
 */

import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { BreadcrumbsPreview, BreadcrumbsFile, ProjectFolder } from '../types/baker'
import { generateBreadcrumbsPreview } from '../utils/breadcrumbsComparison'

interface UseBreadcrumbsPreviewResult {
  // State
  previews: Map<string, BreadcrumbsPreview>
  isGenerating: boolean
  error: string | null
  
  // Actions
  generatePreview: (projectPath: string, projectData: ProjectFolder) => Promise<BreadcrumbsPreview | null>
  generateBatchPreviews: (projects: ProjectFolder[]) => Promise<Map<string, BreadcrumbsPreview>>
  clearPreviews: () => void
  
  // Utilities
  getPreview: (projectPath: string) => BreadcrumbsPreview | null
  hasPreview: (projectPath: string) => boolean
}

export function useBreadcrumbsPreview(): UseBreadcrumbsPreviewResult {
  const [previews, setPreviews] = useState<Map<string, BreadcrumbsPreview>>(new Map())
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePreview = useCallback(async (
    projectPath: string, 
    projectData: ProjectFolder
  ): Promise<BreadcrumbsPreview | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      // Read current breadcrumbs if they exist
      let currentBreadcrumbs: BreadcrumbsFile | null = null
      if (projectData.hasBreadcrumbs) {
        try {
          currentBreadcrumbs = await invoke<BreadcrumbsFile | null>('baker_read_breadcrumbs', {
            projectPath
          })
        } catch (readError) {
          console.warn(`Failed to read existing breadcrumbs for ${projectPath}:`, readError)
          // Continue with null current breadcrumbs
        }
      }

      // Scan actual file system for current state instead of using cached breadcrumbs
      let actualFiles: Array<{ camera: number; name: string; path: string }> = []
      
      try {
        // Get actual current files from file system
        actualFiles = await invoke<Array<{ camera: number; name: string; path: string }>>('baker_scan_current_files', {
          projectPath
        })
      } catch (scanError) {
        console.warn(`Failed to scan current files for ${projectPath}, falling back to breadcrumbs/placeholder:`, scanError)
        
        // Fallback: use existing breadcrumbs files if available
        if (currentBreadcrumbs?.files && currentBreadcrumbs.files.length > 0) {
          actualFiles = [...currentBreadcrumbs.files]
        } else {
          // Last resort: generate placeholder files for new breadcrumbs
          for (let camera = 1; camera <= projectData.cameraCount; camera++) {
            const cameraPath = `${projectPath}/Footage/Camera ${camera}`
            actualFiles.push({
              camera,
              name: `Camera${camera}_Sample.mp4`,
              path: `${cameraPath}/Camera${camera}_Sample.mp4`
            })
          }
        }
      }

      const preview = generateBreadcrumbsPreview(currentBreadcrumbs, projectPath, {
        files: actualFiles,
        cameraCount: projectData.cameraCount
      })

      // Add folder size calculation if missing
      if (!currentBreadcrumbs?.folderSizeBytes) {
        try {
          const folderSize = await invoke<number>('get_folder_size', {
            folderPath: projectPath
          })
          preview.updated.folderSizeBytes = folderSize
          
          // Update the diff to reflect folder size addition
          const existingChange = preview.diff.changes.find(c => c.field === 'folderSizeBytes')
          if (existingChange) {
            existingChange.newValue = folderSize
          } else {
            preview.diff.changes.push({
              type: 'added',
              field: 'folderSizeBytes',
              newValue: folderSize
            })
            preview.diff.summary.added++
            preview.diff.hasChanges = true
          }
        } catch (sizeError) {
          console.warn(`Failed to calculate folder size for ${projectPath}:`, sizeError)
        }
      }

      setPreviews(prev => new Map(prev.set(projectPath, preview)))
      return preview
    } catch (previewError) {
      const errorMessage = previewError instanceof Error ? previewError.message : String(previewError)
      setError(`Failed to generate preview for ${projectPath}: ${errorMessage}`)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const generateBatchPreviews = useCallback(async (
    projects: ProjectFolder[]
  ): Promise<Map<string, BreadcrumbsPreview>> => {
    setIsGenerating(true)
    setError(null)

    const newPreviews = new Map<string, BreadcrumbsPreview>()

    try {
      // Generate previews in parallel for better performance
      const previewPromises = projects.map(async project => {
        const preview = await generatePreview(project.path, project)
        if (preview) {
          return [project.path, preview] as const
        }
        return null
      })

      const results = await Promise.all(previewPromises)
      
      results.forEach(result => {
        if (result) {
          newPreviews.set(result[0], result[1])
        }
      })

      setPreviews(newPreviews)
      return newPreviews
    } catch (batchError) {
      const errorMessage = batchError instanceof Error ? batchError.message : String(batchError)
      setError(`Failed to generate batch previews: ${errorMessage}`)
      return new Map()
    } finally {
      setIsGenerating(false)
    }
  }, [generatePreview])

  const clearPreviews = useCallback(() => {
    setPreviews(new Map())
    setError(null)
  }, [])

  const getPreview = useCallback((projectPath: string): BreadcrumbsPreview | null => {
    return previews.get(projectPath) || null
  }, [previews])

  const hasPreview = useCallback((projectPath: string): boolean => {
    return previews.has(projectPath)
  }, [previews])

  return {
    previews,
    isGenerating,
    error,
    generatePreview,
    generateBatchPreviews,
    clearPreviews,
    getPreview,
    hasPreview
  }
}