/**
 * Batch Actions Component
 *
 * Handles project selection and batch update operations for Baker.
 */

import { Button } from '@components/ui/button'
import { CheckCircle, RefreshCw } from 'lucide-react'
import React from 'react'

interface BatchActionsProps {
  selectedProjects: string[]
  totalProjects: number
  isUpdating: boolean
  onSelectAll: () => void
  onClearSelection: () => void
  onApplyChanges: () => void
}

export const BatchActions: React.FC<BatchActionsProps> = ({
  selectedProjects,
  totalProjects,
  isUpdating,
  onSelectAll,
  onClearSelection,
  onApplyChanges
}) => {
  if (totalProjects === 0) return null

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
          4
        </div>
        <h2 className="text-sm font-semibold text-foreground">Batch Actions</h2>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm">
            {selectedProjects.length} of {totalProjects} projects selected
          </span>
          <Button variant="link" size="sm" onClick={onSelectAll}>
            Select All
          </Button>
          <Button variant="link" size="sm" onClick={onClearSelection}>
            Clear Selection
          </Button>
        </div>
        <Button
          onClick={onApplyChanges}
          disabled={selectedProjects.length === 0 || isUpdating}
          size="sm"
          className="gap-1.5 shadow-sm hover:shadow"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              Apply Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
