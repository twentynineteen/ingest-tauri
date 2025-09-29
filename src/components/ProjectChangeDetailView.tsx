/**
 * Project Change Detail View Component
 *
 * Displays detailed field-by-field changes for a single project
 * with categorization and before/after value comparison.
 */

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
import type { DetailedFieldChange, ProjectChangeDetail } from '../types/baker'

interface ProjectChangeDetailViewProps {
  changeDetail: ProjectChangeDetail
  isExpanded?: boolean
  onToggleExpanded?: () => void
  showMaintenanceChanges?: boolean
}

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'added':
      return <Plus className="h-3 w-3 text-green-600" />
    case 'modified':
      return <Edit className="h-3 w-3 text-orange-600" />
    case 'removed':
      return <Minus className="h-3 w-3 text-red-600" />
    default:
      return <Info className="h-3 w-3 text-gray-600" />
  }
}

const getFieldIcon = (field: string) => {
  switch (field) {
    case 'files':
      return <File className="h-4 w-4 text-blue-600" />
    case 'numberOfCameras':
      return <Camera className="h-4 w-4 text-purple-600" />
    case 'projectTitle':
      return <FolderOpen className="h-4 w-4 text-green-600" />
    case 'folderSizeBytes':
      return <HardDrive className="h-4 w-4 text-gray-600" />
    case 'createdBy':
    case 'scannedBy':
      return <User className="h-4 w-4 text-indigo-600" />
    case 'creationDateTime':
    case 'lastModified':
      return <Clock className="h-4 w-4 text-orange-600" />
    default:
      return <Info className="h-4 w-4 text-gray-500" />
  }
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'text-red-700 bg-red-50 border-red-200'
    case 'medium':
      return 'text-orange-700 bg-orange-50 border-orange-200'
    case 'low':
      return 'text-gray-700 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200'
  }
}

const FieldChangeItem: React.FC<{ change: DetailedFieldChange }> = ({ change }) => {
  // Use neutral styling for unchanged fields, impact-based styling for actual changes
  const containerClass = change.type === 'unchanged' 
    ? 'text-gray-700 bg-gray-50 border-gray-200'
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
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            change.impact === 'high' 
              ? 'bg-red-100 text-red-800' 
              : change.impact === 'medium' 
              ? 'bg-orange-100 text-orange-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {change.impact}
          </span>
        )}
      </div>
      
      {change.type === 'added' && (
        <div className="text-sm">
          <span className="text-gray-600">New value: </span>
          <span className="font-mono bg-green-100 px-2 py-1 rounded">
            {change.formattedNewValue}
          </span>
        </div>
      )}
      
      {change.type === 'removed' && (
        <div className="text-sm">
          <span className="text-gray-600">Removed value: </span>
          <span className="font-mono bg-red-100 px-2 py-1 rounded line-through">
            {change.formattedOldValue}
          </span>
        </div>
      )}
      
      {change.type === 'modified' && (
        <div className="text-sm space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 flex-shrink-0">From:</span>
            <span className="font-mono bg-red-100 px-2 py-1 rounded text-red-800 line-through">
              {change.formattedOldValue}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0 ml-8" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 flex-shrink-0">To:</span>
            <span className="font-mono bg-green-100 px-2 py-1 rounded text-green-800 ml-4">
              {change.formattedNewValue}
            </span>
          </div>
        </div>
      )}
      
      {change.type === 'unchanged' && (
        <div className="text-sm">
          <span className="text-gray-600">Current value: </span>
          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
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
        <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
          <ArrowRight className="h-4 w-4" />
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white">
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
      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
        <div className="flex items-center space-x-2 text-green-800">
          <Info className="h-4 w-4" />
          <span className="font-medium">{changeDetail.projectName}</span>
          <span className="text-green-600">- No changes required</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Project Header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">{changeDetail.projectName}</span>
            {changeDetail.summary.contentChanges > 0 && (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{changeDetail.summary.totalChanges} changes</span>
            {onToggleExpanded && (
              <button
                onClick={onToggleExpanded}
                className="text-blue-600 hover:text-blue-800"
              >
                {isExpanded ? 'Hide Details' : 'Show Details'}
              </button>
            )}
          </div>
        </div>
        
        {/* Summary Pills */}
        <div className="flex items-center space-x-2 mt-2">
          {changeDetail.summary.contentChanges > 0 && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
              {changeDetail.summary.contentChanges} content
            </span>
          )}
          {changeDetail.summary.metadataChanges > 0 && (
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
              {changeDetail.summary.metadataChanges} metadata
            </span>
          )}
          {changeDetail.summary.maintenanceChanges > 0 && showMaintenanceChanges && (
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
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
            colorClass="bg-red-100 text-red-800"
          />
          
          <CategorySection
            title="Metadata Changes"
            changes={changeDetail.changeCategories.metadata}
            icon={<Info className="h-4 w-4" />}
            colorClass="bg-orange-100 text-orange-800"
          />
          
          {showMaintenanceChanges && (
            <CategorySection
              title="Maintenance Changes"
              changes={changeDetail.changeCategories.maintenance}
              icon={<Clock className="h-4 w-4" />}
              colorClass="bg-gray-100 text-gray-800"
            />
          )}
        </div>
      )}
    </div>
  )
}