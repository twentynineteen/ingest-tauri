/**
 * Baker Page Component
 *
 * Main page for Baker folder scanning and breadcrumbs management functionality.
 * Simplified version using only existing UI components.
 */

import ErrorBoundary from '@components/ErrorBoundary'
import { Button } from '@components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/ui/dialog'
import { Input } from '@components/ui/input'
import { open } from '@tauri-apps/plugin-dialog'
import { useBreadcrumb } from 'hooks/useBreadcrumb'
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  FolderOpen,
  Play,
  RefreshCw,
  Settings,
  Square
} from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { useBakerPreferences } from '@hooks/useBakerPreferences'
import { useBakerScan } from '@hooks/useBakerScan'
import { useBreadcrumbsManager } from '@hooks/useBreadcrumbsManager'
import { useLiveBreadcrumbsReader } from '@hooks/useLiveBreadcrumbsReader'
import { useBreadcrumbsPreview } from '@hooks/useBreadcrumbsPreview'
import { BreadcrumbsViewerEnhanced } from '@components/BreadcrumbsViewerEnhanced'
import { BatchUpdateConfirmationDialog } from '@components/BatchUpdateConfirmationDialog'
import type { ProjectFolder } from '@/types/baker'

const BakerPageContent: React.FC = () => {
  // Set breadcrumbs for navigation
  useBreadcrumb([{ label: 'Ingest footage', href: '/ingest/build' }, { label: 'Baker' }])

  // Local state
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [showPreferences, setShowPreferences] = useState(false)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [previewProject, setPreviewProject] = useState<string | null>(null)
  const [showBatchConfirmation, setShowBatchConfirmation] = useState(false)

  // Custom hooks
  const { scanResult, isScanning, error, startScan, cancelScan, clearResults } =
    useBakerScan()
  const { updateBreadcrumbs, isUpdating, lastUpdateResult, clearResults: clearUpdateResults } = useBreadcrumbsManager()
  const { preferences, updatePreferences, resetToDefaults } = useBakerPreferences()
  const { breadcrumbs, isLoading: isLoadingBreadcrumbs, error: breadcrumbsError, readLiveBreadcrumbs, clearBreadcrumbs } = useLiveBreadcrumbsReader()
  const { generatePreview, generateBatchPreviews, clearPreviews, getPreview } = useBreadcrumbsPreview()

  // Handlers
  const handleSelectFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select folder to scan for projects'
      })

      if (selected && typeof selected === 'string') {
        setSelectedFolder(selected)
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
    }
  }, [])

  const handleStartScan = useCallback(async () => {
    if (!selectedFolder.trim()) {
      alert('Please select a folder to scan')
      return
    }

    try {
      await startScan(selectedFolder, {
        maxDepth: preferences.maxDepth,
        includeHidden: preferences.includeHidden,
        createMissing: preferences.createMissing,
        backupOriginals: preferences.backupOriginals
      })
    } catch (error) {
      console.error('Failed to start scan:', error)
    }
  }, [selectedFolder, preferences, startScan])

  const handleProjectSelection = useCallback(
    (projectPath: string, isSelected: boolean) => {
      setSelectedProjects(prev => {
        if (isSelected) {
          return [...prev, projectPath]
        } else {
          return prev.filter(path => path !== projectPath)
        }
      })
    },
    []
  )

  const handleSelectAll = useCallback(() => {
    if (scanResult?.projects) {
      setSelectedProjects(scanResult.projects.map(p => p.path))
    }
  }, [scanResult])

  const handleClearSelection = useCallback(() => {
    setSelectedProjects([])
  }, [])

  const handleApplyChanges = useCallback(async () => {
    if (selectedProjects.length === 0) {
      alert('Please select projects to update')
      return
    }

    // Generate previews for selected projects before showing confirmation dialog
    if (scanResult?.projects) {
      const selectedProjectData = scanResult.projects.filter(p => selectedProjects.includes(p.path))
      await generateBatchPreviews(selectedProjectData)
    }

    // Show confirmation dialog with preview
    setShowBatchConfirmation(true)
  }, [selectedProjects, scanResult, generateBatchPreviews])

  const handleConfirmBatchUpdate = useCallback(async () => {
    try {
      await updateBreadcrumbs(selectedProjects, {
        createMissing: preferences.createMissing,
        backupOriginals: preferences.backupOriginals
      })

      // Clear selection and previews after successful update
      setSelectedProjects([])
      clearPreviews()
      setShowBatchConfirmation(false)
    } catch (error) {
      alert(`Failed to update breadcrumbs: ${error}`)
      setShowBatchConfirmation(false)
    }
  }, [selectedProjects, preferences, updateBreadcrumbs, clearPreviews])

  const handleViewBreadcrumbs = useCallback(async (projectPath: string) => {
    if (expandedProject === projectPath) {
      // Collapse if already expanded
      setExpandedProject(null)
      setPreviewProject(null)
      clearBreadcrumbs()
    } else {
      // Expand and load live breadcrumbs
      setExpandedProject(projectPath)
      await readLiveBreadcrumbs(projectPath)
    }
  }, [expandedProject, readLiveBreadcrumbs, clearBreadcrumbs])

  const handleTogglePreview = useCallback(async (projectPath: string) => {
    if (previewProject === projectPath) {
      // Hide preview
      setPreviewProject(null)
    } else {
      // Show preview and generate if needed
      setPreviewProject(projectPath)
      const project = scanResult?.projects.find(p => p.path === projectPath)
      if (project && !getPreview(projectPath)) {
        await generatePreview(projectPath, project)
      }
    }
  }, [previewProject, scanResult, getPreview, generatePreview])

  return (
    <div className="px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-semibold">Baker</h2>
        <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Baker Preferences</DialogTitle>
              <DialogDescription>
                Configure scanning and update behavior
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Create missing breadcrumbs</span>
                <input
                  type="checkbox"
                  checked={preferences.createMissing}
                  onChange={e => updatePreferences({ createMissing: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Backup original files</span>
                <input
                  type="checkbox"
                  checked={preferences.backupOriginals}
                  onChange={e => updatePreferences({ backupOriginals: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Include hidden folders</span>
                <input
                  type="checkbox"
                  checked={preferences.includeHidden}
                  onChange={e => updatePreferences({ includeHidden: e.target.checked })}
                />
              </label>
              <div>
                <label>Max scanning depth: {preferences.maxDepth}</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={preferences.maxDepth}
                  onChange={e =>
                    updatePreferences({ maxDepth: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={resetToDefaults}>
                  Reset to Defaults
                </Button>
                <Button onClick={() => setShowPreferences(false)}>Done</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folder Selection */}
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-medium">Select Folder to Scan</h3>
        <p className="text-sm text-gray-600">
          Choose a root directory to scan for BuildProject-compatible folders
        </p>
        <div className="flex space-x-2">
          <Input
            placeholder="No folder selected"
            value={selectedFolder}
            readOnly
            className="flex-1"
          />
          <Button onClick={handleSelectFolder} variant="outline">
            <FolderOpen className="h-4 w-4 mr-2" />
            Browse
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleStartScan}
            disabled={!selectedFolder || isScanning}
            className="flex-1"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Scan
              </>
            )}
          </Button>
          {isScanning && (
            <Button onClick={cancelScan} variant="outline">
              <Square className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          {scanResult && (
            <Button 
              onClick={() => {
                clearResults()
                clearUpdateResults()
                // Reset all view state
                setSelectedProjects([])
                setExpandedProject(null)
                setPreviewProject(null)
                clearBreadcrumbs()
                clearPreviews()
              }} 
              variant="outline"
            >
              Clear Results
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Scan Progress */}
      {isScanning && scanResult && (
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Scanning in progress...</p>
              <p className="text-sm text-gray-500">
                {scanResult.totalFolders} folders scanned • {scanResult.validProjects}{' '}
                projects found
              </p>
            </div>
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
        </div>
      )}

      {/* Results Summary */}
      {scanResult && !isScanning && (
        <div className="border rounded-lg p-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{scanResult.totalFolders}</p>
              <p className="text-sm text-gray-500">Folders Scanned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {scanResult.validProjects}
              </p>
              <p className="text-sm text-gray-500">Valid Projects</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {scanResult.projects.filter(p => p.hasBreadcrumbs).length}
              </p>
              <p className="text-sm text-gray-500">With Breadcrumbs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {scanResult.errors.length}
              </p>
              <p className="text-sm text-gray-500">Errors</p>
            </div>
          </div>
        </div>
      )}

      {/* Project Results */}
      {scanResult?.projects.length ? (
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium">
            Found Projects ({scanResult.projects.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scanResult.projects.map((project: ProjectFolder) => (
              <div key={project.path} className="border rounded">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.path)}
                      onChange={e => handleProjectSelection(project.path, e.target.checked)}
                    />
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {project.path}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded ${project.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {project.isValid ? 'Valid' : 'Invalid'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${project.hasBreadcrumbs ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {project.hasBreadcrumbs ? 'Has breadcrumbs' : 'Missing breadcrumbs'}
                      </span>
                      {project.hasBreadcrumbs && (
                        <span
                          className={`px-2 py-1 rounded ${project.staleBreadcrumbs ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {project.staleBreadcrumbs ? 'Stale breadcrumbs' : 'Up to date'}
                        </span>
                      )}
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
                        {project.cameraCount} camera{project.cameraCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {project.hasBreadcrumbs && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewBreadcrumbs(project.path)}
                        className="ml-2"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {expandedProject === project.path ? 'Hide' : 'View'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Breadcrumbs Viewer */}
                {expandedProject === project.path && (
                  <div className="border-t p-3">
                    {isLoadingBreadcrumbs ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-gray-500">Loading breadcrumbs...</span>
                      </div>
                    ) : breadcrumbsError ? (
                      <div className="flex items-center justify-center py-4 text-red-600">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="text-sm">{breadcrumbsError}</span>
                      </div>
                    ) : breadcrumbs ? (
                      <BreadcrumbsViewerEnhanced 
                        breadcrumbs={breadcrumbs} 
                        projectPath={project.path}
                        previewMode={previewProject === project.path}
                        preview={getPreview(project.path)}
                        onTogglePreview={() => handleTogglePreview(project.path)}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-4 text-gray-500">
                        <span className="text-sm">No breadcrumbs data found</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : scanResult && !isScanning ? (
        <div className="border rounded-lg p-6 text-center text-gray-500">
          No projects found
        </div>
      ) : null}

      {/* Batch Actions */}
      {scanResult && scanResult.projects.length > 0 && (
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                {selectedProjects.length} of {scanResult.projects.length} projects
                selected
              </span>
              <Button variant="link" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="link" size="sm" onClick={handleClearSelection}>
                Clear Selection
              </Button>
            </div>
            <Button
              onClick={handleApplyChanges}
              disabled={selectedProjects.length === 0 || isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Update Results */}
      {lastUpdateResult && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-green-800">
              Update complete: {lastUpdateResult.successful.length} successful,{' '}
              {lastUpdateResult.failed.length} failed
              {lastUpdateResult.created.length > 0 &&
                ` • ${lastUpdateResult.created.length} created`}
              {lastUpdateResult.updated.length > 0 &&
                ` • ${lastUpdateResult.updated.length} updated`}
            </span>
          </div>
        </div>
      )}

      {/* Batch Update Confirmation Dialog */}
      <BatchUpdateConfirmationDialog
        isOpen={showBatchConfirmation}
        onClose={() => setShowBatchConfirmation(false)}
        onConfirm={handleConfirmBatchUpdate}
        selectedProjects={selectedProjects}
        previews={selectedProjects.map(path => getPreview(path)).filter((preview): preview is NonNullable<typeof preview> => preview !== null)}
        isLoading={isUpdating}
      />
    </div>
  )
}

const BakerPage: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="max-w-md">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Baker Error</h2>
            <div className="text-gray-600 mb-6">
              <p>An error occurred while loading the Baker page. This could be due to:</p>
              <ul className="text-left mt-2 space-y-1">
                <li>• File system access issues</li>
                <li>• Invalid scan configuration</li>
                <li>• Memory or performance constraints</li>
              </ul>
              {error && process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left bg-gray-50 p-4 rounded-md text-sm">
                  <summary className="cursor-pointer font-medium">
                    Technical Details
                  </summary>
                  <div className="mt-2">
                    <p>
                      <strong>Error:</strong> {error.message}
                    </p>
                  </div>
                </details>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={retry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/ingest/build')}
                className="flex-1"
              >
                Back to Build
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      <BakerPageContent />
    </ErrorBoundary>
  )
}

export default BakerPage
