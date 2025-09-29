/**
 * Baker Page Component
 *
 * Main page for Baker folder scanning and breadcrumbs management functionality.
 * Refactored to separate concerns into focused components and hooks.
 */

import { BatchUpdateConfirmationDialog } from '@components/BatchUpdateConfirmationDialog'
import { BatchActions } from '@components/Baker/BatchActions'
import { BakerPreferences } from '@components/Baker/BakerPreferences'
import { FolderSelector } from '@components/Baker/FolderSelector'
import { ProjectList } from '@components/Baker/ProjectList'
import { ScanResults } from '@components/Baker/ScanResults'
import ErrorBoundary from '@components/ErrorBoundary'
import { useBakerPreferences } from '@hooks/useBakerPreferences'
import { useBakerScan } from '@hooks/useBakerScan'
import { useBakerTrelloIntegration } from '@hooks/useBakerTrelloIntegration'
import { useBreadcrumbsManager } from '@hooks/useBreadcrumbsManager'
import { useBreadcrumbsPreview } from '@hooks/useBreadcrumbsPreview'
import { useLiveBreadcrumbsReader } from '@hooks/useLiveBreadcrumbsReader'
import { useTrelloBoard } from 'hooks'
import { useBreadcrumb } from 'hooks/useBreadcrumb'
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import React, { useCallback, useState } from 'react'

const BakerPageContent: React.FC = () => {
  // Set breadcrumbs for navigation
  useBreadcrumb([{ label: 'Ingest footage', href: '/ingest/build' }, { label: 'Baker' }])

  // Local state - simplified to essential page-level state
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [showPreferences, setShowPreferences] = useState(false)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [previewProject, setPreviewProject] = useState<string | null>(null)
  const [showBatchConfirmation, setShowBatchConfirmation] = useState(false)

  // Custom hooks - all business logic moved to hooks
  const { scanResult, isScanning, error, startScan, cancelScan, clearResults } = useBakerScan()
  const { updateBreadcrumbs, isUpdating, lastUpdateResult, clearResults: clearUpdateResults } = useBreadcrumbsManager()
  const { preferences, updatePreferences, resetToDefaults } = useBakerPreferences()
  const { breadcrumbs, isLoading: isLoadingBreadcrumbs, error: breadcrumbsError, readLiveBreadcrumbs, clearBreadcrumbs } = useLiveBreadcrumbsReader()
  const { generatePreview, generateBatchPreviews, clearPreviews, getPreview } = useBreadcrumbsPreview()

  // Trello integration - now properly separated
  const boardId = '55a504d70bed2bd21008dc5a'
  const { apiKey, token } = useTrelloBoard(boardId)
  const { updateTrelloCards } = useBakerTrelloIntegration({ apiKey, token })

  // Event handlers - simplified to essential page-level coordination
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

  const handleClearResults = useCallback(() => {
    clearResults()
    clearUpdateResults()
    setSelectedProjects([])
    setExpandedProject(null)
    setPreviewProject(null)
    clearBreadcrumbs()
    clearPreviews()
  }, [clearResults, clearUpdateResults, clearBreadcrumbs, clearPreviews])

  const handleProjectSelection = useCallback((projectPath: string, isSelected: boolean) => {
    setSelectedProjects(prev => {
      if (isSelected) {
        return [...prev, projectPath]
      } else {
        return prev.filter(path => path !== projectPath)
      }
    })
  }, [])

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
      const selectedProjectData = scanResult.projects.filter(p =>
        selectedProjects.includes(p.path)
      )
      await generateBatchPreviews(selectedProjectData)
    }

    setShowBatchConfirmation(true)
  }, [selectedProjects, scanResult, generateBatchPreviews])

  const handleConfirmBatchUpdate = useCallback(async () => {
    try {
      // Update local breadcrumbs files first
      await updateBreadcrumbs(selectedProjects, {
        createMissing: preferences.createMissing,
        backupOriginals: preferences.backupOriginals
      })

      // Update Trello cards using extracted hook
      const trelloErrors = await updateTrelloCards(selectedProjects)

      // Clear selection and previews after update
      setSelectedProjects([])
      clearPreviews()
      setShowBatchConfirmation(false)

      // Show Trello errors if any occurred
      if (trelloErrors.length > 0) {
        const errorMessage = `Breadcrumbs updated successfully, but ${trelloErrors.length} Trello card update(s) failed:\n\n` +
          trelloErrors.map(({project, error}) => `• ${project}: ${error}`).join('\n')
        alert(errorMessage)
      }
    } catch (error) {
      alert(`Failed to update breadcrumbs: ${error}`)
      setShowBatchConfirmation(false)
    }
  }, [selectedProjects, preferences, updateBreadcrumbs, updateTrelloCards, clearPreviews])

  const handleViewBreadcrumbs = useCallback(async (projectPath: string) => {
    if (expandedProject === projectPath) {
      setExpandedProject(null)
      setPreviewProject(null)
      clearBreadcrumbs()
    } else {
      setExpandedProject(projectPath)
      await readLiveBreadcrumbs(projectPath)
    }
  }, [expandedProject, readLiveBreadcrumbs, clearBreadcrumbs])

  const handleTogglePreview = useCallback(async (projectPath: string) => {
    if (previewProject === projectPath) {
      setPreviewProject(null)
    } else {
      setPreviewProject(projectPath)
      const project = scanResult?.projects.find(p => p.path === projectPath)
      if (project && !getPreview(projectPath)) {
        await generatePreview(projectPath, project)
      }
    }
  }, [previewProject, scanResult, getPreview, generatePreview])

  return (
    <div className="px-6 space-y-6">
      {/* Header with Settings */}
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-semibold">Baker</h2>
        <BakerPreferences
          preferences={preferences}
          onUpdatePreferences={updatePreferences}
          onResetToDefaults={resetToDefaults}
          isOpen={showPreferences}
          onOpenChange={setShowPreferences}
        />
      </div>

      {/* Folder Selection */}
      <FolderSelector
        selectedFolder={selectedFolder}
        onFolderChange={setSelectedFolder}
        onStartScan={handleStartScan}
        onCancelScan={cancelScan}
        onClearResults={handleClearResults}
        isScanning={isScanning}
        hasResults={!!scanResult}
      />

      {/* Error Display */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Scan Results */}
      <ScanResults scanResult={scanResult} isScanning={isScanning} />

      {/* Project Results */}
      {scanResult?.projects && (
        <ProjectList
          projects={scanResult.projects}
          selectedProjects={selectedProjects}
          onProjectSelection={handleProjectSelection}
          onViewBreadcrumbs={handleViewBreadcrumbs}
          onTogglePreview={handleTogglePreview}
          expandedProject={expandedProject}
          previewProject={previewProject}
          breadcrumbs={breadcrumbs}
          isLoadingBreadcrumbs={isLoadingBreadcrumbs}
          breadcrumbsError={breadcrumbsError}
          getPreview={getPreview}
        />
      )}

      {/* Batch Actions */}
      <BatchActions
        selectedProjects={selectedProjects}
        totalProjects={scanResult?.projects.length || 0}
        isUpdating={isUpdating}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onApplyChanges={handleApplyChanges}
      />

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
        previews={selectedProjects
          .map(path => getPreview(path))
          .filter((preview): preview is NonNullable<typeof preview> => preview !== null)}
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
              <button onClick={retry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
              <button
                onClick={() => (window.location.href = '/ingest/build')}
                className="flex-1"
              >
                Back to Build
              </button>
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