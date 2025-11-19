/**
 * Batch Update Confirmation Dialog
 * Refactored: 2025-11-18 - Extracted sub-components and summary calculation (DEBT-002)
 *
 * Shows a detailed summary of changes that Baker will make across
 * multiple projects before applying batch updates.
 */

import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import React from 'react'
import type { BreadcrumbsPreview } from '../types/baker'
import {
  calculateBatchUpdateSummary,
  hasAnyChanges,
  type BatchUpdateSummary
} from '../utils/batchUpdateSummary'
import {
  ChangesSummary,
  CommonUpdates,
  DetailedChangesSection,
  SummaryStats
} from './BatchUpdate'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'

interface BatchUpdateConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedProjects: string[]
  previews?: BreadcrumbsPreview[]
  isLoading?: boolean
  summary?: BatchUpdateSummary
}

export const BatchUpdateConfirmationDialog: React.FC<
  BatchUpdateConfirmationDialogProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedProjects,
  previews = [],
  isLoading = false,
  summary
}) => {
  // Calculate summary if not provided
  const calculatedSummary: BatchUpdateSummary =
    summary || calculateBatchUpdateSummary(selectedProjects, previews)

  const hasChanges = hasAnyChanges(calculatedSummary)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {hasChanges ? (
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            )}
            Confirm Batch Update
          </DialogTitle>
          <DialogDescription>
            Review the changes Baker will make to {calculatedSummary.totalProjects}{' '}
            selected project{calculatedSummary.totalProjects !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overview Stats */}
          <SummaryStats summary={calculatedSummary} />

          {hasChanges && (
            <>
              {/* Change Summary */}
              <ChangesSummary summary={calculatedSummary} />

              {/* Common Operations */}
              <CommonUpdates summary={calculatedSummary} />

              {/* Estimated Duration */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center text-blue-800">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Estimated completion time:{' '}
                    <strong>{calculatedSummary.estimatedDuration}</strong>
                  </span>
                </div>
              </div>

              {/* Warning for large operations */}
              {calculatedSummary.totalProjects > 20 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start text-yellow-800">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <strong>Large batch operation:</strong> You're updating{' '}
                      {calculatedSummary.totalProjects} projects. Consider running this
                      operation during off-peak hours to avoid performance impact.
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Changes */}
              <DetailedChangesSection
                previews={previews}
                selectedProjects={selectedProjects}
              />
            </>
          )}

          {!hasChanges && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p className="text-lg font-medium text-gray-700 mb-1">
                No Changes Required
              </p>
              <p className="text-sm">
                All selected projects already have up-to-date breadcrumbs files.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || !hasChanges}
            className={hasChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            {isLoading
              ? 'Updating...'
              : hasChanges
                ? `Update ${calculatedSummary.projectsWithChanges} Project${calculatedSummary.projectsWithChanges !== 1 ? 's' : ''}`
                : 'Nothing to Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
