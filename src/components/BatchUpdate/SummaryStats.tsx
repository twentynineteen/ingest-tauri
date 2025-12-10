/**
 * SummaryStats - Overview statistics for batch update
 * Extracted from BatchUpdateConfirmationDialog (DEBT-002)
 */

import type { BatchUpdateSummary } from '@utils/batchUpdateSummary'
import React from 'react'

interface SummaryStatsProps {
  summary: BatchUpdateSummary
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{summary.totalProjects}</div>
        <div className="text-xs text-muted-foreground">Total Projects</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-warning">
          {summary.projectsWithChanges}
        </div>
        <div className="text-xs text-muted-foreground">Will Be Updated</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-success">
          {summary.projectsWithoutChanges}
        </div>
        <div className="text-xs text-muted-foreground">No Changes</div>
      </div>
    </div>
  )
}
