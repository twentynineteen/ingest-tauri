/**
 * CommonUpdates - Common update operations display
 * Extracted from BatchUpdateConfirmationDialog (DEBT-002)
 */

import { Clock, Edit, HardDrive, User } from 'lucide-react'
import React from 'react'
import type { BatchUpdateSummary } from '@utils/batchUpdateSummary'

interface CommonUpdatesProps {
  summary: BatchUpdateSummary
}

export const CommonUpdates: React.FC<CommonUpdatesProps> = ({ summary }) => {
  const { commonChanges } = summary

  const hasAnyCommonChanges =
    commonChanges.folderSizeCalculated > 0 ||
    commonChanges.filesUpdated > 0 ||
    commonChanges.timestampsUpdated > 0 ||
    commonChanges.createdByUpdated > 0

  if (!hasAnyCommonChanges) return null

  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium text-foreground mb-3">Common Updates</h4>
      <div className="space-y-2 text-sm">
        {commonChanges.folderSizeCalculated > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-foreground">
              <HardDrive className="h-4 w-4 mr-2" />
              Folder sizes will be calculated
            </div>
            <span className="text-muted-foreground">
              {commonChanges.folderSizeCalculated} projects
            </span>
          </div>
        )}
        {commonChanges.filesUpdated > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-foreground">
              <Edit className="h-4 w-4 mr-2" />
              File lists will be updated
            </div>
            <span className="text-muted-foreground">
              {commonChanges.filesUpdated} projects
            </span>
          </div>
        )}
        {commonChanges.timestampsUpdated > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Last modified timestamps will be updated
            </div>
            <span className="text-muted-foreground">
              {commonChanges.timestampsUpdated} projects
            </span>
          </div>
        )}
        {commonChanges.createdByUpdated > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-foreground">
              <User className="h-4 w-4 mr-2" />
              "Created by" fields will be updated
            </div>
            <span className="text-muted-foreground">
              {commonChanges.createdByUpdated} projects
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
