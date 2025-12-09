/**
 * Project List Panel Component
 *
 * Compact left panel showing list of projects for selection.
 * Part of master-detail layout pattern.
 *
 * Animations:
 * - Staggered entrance animation when projects load
 * - Smooth hover effects on project rows
 * - Selection state transitions
 * - Pulse animation for warning badges
 */

import type { ProjectFolder } from '@/types/baker'
import React from 'react'
import { motion } from 'framer-motion'
import { BAKER_ANIMATIONS } from '@/constants/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// Utility function for conditional class names
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ')
}

interface ProjectListPanelProps {
  projects: ProjectFolder[]
  selectedProjects: string[]
  selectedProject: string | null
  onProjectSelection: (projectPath: string, isSelected: boolean) => void
  onProjectClick: (projectPath: string) => void
}

export const ProjectListPanel: React.FC<ProjectListPanelProps> = ({
  projects,
  selectedProjects,
  selectedProject,
  onProjectSelection,
  onProjectClick
}) => {
  const shouldReduceMotion = useReducedMotion()

  if (projects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        No projects found
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
          3
        </div>
        <h2 className="text-sm font-semibold text-foreground">
          Found Projects ({projects.length})
        </h2>
      </div>

      <motion.div
        className="flex-1 overflow-y-auto"
        variants={shouldReduceMotion ? undefined : BAKER_ANIMATIONS.projectList.container}
        initial={shouldReduceMotion ? false : 'hidden'}
        animate={shouldReduceMotion ? false : 'show'}
      >
        {projects.map((project: ProjectFolder) => {
          const isSelected = selectedProject === project.path
          const isChecked = selectedProjects.includes(project.path)

          return (
            <motion.div
              key={project.path}
              variants={shouldReduceMotion ? undefined : BAKER_ANIMATIONS.projectList.item}
              className={cn(
                'border-b border-border p-3 cursor-pointer transition-colors',
                'hover:bg-accent/50',
                isSelected && 'bg-accent'
              )}
              onClick={() => onProjectClick(project.path)}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: BAKER_ANIMATIONS.projectRow.hover.scale
                    }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      duration: BAKER_ANIMATIONS.projectRow.hover.duration / 1000
                    }
              }
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={e => {
                    e.stopPropagation()
                    onProjectSelection(project.path, e.target.checked)
                  }}
                  onClick={e => e.stopPropagation()}
                  className="mt-0.5 flex-shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="font-medium text-sm truncate">{project.name}</p>

                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                        project.isValid
                          ? 'bg-success/20 text-success'
                          : 'bg-destructive/20 text-destructive'
                      )}
                    >
                      {project.isValid ? 'Valid' : 'Invalid'}
                    </span>

                    {project.invalidBreadcrumbs && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-destructive/20 text-destructive">
                        Invalid BC
                      </span>
                    )}

                    {project.hasBreadcrumbs && !project.invalidBreadcrumbs && (
                      <motion.span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                          project.staleBreadcrumbs
                            ? 'bg-warning/20 text-warning'
                            : 'bg-success/20 text-success'
                        )}
                        animate={
                          shouldReduceMotion || !project.staleBreadcrumbs
                            ? undefined
                            : {
                                scale: BAKER_ANIMATIONS.statusBadge.pulse.scale
                              }
                        }
                        transition={
                          shouldReduceMotion || !project.staleBreadcrumbs
                            ? undefined
                            : BAKER_ANIMATIONS.statusBadge.pulse.transition
                        }
                      >
                        {project.staleBreadcrumbs ? 'Stale' : 'Current'}
                      </motion.span>
                    )}

                    {!project.hasBreadcrumbs && !project.invalidBreadcrumbs && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        No BC
                      </span>
                    )}

                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {project.cameraCount} cam{project.cameraCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
