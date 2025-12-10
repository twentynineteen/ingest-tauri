/**
 * Batch Update Confirmation Dialog
 * Refactored: 2025-11-18 - Extracted sub-components and summary calculation (DEBT-002)
 *
 * Shows a detailed summary of changes that Baker will make across
 * multiple projects before applying batch updates.
 */

import type { BreadcrumbsPreview } from '@/types/baker'
import {
  calculateBatchUpdateSummary,
  hasAnyChanges,
  type BatchUpdateSummary
} from '@utils/batchUpdateSummary'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import React from 'react'
import { DetailedChangesSection } from './BatchUpdate'
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
              <AlertTriangle className="h-5 w-5 text-warning mr-2" />
            ) : (
              <CheckCircle className="h-5 w-5 text-success mr-2" />
            )}
            Confirm Batch Update
          </DialogTitle>
          <DialogDescription>
            Review the changes Baker will make to {calculatedSummary.totalProjects}{' '}
            selected project{calculatedSummary.totalProjects !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasChanges && (
            <>
              {/* Compact Summary Header */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Projects:</span>
                      <span className="font-semibold text-warning">
                        {calculatedSummary.projectsWithChanges}
                      </span>
                    </div>
                    <div className="h-3 w-px bg-border" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-semibold text-foreground">
                        {calculatedSummary.totalChanges.added +
                          calculatedSummary.totalChanges.modified +
                          calculatedSummary.totalChanges.removed}
                      </span>
                    </div>
                    {calculatedSummary.totalChanges.added > 0 && (
                      <>
                        <div className="h-3 w-px bg-border" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Added:</span>
                          <span className="font-semibold text-success">
                            {calculatedSummary.totalChanges.added}
                          </span>
                        </div>
                      </>
                    )}
                    {calculatedSummary.totalChanges.modified > 0 && (
                      <>
                        <div className="h-3 w-px bg-border" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Modified:</span>
                          <span className="font-semibold text-warning">
                            {calculatedSummary.totalChanges.modified}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{calculatedSummary.estimatedDuration}</span>
                  </div>
                </div>

                {/* Common changes as inline pills */}
                {(calculatedSummary.commonChanges.folderSizeCalculated > 0 ||
                  calculatedSummary.commonChanges.filesUpdated > 0 ||
                  calculatedSummary.commonChanges.timestampsUpdated > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {calculatedSummary.commonChanges.folderSizeCalculated > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {calculatedSummary.commonChanges.folderSizeCalculated} size
                        calculations
                      </span>
                    )}
                    {calculatedSummary.commonChanges.filesUpdated > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {calculatedSummary.commonChanges.filesUpdated} file updates
                      </span>
                    )}
                    {calculatedSummary.commonChanges.timestampsUpdated > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {calculatedSummary.commonChanges.timestampsUpdated} timestamp
                        updates
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Warning for large operations */}
              {calculatedSummary.totalProjects > 20 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                  <div className="flex items-start text-warning">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <strong>Large batch operation:</strong> You're updating{' '}
                      {calculatedSummary.totalProjects} projects. Consider running this
                      operation during off-peak hours to avoid performance impact.
                    </div>
                  </div>
                </div>
              )}

              {/* Simplified Detailed Changes */}
              <DetailedChangesSection
                previews={previews}
                selectedProjects={selectedProjects}
              />
            </>
          )}

          {!hasChanges && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success" />
              <p className="text-lg font-medium text-foreground mb-1">
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
            className={hasChanges ? 'bg-warning hover:bg-warning/90' : ''}
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
