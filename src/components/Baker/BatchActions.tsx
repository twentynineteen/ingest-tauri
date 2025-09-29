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
    <div className="border rounded-lg p-6">
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
  )
}