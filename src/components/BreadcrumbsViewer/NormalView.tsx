/**
 * NormalView - Standard breadcrumbs display (non-preview mode)
 * Extracted from BreadcrumbsViewerEnhanced.tsx (DEBT-002)
 */

import { open } from '@tauri-apps/plugin-shell'
import {
  Calendar,
  Camera,
  ExternalLink,
  File,
  FolderOpen,
  HardDrive,
  User
} from 'lucide-react'
import React from 'react'
import type { BreadcrumbsFile } from '@/types/baker'
import { formatBreadcrumbDateSimple } from '@utils/breadcrumbsComparison'
import { TrelloCardsManager } from '../Baker/TrelloCardsManager'
import { VideoLinksManager } from '../Baker/VideoLinksManager'
import { Button } from '../ui/button'
import { formatFileSize } from './fieldUtils'

interface NormalViewProps {
  breadcrumbs: BreadcrumbsFile
  projectPath: string
  trelloApiKey?: string
  trelloApiToken?: string
}

export const NormalView: React.FC<NormalViewProps> = ({
  breadcrumbs,
  projectPath,
  trelloApiKey,
  trelloApiToken
}) => {
  const formatDate = formatBreadcrumbDateSimple

  return (
    <div className="space-y-4">
      {/* Project Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center text-xs font-medium text-muted-foreground">
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

      {/* Trello Card URL */}
      {breadcrumbs.trelloCardUrl && <TrelloCardLink url={breadcrumbs.trelloCardUrl} />}

      {/* Modification Info */}
      {(breadcrumbs.lastModified || breadcrumbs.scannedBy) && (
        <ModificationInfo
          lastModified={breadcrumbs.lastModified}
          scannedBy={breadcrumbs.scannedBy}
          formatDate={formatDate}
        />
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
      <FilesList files={breadcrumbs.files} />

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
}

// Sub-components

interface TrelloCardLinkProps {
  url: string
}

const TrelloCardLink: React.FC<TrelloCardLinkProps> = ({ url }) => (
  <div>
    <label className="flex items-center text-xs font-medium text-muted-foreground">
      <ExternalLink className="h-3 w-3 mr-1" />
      Trello Card
    </label>
    <div className="flex items-center space-x-2">
      <p className="text-foreground text-xs truncate flex-1">{url}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await open(url)
        }}
        className="text-xs px-2 py-1 h-6"
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Open
      </Button>
    </div>
  </div>
)

interface ModificationInfoProps {
  lastModified?: string
  scannedBy?: string
  formatDate: (date: string) => string
}

const ModificationInfo: React.FC<ModificationInfoProps> = ({
  lastModified,
  scannedBy,
  formatDate
}) => (
  <div className="grid grid-cols-2 gap-4">
    {lastModified && (
      <div>
        <label className="text-xs font-medium text-muted-foreground">Last Modified</label>
        <p className="text-foreground">{formatDate(lastModified)}</p>
      </div>
    )}
    {scannedBy && (
      <div>
        <label className="text-xs font-medium text-muted-foreground">Scanned By</label>
        <p className="text-foreground">{scannedBy}</p>
      </div>
    )}
  </div>
)

interface FilesListProps {
  files?: Array<{ name: string; path: string; camera: number }>
}

const FilesList: React.FC<FilesListProps> = ({ files }) => {
  if (!files || files.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No files recorded in breadcrumbs</p>
      </div>
    )
  }

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2">
        Files ({files.length})
      </label>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white rounded p-2"
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
  )
}
