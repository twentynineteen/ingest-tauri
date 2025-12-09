/**
 * DetailedChangesSection - Simplified detailed changes view
 * Extracted from BatchUpdateConfirmationDialog (DEBT-002)
 * Refactored: 2025-11-18 - Flattened nesting from 6 levels to 2 levels
 */

import type { BreadcrumbsPreview } from '@/types/baker'
import {
  AlertCircle,
  ChevronRight,
  Edit,
  Info,
  Minus,
  Plus
} from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { cn } from '@components/lib/utils'

interface DetailedChangesSectionProps {
  previews: BreadcrumbsPreview[]
  selectedProjects: string[]
}

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'added':
      return <Plus className="h-3 w-3 text-success" />
    case 'modified':
      return <Edit className="h-3 w-3 text-warning" />
    case 'removed':
      return <Minus className="h-3 w-3 text-destructive" />
    default:
      return <Info className="h-3 w-3 text-muted-foreground" />
  }
}

export const DetailedChangesSection: React.FC<DetailedChangesSectionProps> = ({
  previews,
  selectedProjects
}) => {
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  const projectsWithChanges = previews.filter(p => p.detailedChanges?.hasChanges)

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Project-by-Project Changes</h4>
          <span className="text-sm text-muted-foreground">
            {projectsWithChanges.length} projects with changes
          </span>
        </div>
      </div>

      {/* Simplified project list - no nesting */}
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {projectsWithChanges.map((preview, index) => {
          if (!preview.detailedChanges) return null

          const detail = preview.detailedChanges
          const isExpanded = expandedProject === detail.projectPath

          // Collect all changes (content + metadata, skip maintenance)
          const allChanges = [
            ...detail.changeCategories.content,
            ...detail.changeCategories.metadata
          ]

          return (
            <div key={`${detail.projectPath}-${index}`} className="bg-card">
              {/* Compact project header with inline summary */}
              <button
                onClick={() => setExpandedProject(isExpanded ? null : detail.projectPath)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                      isExpanded && 'rotate-90'
                    )}
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-medium text-sm text-foreground truncate">
                      {detail.projectName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {detail.summary.contentChanges > 0 && (
                        <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">
                          {detail.summary.contentChanges} content
                        </span>
                      )}
                      {detail.summary.metadataChanges > 0 && (
                        <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                          {detail.summary.metadataChanges} metadata
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground ml-2">
                  {detail.summary.totalChanges} changes
                </span>
              </button>

              {/* Inline field changes - no category grouping */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {allChanges.map((change, changeIndex) => (
                    <div
                      key={`${change.field}-${changeIndex}`}
                      className="flex items-start gap-2 text-sm bg-muted/50 rounded-lg p-2"
                    >
                      {getChangeIcon(change.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {change.fieldDisplayName}
                          </span>
                          {change.impact !== 'low' && (
                            <span
                              className={cn(
                                'text-xs px-1.5 py-0.5 rounded font-medium',
                                change.impact === 'high'
                                  ? 'bg-destructive/20 text-destructive'
                                  : 'bg-warning/20 text-warning'
                              )}
                            >
                              {change.impact}
                            </span>
                          )}
                        </div>
                        {change.type === 'modified' && (
                          <div className="mt-1 text-xs space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">From:</span>
                              <span className="font-mono text-destructive line-through">
                                {change.formattedOldValue}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">To:</span>
                              <span className="font-mono text-success">
                                {change.formattedNewValue}
                              </span>
                            </div>
                          </div>
                        )}
                        {change.type === 'added' && (
                          <div className="mt-1 text-xs">
                            <span className="font-mono text-success">
                              {change.formattedNewValue}
                            </span>
                          </div>
                        )}
                        {change.type === 'removed' && (
                          <div className="mt-1 text-xs">
                            <span className="font-mono text-destructive line-through">
                              {change.formattedOldValue}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
