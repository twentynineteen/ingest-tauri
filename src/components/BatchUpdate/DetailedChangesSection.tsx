/**
 * DetailedChangesSection - Expandable detailed changes view
 * Extracted from BatchUpdateConfirmationDialog (DEBT-002)
 */

import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import React, { useState } from 'react'
import type { BreadcrumbsPreview } from '../../types/baker'
import { ProjectChangeDetailView } from '../ProjectChangeDetailView'
import { Button } from '../ui/button'

interface DetailedChangesSectionProps {
  previews: BreadcrumbsPreview[]
  selectedProjects: string[]
}

export const DetailedChangesSection: React.FC<DetailedChangesSectionProps> = ({
  previews,
  selectedProjects
}) => {
  const [showDetailedChanges, setShowDetailedChanges] = useState(false)
  const [showMaintenanceChanges, setShowMaintenanceChanges] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  const toggleProjectExpanded = (projectPath: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectPath)) {
      newExpanded.delete(projectPath)
    } else {
      newExpanded.add(projectPath)
    }
    setExpandedProjects(newExpanded)
  }

  const expandAllProjects = () => {
    const allPaths = previews
      .map(p =>
        selectedProjects.find(sp => sp === (p.detailedChanges?.projectPath || ''))
      )
      .filter(Boolean) as string[]
    setExpandedProjects(new Set(allPaths))
  }

  const collapseAllProjects = () => {
    setExpandedProjects(new Set())
  }

  const projectsWithChangesCount = previews.filter(
    p => p.detailedChanges?.hasChanges
  ).length

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground">Detailed Changes</h4>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailedChanges(!showDetailedChanges)}
          >
            {showDetailedChanges ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Details
              </>
            )}
          </Button>
        </div>
      </div>

      {showDetailedChanges && (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={
                  expandedProjects.size === 0 ? expandAllProjects : collapseAllProjects
                }
              >
                {expandedProjects.size === 0 ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Expand All
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Collapse All
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMaintenanceChanges(!showMaintenanceChanges)}
              >
                {showMaintenanceChanges ? 'Hide' : 'Show'} Maintenance
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              {projectsWithChangesCount} projects with changes
            </span>
          </div>

          {/* Project Details */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {previews.map((preview, index) => {
              if (!preview.detailedChanges) return null

              const projectPath = preview.detailedChanges.projectPath
              const isExpanded = expandedProjects.has(projectPath)

              return (
                <ProjectChangeDetailView
                  key={`${projectPath}-${index}`}
                  changeDetail={preview.detailedChanges}
                  isExpanded={isExpanded}
                  onToggleExpanded={() => toggleProjectExpanded(projectPath)}
                  showMaintenanceChanges={showMaintenanceChanges}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
