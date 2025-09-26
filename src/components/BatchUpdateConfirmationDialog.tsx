/**
 * Batch Update Confirmation Dialog
 * 
 * Shows a detailed summary of changes that Baker will make across
 * multiple projects before applying batch updates.
 */

import React from 'react'
import { AlertTriangle, CheckCircle, Plus, Edit, Minus, HardDrive, Clock, User } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog'
import type { BreadcrumbsPreview } from '../types/baker'

interface BatchUpdateSummary {
  totalProjects: number
  projectsWithChanges: number
  projectsWithoutChanges: number
  totalChanges: {
    added: number
    modified: number
    removed: number
  }
  commonChanges: {
    folderSizeCalculated: number
    filesUpdated: number
    timestampsUpdated: number
    createdByUpdated: number
  }
  estimatedDuration: string
}

interface BatchUpdateConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedProjects: string[]
  previews?: BreadcrumbsPreview[]
  isLoading?: boolean
  summary?: BatchUpdateSummary
}

export const BatchUpdateConfirmationDialog: React.FC<BatchUpdateConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedProjects,
  previews = [],
  isLoading = false,
  summary
}) => {
  // Calculate summary if not provided
  const calculatedSummary: BatchUpdateSummary = summary || {
    totalProjects: selectedProjects.length,
    projectsWithChanges: previews.filter(p => {
      const meaningfulDiff = p.meaningfulDiff || p.diff
      return meaningfulDiff.hasChanges
    }).length,
    projectsWithoutChanges: previews.filter(p => {
      const meaningfulDiff = p.meaningfulDiff || p.diff
      return !meaningfulDiff.hasChanges
    }).length,
    totalChanges: previews.reduce(
      (acc, preview) => {
        const meaningfulDiff = preview.meaningfulDiff || preview.diff
        return {
          added: acc.added + meaningfulDiff.summary.added,
          modified: acc.modified + meaningfulDiff.summary.modified,
          removed: acc.removed + meaningfulDiff.summary.removed
        }
      },
      { added: 0, modified: 0, removed: 0 }
    ),
    commonChanges: {
      folderSizeCalculated: previews.filter(p => {
        const meaningfulDiff = p.meaningfulDiff || p.diff
        return meaningfulDiff.changes.some(c => c.field === 'folderSizeBytes' && c.type === 'added')
      }).length,
      filesUpdated: previews.filter(p => {
        const meaningfulDiff = p.meaningfulDiff || p.diff
        return meaningfulDiff.changes.some(c => c.field === 'files' && c.type === 'modified')
      }).length,
      timestampsUpdated: previews.filter(p =>
        p.diff.changes.some(c => c.field === 'lastModified')
      ).length,
      createdByUpdated: previews.filter(p => {
        const meaningfulDiff = p.meaningfulDiff || p.diff
        return meaningfulDiff.changes.some(c => c.field === 'createdBy' && c.type === 'modified')
      }).length
    },
    estimatedDuration: selectedProjects.length > 10 ? '2-3 minutes' : 'Less than 1 minute'
  }

  const hasChanges = calculatedSummary.totalChanges.added > 0 || 
                    calculatedSummary.totalChanges.modified > 0 || 
                    calculatedSummary.totalChanges.removed > 0

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
            Review the changes Baker will make to {calculatedSummary.totalProjects} selected project{calculatedSummary.totalProjects !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{calculatedSummary.totalProjects}</div>
              <div className="text-xs text-gray-600">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{calculatedSummary.projectsWithChanges}</div>
              <div className="text-xs text-gray-600">Will Be Updated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{calculatedSummary.projectsWithoutChanges}</div>
              <div className="text-xs text-gray-600">No Changes</div>
            </div>
          </div>

          {hasChanges && (
            <>
              {/* Change Summary */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Changes Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {calculatedSummary.totalChanges.added > 0 && (
                    <div className="flex items-center text-green-700">
                      <Plus className="h-4 w-4 mr-1" />
                      {calculatedSummary.totalChanges.added} fields added
                    </div>
                  )}
                  {calculatedSummary.totalChanges.modified > 0 && (
                    <div className="flex items-center text-orange-700">
                      <Edit className="h-4 w-4 mr-1" />
                      {calculatedSummary.totalChanges.modified} fields modified
                    </div>
                  )}
                  {calculatedSummary.totalChanges.removed > 0 && (
                    <div className="flex items-center text-red-700">
                      <Minus className="h-4 w-4 mr-1" />
                      {calculatedSummary.totalChanges.removed} fields removed
                    </div>
                  )}
                </div>
              </div>

              {/* Common Operations */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Common Updates</h4>
                <div className="space-y-2 text-sm">
                  {calculatedSummary.commonChanges.folderSizeCalculated > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <HardDrive className="h-4 w-4 mr-2" />
                        Folder sizes will be calculated
                      </div>
                      <span className="text-gray-500">
                        {calculatedSummary.commonChanges.folderSizeCalculated} projects
                      </span>
                    </div>
                  )}
                  {calculatedSummary.commonChanges.filesUpdated > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Edit className="h-4 w-4 mr-2" />
                        File lists will be updated
                      </div>
                      <span className="text-gray-500">
                        {calculatedSummary.commonChanges.filesUpdated} projects
                      </span>
                    </div>
                  )}
                  {calculatedSummary.commonChanges.timestampsUpdated > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Clock className="h-4 w-4 mr-2" />
                        Last modified timestamps will be updated
                      </div>
                      <span className="text-gray-500">
                        {calculatedSummary.commonChanges.timestampsUpdated} projects
                      </span>
                    </div>
                  )}
                  {calculatedSummary.commonChanges.createdByUpdated > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <User className="h-4 w-4 mr-2" />
                        "Created by" fields will be updated
                      </div>
                      <span className="text-gray-500">
                        {calculatedSummary.commonChanges.createdByUpdated} projects
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Duration */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center text-blue-800">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Estimated completion time: <strong>{calculatedSummary.estimatedDuration}</strong>
                  </span>
                </div>
              </div>

              {/* Warning for large operations */}
              {calculatedSummary.totalProjects > 20 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start text-yellow-800">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <strong>Large batch operation:</strong> You're updating {calculatedSummary.totalProjects} projects. 
                      Consider running this operation during off-peak hours to avoid performance impact.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!hasChanges && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p className="text-lg font-medium text-gray-700 mb-1">No Changes Required</p>
              <p className="text-sm">All selected projects already have up-to-date breadcrumbs files.</p>
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
            className={hasChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            {isLoading ? (
              "Updating..."
            ) : hasChanges ? (
              `Update ${calculatedSummary.projectsWithChanges} Project${calculatedSummary.projectsWithChanges !== 1 ? 's' : ''}`
            ) : (
              "Nothing to Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}