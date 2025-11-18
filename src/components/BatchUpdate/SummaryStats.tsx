/**
 * SummaryStats - Overview statistics for batch update
 * Extracted from BatchUpdateConfirmationDialog (DEBT-002)
 */

import React from 'react'
import type { BatchUpdateSummary } from '../../utils/batchUpdateSummary'

interface SummaryStatsProps {
  summary: BatchUpdateSummary
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{summary.totalProjects}</div>
        <div className="text-xs text-gray-600">Total Projects</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">
          {summary.projectsWithChanges}
        </div>
        <div className="text-xs text-gray-600">Will Be Updated</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">
          {summary.projectsWithoutChanges}
        </div>
        <div className="text-xs text-gray-600">No Changes</div>
      </div>
    </div>
  )
}
