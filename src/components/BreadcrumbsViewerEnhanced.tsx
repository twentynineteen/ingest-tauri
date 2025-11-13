/**
 * Enhanced BreadcrumbsViewer Component with Change Preview
 *
 * Displays breadcrumbs.json files with side-by-side preview of changes
 * that Baker will make during updates.
 */

import { open } from '@tauri-apps/plugin-shell'
import {
  Calendar,
  Camera,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FolderOpen,
  HardDrive,
  Minus,
  Plus,
  User
} from 'lucide-react'
import React from 'react'
import type { BreadcrumbsViewerProps, FieldChange } from '../types/baker'
import {
  formatBreadcrumbDateSimple,
  formatFieldValue
} from '../utils/breadcrumbsComparison'
import { TrelloCardsManager } from './Baker/TrelloCardsManager'
import { VideoLinksManager } from './Baker/VideoLinksManager'
import { Button } from './ui/button'

export const BreadcrumbsViewerEnhanced: React.FC<BreadcrumbsViewerProps> = ({
  breadcrumbs,
  projectPath,
  previewMode = false,
  preview,
  onTogglePreview,
  trelloApiKey,
  trelloApiToken
}) => {
  // Use centralized date formatting utility
  const formatDate = formatBreadcrumbDateSimple

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
        return null
    }
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-green-200'
      case 'modified':
        return 'bg-orange-50 border-orange-200'
      case 'removed':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const renderField = (
    label: string,
    value: unknown,
    icon?: React.ReactNode,
    change?: FieldChange
  ) => {
    const changeColor = change ? getChangeColor(change.type) : 'bg-white border-gray-200'
    const changeIcon = change ? getChangeIcon(change.type) : null

    return (
      <div className={`p-2 border rounded ${changeColor}`}>
        <label className="flex items-center text-xs font-medium text-gray-600">
          {changeIcon && <span className="mr-1">{changeIcon}</span>}
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </label>
        <p className="text-gray-900 mt-1">
          {formatFieldValue(value, label.toLowerCase())}
        </p>
      </div>
    )
  }

  const renderPreviewComparison = () => {
    if (!preview || !previewMode) return null

    // Use meaningful diff for summary (what actually matters to user)
    const summaryDiff = preview.meaningfulDiff || preview.diff
    const hasMeaningfulChanges = summaryDiff.hasChanges

    return (
      <div className="space-y-4">
        {/* Summary */}
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

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-gray-700 mb-3 flex items-center">
              <File className="h-4 w-4 mr-2" />
              Current
            </h5>
            <div className="space-y-3">
              {preview.current ? (
                <>
                  {renderField('Project Title', preview.current.projectTitle)}
                  {renderField(
                    'Number of Cameras',
                    preview.current.numberOfCameras,
                    <Camera className="h-3 w-3" />
                  )}
                  {renderField(
                    'Created By',
                    preview.current.createdBy,
                    <User className="h-3 w-3" />
                  )}
                  {renderField(
                    'Creation Date',
                    formatDate(preview.current.creationDateTime),
                    <Calendar className="h-3 w-3" />
                  )}
                  {preview.current.folderSizeBytes &&
                    renderField(
                      'Folder Size',
                      formatFileSize(preview.current.folderSizeBytes),
                      <HardDrive className="h-3 w-3" />
                    )}
                  {preview.current.trelloCardUrl &&
                    renderField(
                      'Trello Card',
                      preview.current.trelloCardUrl,
                      <ExternalLink className="h-3 w-3" />
                    )}
                  {renderField('Files', `${preview.current.files?.length || 0} files`)}
                  {preview.current.lastModified &&
                    renderField(
                      'Last Modified',
                      formatDate(preview.current.lastModified)
                    )}
                  {preview.current.scannedBy &&
                    renderField('Scanned By', preview.current.scannedBy)}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No existing breadcrumbs file</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-700 mb-3 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              After Update
            </h5>
            <div className="space-y-3">
              {preview.diff.changes
                .map((change, index) => {
                  if (change.field === 'projectTitle') {
                    return (
                      <div key={`${change.field}-${index}`}>
                        {renderField('Project Title', change.newValue, null, change)}
                      </div>
                    )
                  }
                  if (change.field === 'numberOfCameras') {
                    return (
                      <div key={`${change.field}-${index}`}>
                        {renderField(
                          'Number of Cameras',
                          change.newValue,
                          <Camera className="h-3 w-3" />,
                          change
                        )}
                      </div>
                    )
                  }
                  if (change.field === 'createdBy') {
                    return (
                      <div key={`${change.field}-${index}`}>
                        {renderField(
                          'Created By',
                          change.newValue,
                          <User className="h-3 w-3" />,
                          change
                        )}
                      </div>
                    )
                  }
                  if (change.field === 'creationDateTime') {
                    return (
                      <div key={`${change.field}-${index}`}>
                        {renderField(
                          'Creation Date',
                          formatDate(change.newValue as string),
                          <Calendar className="h-3 w-3" />,
                          change
                        )}
                      </div>
                    )
                  }
                  if (change.field === 'folderSizeBytes' && change.newValue) {
                    return (
                      <div key={`${change.field}-${index}`}>
                        {renderField(
                          'Folder Size',
                          formatFileSize(change.newValue as number),
                          <HardDrive className="h-3 w-3" />,
                          change
                        )}
                      </div>
                    )
                  }
                  if (change.field === 'trelloCardUrl') {
                    return (
                      <div key={`${change.field}-${index}`}>
                        {renderField(
                          'Trello Card',
                          change.newValue as string,
                          <ExternalLink className="h-3 w-3" />,
                          change
                        )}
                      </div>
                    )
                  }
                  if (change.field === 'files') {
                    const filesArray = change.newValue as Array<unknown>
                    return (
                      <div key={`${change.field}-${index}`}>
                        {renderField(
                          'Files',
                          `${filesArray?.length || 0} files`,
                          null,
                          change
                        )}
                      </div>
                    )
                  }
                  if (change.field === 'lastModified') {
                    return (
                      <div key={`${change.field}-${index}`}>
                        {renderField(
                          'Last Modified',
                          formatDate(change.newValue as string),
                          null,
                          change
                        )}
                      </div>
                    )
                  }
                  if (change.field === 'scannedBy') {
                    return (
                      <div key={`${change.field}-${index}`}>
                        {renderField('Scanned By', change.newValue, null, change)}
                      </div>
                    )
                  }
                  return null
                })
                .filter(Boolean)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderNormalView = () => (
    <div className="space-y-4">
      {/* Project Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center text-xs font-medium text-gray-600">
            Project Title
          </label>
          <p className="text-gray-900">{breadcrumbs.projectTitle}</p>
        </div>
        <div>
          <label className="flex items-center text-xs font-medium text-gray-600">
            <Camera className="h-3 w-3 mr-1" />
            Cameras
          </label>
          <p className="text-gray-900">{breadcrumbs.numberOfCameras}</p>
        </div>
      </div>

      {/* Creation Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center text-xs font-medium text-gray-600">
            <User className="h-3 w-3 mr-1" />
            Created By
          </label>
          <p className="text-gray-900">{breadcrumbs.createdBy}</p>
        </div>
        <div>
          <label className="flex items-center text-xs font-medium text-gray-600">
            <Calendar className="h-3 w-3 mr-1" />
            Created
          </label>
          <p className="text-gray-900">{formatDate(breadcrumbs.creationDateTime)}</p>
        </div>
      </div>

      {/* Folder Size */}
      <div>
        <label className="flex items-center text-xs font-medium text-gray-600">
          <HardDrive className="h-3 w-3 mr-1" />
          Folder Size
        </label>
        <p className="text-gray-900">
          {breadcrumbs.folderSizeBytes
            ? formatFileSize(breadcrumbs.folderSizeBytes)
            : 'Unknown value - update breadcrumb file'}
        </p>
      </div>

      {/* Trello Card URL */}
      {breadcrumbs.trelloCardUrl && (
        <div>
          <label className="flex items-center text-xs font-medium text-gray-600">
            <ExternalLink className="h-3 w-3 mr-1" />
            Trello Card
          </label>
          <div className="flex items-center space-x-2">
            <p className="text-gray-900 text-xs truncate flex-1">
              {breadcrumbs.trelloCardUrl}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (breadcrumbs.trelloCardUrl) {
                  await open(breadcrumbs.trelloCardUrl)
                }
              }}
              className="text-xs px-2 py-1 h-6"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
      )}

      {/* Modification Info */}
      {(breadcrumbs.lastModified || breadcrumbs.scannedBy) && (
        <div className="grid grid-cols-2 gap-4">
          {breadcrumbs.lastModified && (
            <div>
              <label className="text-xs font-medium text-gray-600">Last Modified</label>
              <p className="text-gray-900">{formatDate(breadcrumbs.lastModified)}</p>
            </div>
          )}
          {breadcrumbs.scannedBy && (
            <div>
              <label className="text-xs font-medium text-gray-600">Scanned By</label>
              <p className="text-gray-900">{breadcrumbs.scannedBy}</p>
            </div>
          )}
        </div>
      )}

      {/* Parent Folder */}
      <div>
        <label className="flex items-center text-xs font-medium text-gray-600">
          <FolderOpen className="h-3 w-3 mr-1" />
          Parent Folder
        </label>
        <p className="text-gray-900 text-xs truncate">{breadcrumbs.parentFolder}</p>
      </div>

      {/* Files List */}
      {breadcrumbs.files && breadcrumbs.files.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2">
            Files ({breadcrumbs.files.length})
          </label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {breadcrumbs.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white rounded p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 truncate">{file.path}</p>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Camera className="h-3 w-3 mr-1" />
                  {file.camera}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!breadcrumbs.files || breadcrumbs.files.length === 0) && (
        <div className="text-center py-4 text-gray-500">
          <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No files recorded in breadcrumbs</p>
        </div>
      )}

      {/* Video Links Section - Feature 004 */}
      <div className="border-t pt-4 mt-4">
        <VideoLinksManager projectPath={projectPath} />
      </div>

      {/* Trello Cards Section - Feature 004 */}
      <div className="border-t pt-4 mt-4">
        <TrelloCardsManager
          projectPath={projectPath}
          trelloApiKey={trelloApiKey}
          trelloApiToken={trelloApiToken}
        />
      </div>
    </div>
  )

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4 text-sm">
      <div className="border-b pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 flex items-center">
              <File className="h-4 w-4 mr-2" />
              Breadcrumbs.json
              {previewMode && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Preview Mode
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-500 mt-1">{projectPath}</p>
          </div>
          {onTogglePreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePreview}
              className="flex items-center"
            >
              {previewMode ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {previewMode && preview ? renderPreviewComparison() : renderNormalView()}
    </div>
  )
}
