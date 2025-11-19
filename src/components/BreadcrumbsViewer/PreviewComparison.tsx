/**
 * PreviewComparison - Side-by-side comparison of current vs updated breadcrumbs
 * Extracted from BreadcrumbsViewerEnhanced.tsx (DEBT-002)
 */

import {
  Calendar,
  Camera,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  File,
  HardDrive,
  Minus,
  Plus,
  User
} from 'lucide-react'
import React from 'react'
import type { BreadcrumbsPreview, FieldChange } from '../../types/baker'
import { formatBreadcrumbDateSimple } from '../../utils/breadcrumbsComparison'
import { Field, formatFileSize } from './fieldUtils'

interface PreviewComparisonProps {
  preview: BreadcrumbsPreview
}

export const PreviewComparison: React.FC<PreviewComparisonProps> = ({ preview }) => {
  const formatDate = formatBreadcrumbDateSimple

  // Use meaningful diff for summary (what actually matters to user)
  const summaryDiff = preview.meaningfulDiff || preview.diff
  const hasMeaningfulChanges = summaryDiff.hasChanges

  return (
    <div className="space-y-4">
      {/* Summary */}
      <ChangeSummary summaryDiff={summaryDiff} hasMeaningfulChanges={hasMeaningfulChanges} />

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-4">
        <CurrentView current={preview.current} formatDate={formatDate} />
        <AfterUpdateView changes={preview.diff.changes} formatDate={formatDate} />
      </div>
    </div>
  )
}

// Sub-components

interface ChangeSummaryProps {
  summaryDiff: {
    hasChanges: boolean
    summary: { added: number; modified: number; removed: number }
  }
  hasMeaningfulChanges: boolean
}

const ChangeSummary: React.FC<ChangeSummaryProps> = ({ summaryDiff, hasMeaningfulChanges }) => (
  <div
    className={`border rounded-lg p-3 ${hasMeaningfulChanges ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}
  >
    <h5
      className={`font-medium mb-2 ${hasMeaningfulChanges ? 'text-blue-900' : 'text-green-900'}`}
    >
      Change Summary
    </h5>
    <div
      className={`text-sm space-y-1 ${hasMeaningfulChanges ? 'text-blue-800' : 'text-green-800'}`}
    >
      {hasMeaningfulChanges ? (
        <>
          {summaryDiff.summary.added > 0 && (
            <div className="flex items-center">
              <Plus className="h-3 w-3 text-green-600 mr-1" />
              {summaryDiff.summary.added} fields will be added
            </div>
          )}
          {summaryDiff.summary.modified > 0 && (
            <div className="flex items-center">
              <Edit className="h-3 w-3 text-orange-600 mr-1" />
              {summaryDiff.summary.modified} fields will be modified
            </div>
          )}
          {summaryDiff.summary.removed > 0 && (
            <div className="flex items-center">
              <Minus className="h-3 w-3 text-red-600 mr-1" />
              {summaryDiff.summary.removed} fields will be removed
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          No meaningful changes required - only maintenance updates
        </div>
      )}
    </div>
  </div>
)

interface CurrentViewProps {
  current: BreadcrumbsPreview['current']
  formatDate: (date: string) => string
}

const CurrentView: React.FC<CurrentViewProps> = ({ current, formatDate }) => (
  <div>
    <h5 className="font-medium text-gray-700 mb-3 flex items-center">
      <File className="h-4 w-4 mr-2" />
      Current
    </h5>
    <div className="space-y-3">
      {current ? (
        <>
          <Field label="Project Title" value={current.projectTitle} />
          <Field
            label="Number of Cameras"
            value={current.numberOfCameras}
            icon={<Camera className="h-3 w-3" />}
          />
          <Field
            label="Created By"
            value={current.createdBy}
            icon={<User className="h-3 w-3" />}
          />
          <Field
            label="Creation Date"
            value={formatDate(current.creationDateTime)}
            icon={<Calendar className="h-3 w-3" />}
          />
          {current.folderSizeBytes && (
            <Field
              label="Folder Size"
              value={formatFileSize(current.folderSizeBytes)}
              icon={<HardDrive className="h-3 w-3" />}
            />
          )}
          {current.trelloCardUrl && (
            <Field
              label="Trello Card"
              value={current.trelloCardUrl}
              icon={<ExternalLink className="h-3 w-3" />}
            />
          )}
          <Field label="Files" value={`${current.files?.length || 0} files`} />
          {current.lastModified && (
            <Field label="Last Modified" value={formatDate(current.lastModified)} />
          )}
          {current.scannedBy && <Field label="Scanned By" value={current.scannedBy} />}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No existing breadcrumbs file</p>
        </div>
      )}
    </div>
  </div>
)

interface AfterUpdateViewProps {
  changes: FieldChange[]
  formatDate: (date: string) => string
}

const AfterUpdateView: React.FC<AfterUpdateViewProps> = ({ changes, formatDate }) => {
  const renderChange = (change: FieldChange, index: number) => {
    const key = `${change.field}-${index}`

    switch (change.field) {
      case 'projectTitle':
        return <Field key={key} label="Project Title" value={change.newValue} change={change} />
      case 'numberOfCameras':
        return (
          <Field
            key={key}
            label="Number of Cameras"
            value={change.newValue}
            icon={<Camera className="h-3 w-3" />}
            change={change}
          />
        )
      case 'createdBy':
        return (
          <Field
            key={key}
            label="Created By"
            value={change.newValue}
            icon={<User className="h-3 w-3" />}
            change={change}
          />
        )
      case 'creationDateTime':
        return (
          <Field
            key={key}
            label="Creation Date"
            value={formatDate(change.newValue as string)}
            icon={<Calendar className="h-3 w-3" />}
            change={change}
          />
        )
      case 'folderSizeBytes':
        if (!change.newValue) return null
        return (
          <Field
            key={key}
            label="Folder Size"
            value={formatFileSize(change.newValue as number)}
            icon={<HardDrive className="h-3 w-3" />}
            change={change}
          />
        )
      case 'trelloCardUrl':
        return (
          <Field
            key={key}
            label="Trello Card"
            value={change.newValue as string}
            icon={<ExternalLink className="h-3 w-3" />}
            change={change}
          />
        )
      case 'files': {
        const filesArray = change.newValue as Array<unknown>
        return (
          <Field
            key={key}
            label="Files"
            value={`${filesArray?.length || 0} files`}
            change={change}
          />
        )
      }
      case 'lastModified':
        return (
          <Field
            key={key}
            label="Last Modified"
            value={formatDate(change.newValue as string)}
            change={change}
          />
        )
      case 'scannedBy':
        return <Field key={key} label="Scanned By" value={change.newValue} change={change} />
      default:
        return null
    }
  }

  return (
    <div>
      <h5 className="font-medium text-gray-700 mb-3 flex items-center">
        <Eye className="h-4 w-4 mr-2" />
        After Update
      </h5>
      <div className="space-y-3">{changes.map(renderChange).filter(Boolean)}</div>
    </div>
  )
}
