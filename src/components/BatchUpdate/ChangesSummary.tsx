/**
 * ChangesSummary - Summary of field changes
 * Extracted from BatchUpdateConfirmationDialog (DEBT-002)
 */

import { Edit, Minus, Plus } from 'lucide-react'
import React from 'react'
import type { BatchUpdateSummary } from '@utils/batchUpdateSummary'

interface ChangesSummaryProps {
  summary: BatchUpdateSummary
}

export const ChangesSummary: React.FC<ChangesSummaryProps> = ({ summary }) => {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium text-foreground mb-3">Changes Summary</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        {summary.totalChanges.added > 0 && (
          <div className="flex items-center text-success">
            <Plus className="h-4 w-4 mr-1" />
            {summary.totalChanges.added} fields added
          </div>
        )}
        {summary.totalChanges.modified > 0 && (
          <div className="flex items-center text-warning">
            <Edit className="h-4 w-4 mr-1" />
            {summary.totalChanges.modified} fields modified
          </div>
        )}
        {summary.totalChanges.removed > 0 && (
          <div className="flex items-center text-destructive">
            <Minus className="h-4 w-4 mr-1" />
            {summary.totalChanges.removed} fields removed
          </div>
        )}
      </div>
    </div>
  )
}
