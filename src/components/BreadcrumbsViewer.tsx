/**
 * BreadcrumbsViewer Component
 *
 * Displays the contents of a breadcrumbs.json file in a readable format.
 */

import {
  Calendar,
  Camera,
  Eye,
  EyeOff,
  File,
  FolderOpen,
  HardDrive,
  User
} from 'lucide-react'
import React from 'react'
import type { BreadcrumbsViewerProps } from '@/types/baker'
import { formatBreadcrumbDateSimple } from '@utils/breadcrumbsComparison'
import { Button } from './ui/button'

export const BreadcrumbsViewer: React.FC<BreadcrumbsViewerProps> = ({
  breadcrumbs,
  projectPath,
  previewMode = false,
  onTogglePreview
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

  return (
    <div className="bg-muted rounded-lg p-4 space-y-4 text-sm">
      <div className="border-b pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-foreground flex items-center">
              <File className="h-4 w-4 mr-2" />
              Breadcrumbs.json
              {previewMode && (
                <span className="ml-2 text-xs bg-info/10 text-info px-2 py-1 rounded">
                  Preview Mode
                </span>
              )}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">{projectPath}</p>
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

      {/* Project Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground">
            Project Title
          </label>
          <p className="text-foreground">{breadcrumbs.projectTitle}</p>
        </div>
        <div>
          <label className="flex items-center text-xs font-medium text-muted-foreground">
            <Camera className="h-3 w-3 mr-1" />
            Cameras
          </label>
          <p className="text-foreground">{breadcrumbs.numberOfCameras}</p>
        </div>
      </div>

      {/* Creation Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center text-xs font-medium text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            Created By
          </label>
          <p className="text-foreground">{breadcrumbs.createdBy}</p>
        </div>
        <div>
          <label className="flex items-center text-xs font-medium text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            Created
          </label>
          <p className="text-foreground">{formatDate(breadcrumbs.creationDateTime)}</p>
        </div>
      </div>

      {/* Folder Size */}
      <div>
        <label className="flex items-center text-xs font-medium text-muted-foreground">
          <HardDrive className="h-3 w-3 mr-1" />
          Folder Size
        </label>
        <p className="text-foreground">
          {breadcrumbs.folderSizeBytes
            ? formatFileSize(breadcrumbs.folderSizeBytes)
            : 'Unknown value - update breadcrumb file'}
        </p>
      </div>

      {/* Modification Info */}
      {(breadcrumbs.lastModified || breadcrumbs.scannedBy) && (
        <div className="grid grid-cols-2 gap-4">
          {breadcrumbs.lastModified && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Last Modified
              </label>
              <p className="text-foreground">{formatDate(breadcrumbs.lastModified)}</p>
            </div>
          )}
          {breadcrumbs.scannedBy && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Scanned By
              </label>
              <p className="text-foreground">{breadcrumbs.scannedBy}</p>
            </div>
          )}
        </div>
      )}

      {/* Parent Folder */}
      <div>
        <label className="flex items-center text-xs font-medium text-muted-foreground">
          <FolderOpen className="h-3 w-3 mr-1" />
          Parent Folder
        </label>
        <p className="text-foreground text-xs truncate">{breadcrumbs.parentFolder}</p>
      </div>

      {/* Files List */}
      {breadcrumbs.files && breadcrumbs.files.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Files ({breadcrumbs.files.length})
          </label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {breadcrumbs.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-background rounded p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Camera className="h-3 w-3 mr-1" />
                  {file.camera}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!breadcrumbs.files || breadcrumbs.files.length === 0) && (
        <div className="text-center py-4 text-muted-foreground">
          <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No files recorded in breadcrumbs</p>
        </div>
      )}
    </div>
  )
}
