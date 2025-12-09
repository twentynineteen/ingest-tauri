/**
 * Project List Component
 *
 * Displays list of discovered projects with selection and breadcrumb viewing.
 */

import { BreadcrumbsViewerEnhanced } from '@components/BreadcrumbsViewerEnhanced'
import { Button } from '@components/ui/button'
import { AlertTriangle, Eye, RefreshCw } from 'lucide-react'
import React from 'react'
import type {
  BreadcrumbsFile,
  BreadcrumbsPreview,
  ProjectFolder
} from '@/types/baker'

interface ProjectListProps {
  projects: ProjectFolder[]
  selectedProjects: string[]
  onProjectSelection: (projectPath: string, isSelected: boolean) => void
  onViewBreadcrumbs: (projectPath: string) => void
  onTogglePreview: (projectPath: string) => void
  expandedProject: string | null
  previewProject: string | null
  breadcrumbs: BreadcrumbsFile | null
  isLoadingBreadcrumbs: boolean
  breadcrumbsError: string | null
  getPreview: (projectPath: string) => BreadcrumbsPreview | null
  trelloApiKey?: string
  trelloApiToken?: string
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProjects,
  onProjectSelection,
  onViewBreadcrumbs,
  onTogglePreview,
  expandedProject,
  previewProject,
  breadcrumbs,
  isLoadingBreadcrumbs,
  breadcrumbsError,
  getPreview,
  trelloApiKey,
  trelloApiToken
}) => {
  if (projects.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        No projects found
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-medium">Found Projects ({projects.length})</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {projects.map((project: ProjectFolder) => (
          <div key={project.path} className="border rounded">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(project.path)}
                  onChange={e => onProjectSelection(project.path, e.target.checked)}
                />
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-md">
                    {project.path}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded ${project.isValid ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}
                  >
                    {project.isValid ? 'Valid' : 'Invalid'}
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${
                      project.invalidBreadcrumbs
                        ? 'bg-destructive/20 text-destructive'
                        : project.hasBreadcrumbs
                          ? 'bg-info/20 text-info'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {project.invalidBreadcrumbs
                      ? 'Invalid breadcrumbs'
                      : project.hasBreadcrumbs
                        ? 'Has breadcrumbs'
                        : 'Missing breadcrumbs'}
                  </span>
                  {project.hasBreadcrumbs && (
                    <span
                      className={`px-2 py-1 rounded ${project.staleBreadcrumbs ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}
                    >
                      {project.staleBreadcrumbs ? 'Stale breadcrumbs' : 'Up to date'}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                    {project.cameraCount} camera{project.cameraCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {(project.hasBreadcrumbs || project.invalidBreadcrumbs) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewBreadcrumbs(project.path)}
                    className="ml-2"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {expandedProject === project.path
                      ? 'Hide'
                      : project.invalidBreadcrumbs
                        ? 'View (Corrupted)'
                        : 'View'}
                  </Button>
                )}
              </div>
            </div>

            {/* Breadcrumbs Viewer */}
            {expandedProject === project.path && (
              <div className="border-t p-3">
                {isLoadingBreadcrumbs ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">
                      Loading breadcrumbs...
                    </span>
                  </div>
                ) : breadcrumbsError ? (
                  <div className="flex items-center justify-center py-4 text-destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="text-sm">{breadcrumbsError}</span>
                  </div>
                ) : breadcrumbs ? (
                  <BreadcrumbsViewerEnhanced
                    breadcrumbs={breadcrumbs}
                    projectPath={project.path}
                    previewMode={previewProject === project.path}
                    preview={getPreview(project.path)}
                    onTogglePreview={() => onTogglePreview(project.path)}
                    trelloApiKey={trelloApiKey}
                    trelloApiToken={trelloApiToken}
                  />
                ) : (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <span className="text-sm">No breadcrumbs data found</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
