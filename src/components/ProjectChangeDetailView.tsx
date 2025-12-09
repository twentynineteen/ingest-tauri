/**
 * Project Change Detail View Component
 *
 * Displays detailed field-by-field changes for a single project
 * with categorization and before/after value comparison.
 */

import type { DetailedFieldChange, ProjectChangeDetail } from '@/types/baker'
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Clock,
  Edit,
  File,
  FolderOpen,
  HardDrive,
  Info,
  Minus,
  Plus,
  User
} from 'lucide-react'
import React, { useState } from 'react'

interface ProjectChangeDetailViewProps {
  changeDetail: ProjectChangeDetail
  isExpanded?: boolean
  onToggleExpanded?: () => void
  showMaintenanceChanges?: boolean
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

const getFieldIcon = (field: string) => {
  switch (field) {
    case 'files':
      return <File className="h-4 w-4 text-info" />
    case 'numberOfCameras':
      return <Camera className="h-4 w-4 text-accent-foreground" />
    case 'projectTitle':
      return <FolderOpen className="h-4 w-4 text-success" />
    case 'folderSizeBytes':
      return <HardDrive className="h-4 w-4 text-muted-foreground" />
    case 'createdBy':
    case 'scannedBy':
      return <User className="h-4 w-4 text-primary" />
    case 'creationDateTime':
    case 'lastModified':
      return <Clock className="h-4 w-4 text-warning" />
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />
  }
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'text-destructive bg-destructive/10 border-destructive/20'
    case 'medium':
      return 'text-warning bg-warning/10 border-warning/20'
    case 'low':
      return 'text-foreground bg-muted border-border'
    default:
      return 'text-foreground bg-muted border-border'
  }
}

const FieldChangeItem: React.FC<{ change: DetailedFieldChange }> = ({ change }) => {
  // Use neutral styling for unchanged fields, impact-based styling for actual changes
  const containerClass =
    change.type === 'unchanged'
      ? 'text-foreground bg-muted border-border'
      : getImpactColor(change.impact)

  return (
    <div className={`border rounded-lg p-3 ${containerClass}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getFieldIcon(change.field)}
          <span className="font-medium text-sm">{change.fieldDisplayName}</span>
          {getChangeIcon(change.type)}
        </div>
        {/* Only show impact badge for actual changes, not unchanged fields */}
        {change.type !== 'unchanged' && (
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              change.impact === 'high'
                ? 'bg-destructive/20 text-destructive'
                : change.impact === 'medium'
                  ? 'bg-warning/20 text-warning'
                  : 'bg-muted text-foreground'
            }`}
          >
            {change.impact}
          </span>
        )}
      </div>

      {change.type === 'added' && (
        <div className="text-sm">
          <span className="text-muted-foreground">New value: </span>
          <span className="font-mono bg-success/20 text-success px-2 py-1 rounded">
            {change.formattedNewValue}
          </span>
        </div>
      )}

      {change.type === 'removed' && (
        <div className="text-sm">
          <span className="text-muted-foreground">Removed value: </span>
          <span className="font-mono bg-destructive/20 text-destructive px-2 py-1 rounded line-through">
            {change.formattedOldValue}
          </span>
        </div>
      )}

      {change.type === 'modified' && (
        <div className="text-sm space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground flex-shrink-0">From:</span>
            <span className="font-mono bg-destructive/20 px-2 py-1 rounded text-destructive line-through">
              {change.formattedOldValue}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 ml-8" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground flex-shrink-0">To:</span>
            <span className="font-mono bg-success/20 px-2 py-1 rounded text-success ml-4">
              {change.formattedNewValue}
            </span>
          </div>
        </div>
      )}

      {change.type === 'unchanged' && (
        <div className="text-sm">
          <span className="text-muted-foreground">Current value: </span>
          <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">
            {change.formattedOldValue}
          </span>
        </div>
      )}
    </div>
  )
}

const CategorySection: React.FC<{
  title: string
  changes: DetailedFieldChange[]
  icon: React.ReactNode
  colorClass: string
}> = ({ title, changes, icon, colorClass }) => {
  const [isExpanded, setIsExpanded] = useState(true)

  if (changes.length === 0) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${colorClass} hover:opacity-80 transition-opacity`}
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium">{title}</span>
          <span className="bg-white bg-opacity-80 px-2 py-1 rounded-full text-xs font-semibold">
            {changes.length}
          </span>
        </div>
        <div
          className={`transform transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
        >
          <ArrowRight className="h-4 w-4" />
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3 bg-card">
          {changes.map((change, index) => (
            <FieldChangeItem key={`${change.field}-${index}`} change={change} />
          ))}
        </div>
      )}
    </div>
  )
}

export const ProjectChangeDetailView: React.FC<ProjectChangeDetailViewProps> = ({
  changeDetail,
  isExpanded = false,
  onToggleExpanded,
  showMaintenanceChanges = false
}) => {
  if (!changeDetail.hasChanges) {
    return (
      <div className="border rounded-lg p-4 bg-success/10 border-success/20">
        <div className="flex items-center space-x-2 text-success">
          <Info className="h-4 w-4" />
          <span className="font-medium">{changeDetail.projectName}</span>
          <span>- No changes required</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Project Header */}
      <div className="bg-muted px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {changeDetail.projectName}
            </span>
            {changeDetail.summary.contentChanges > 0 && (
              <AlertCircle className="h-4 w-4 text-warning" />
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{changeDetail.summary.totalChanges} changes</span>
            {onToggleExpanded && (
              <button onClick={onToggleExpanded} className="text-info hover:text-info/80">
                {isExpanded ? 'Hide Details' : 'Show Details'}
              </button>
            )}
          </div>
        </div>

        {/* Summary Pills */}
        <div className="flex items-center space-x-2 mt-2">
          {changeDetail.summary.contentChanges > 0 && (
            <span className="bg-destructive/20 text-destructive px-2 py-1 rounded-full text-xs font-medium">
              {changeDetail.summary.contentChanges} content
            </span>
          )}
          {changeDetail.summary.metadataChanges > 0 && (
            <span className="bg-warning/20 text-warning px-2 py-1 rounded-full text-xs font-medium">
              {changeDetail.summary.metadataChanges} metadata
            </span>
          )}
          {changeDetail.summary.maintenanceChanges > 0 && showMaintenanceChanges && (
            <span className="bg-muted text-foreground px-2 py-1 rounded-full text-xs font-medium">
              {changeDetail.summary.maintenanceChanges} maintenance
            </span>
          )}
        </div>
      </div>

      {/* Detailed Changes */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <CategorySection
            title="Content Changes"
            changes={changeDetail.changeCategories.content}
            icon={<AlertCircle className="h-4 w-4" />}
            colorClass="bg-destructive/20 text-destructive"
          />

          <CategorySection
            title="Metadata Changes"
            changes={changeDetail.changeCategories.metadata}
            icon={<Info className="h-4 w-4" />}
            colorClass="bg-warning/20 text-warning"
          />

          {showMaintenanceChanges && (
            <CategorySection
              title="Maintenance Changes"
              changes={changeDetail.changeCategories.maintenance}
              icon={<Clock className="h-4 w-4" />}
              colorClass="bg-muted text-foreground"
            />
          )}
        </div>
      )}
    </div>
  )
}
