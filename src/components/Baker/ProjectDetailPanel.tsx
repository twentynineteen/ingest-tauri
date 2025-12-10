/**
 * Project Detail Panel Component
 *
 * Right panel showing detailed breadcrumbs information with tabs.
 * Part of master-detail layout pattern.
 */

import { formatFileSize } from '@/components/BreadcrumbsViewer/fieldUtils'
import { Button } from '@/components/ui/button'
import type { BreadcrumbsFile, BreadcrumbsPreview } from '@/types/baker'
import { open } from '@tauri-apps/plugin-shell'
import { formatBreadcrumbDateSimple } from '@utils/breadcrumbsComparison'
import {
  AlertTriangle,
  Calendar,
  Camera,
  CreditCard,
  ExternalLink,
  File,
  FolderOpen,
  HardDrive,
  RefreshCw,
  User,
  Video
} from 'lucide-react'
import React, { useRef } from 'react'
import { TrelloCardsManager } from './TrelloCardsManager'
import { VideoLinksManager } from './VideoLinksManager'

interface ProjectDetailPanelProps {
  selectedProject: string | null
  breadcrumbs: BreadcrumbsFile | null
  isLoadingBreadcrumbs: boolean
  breadcrumbsError: string | null
  previewMode: boolean
  preview: BreadcrumbsPreview | null
  onTogglePreview: () => void
  trelloApiKey?: string
  trelloApiToken?: string
}

export const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({
  selectedProject,
  breadcrumbs,
  isLoadingBreadcrumbs,
  breadcrumbsError,
  trelloApiKey,
  trelloApiToken
}) => {
  // Refs must be at the top level (before any conditional returns)
  const overviewRef = useRef<HTMLDivElement>(null)
  const filesRef = useRef<HTMLDivElement>(null)
  const videosRef = useRef<HTMLDivElement>(null)
  const trelloRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const element = ref.current
      const offsetTop = element.offsetTop - container.offsetTop - 16 // 16px padding

      container.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      })
    }
  }

  // Early returns after hooks
  if (!selectedProject) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a project to view details</p>
        </div>
      </div>
    )
  }

  if (isLoadingBreadcrumbs) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading breadcrumbs...</span>
        </div>
      </div>
    )
  }

  if (breadcrumbsError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{breadcrumbsError}</span>
        </div>
      </div>
    )
  }

  if (!breadcrumbs) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No breadcrumbs data found</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground truncate">
          {breadcrumbs.projectTitle}
        </h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {breadcrumbs.parentFolder}
        </p>
      </div>

      {/* Navigation Menu */}
      <div className="border-b border-border px-4 py-2">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollToSection(overviewRef)}
            className="h-8 text-xs"
          >
            <Camera className="h-3 w-3 mr-1.5" />
            Overview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollToSection(filesRef)}
            className="h-8 text-xs"
          >
            <File className="h-3 w-3 mr-1.5" />
            Files ({breadcrumbs.files?.length || 0})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollToSection(videosRef)}
            className="h-8 text-xs"
          >
            <Video className="h-3 w-3 mr-1.5" />
            Videos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollToSection(trelloRef)}
            className="h-8 text-xs"
          >
            <CreditCard className="h-3 w-3 mr-1.5" />
            Trello
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Overview Section */}
        <div ref={overviewRef}>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Camera className="h-4 w-4 mr-2" />
            Overview
          </h4>
          <ProjectOverview breadcrumbs={breadcrumbs} />
        </div>

        {/* Files Section */}
        <div ref={filesRef} className="pt-2">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
            <File className="h-4 w-4 mr-2" />
            Files ({breadcrumbs.files?.length || 0})
          </h4>
          <FilesList files={breadcrumbs.files} />
        </div>

        {/* Video Links Section */}
        <div ref={videosRef} className="pt-2">
          <VideoLinksManager projectPath={selectedProject} />
        </div>

        {/* Trello Cards Section */}
        <div ref={trelloRef} className="pt-2">
          <TrelloCardsManager
            projectPath={selectedProject}
            trelloApiKey={trelloApiKey}
            trelloApiToken={trelloApiToken}
          />
        </div>
      </div>
    </div>
  )
}

// Sub-components

interface ProjectOverviewProps {
  breadcrumbs: BreadcrumbsFile
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ breadcrumbs }) => {
  const formatDate = formatBreadcrumbDateSimple

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center text-xs font-medium text-muted-foreground">
            <Camera className="h-3 w-3 mr-1" />
            Cameras
          </label>
          <p className="text-foreground">{breadcrumbs.numberOfCameras}</p>
        </div>
        <div>
          <label className="flex items-center text-xs font-medium text-muted-foreground">
            <HardDrive className="h-3 w-3 mr-1" />
            Folder Size
          </label>
          <p className="text-foreground">
            {breadcrumbs.folderSizeBytes
              ? formatFileSize(breadcrumbs.folderSizeBytes)
              : 'Unknown'}
          </p>
        </div>
      </div>

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

      {(breadcrumbs.lastModified || breadcrumbs.scannedBy) && (
        <div className="grid grid-cols-2 gap-4">
          {breadcrumbs.lastModified && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Last Modified
              </label>
              <p className="text-foreground">{formatDate(breadcrumbs.lastModified)}</p>
            </div>
          )}
          {breadcrumbs.scannedBy && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Scanned By
              </label>
              <p className="text-foreground">{breadcrumbs.scannedBy}</p>
            </div>
          )}
        </div>
      )}

      {breadcrumbs.trelloCardUrl && (
        <div>
          <label className="flex items-center text-xs font-medium text-muted-foreground mb-2">
            <ExternalLink className="h-3 w-3 mr-1" />
            Legacy Trello Card
          </label>
          <div className="flex items-center gap-2">
            <p className="text-foreground text-xs truncate flex-1">
              {breadcrumbs.trelloCardUrl}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await open(breadcrumbs.trelloCardUrl!)
              }}
              className="text-xs px-2 py-1 h-6 flex-shrink-0"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface FilesListProps {
  files?: Array<{ name: string; path: string; camera: number }>
}

const FilesList: React.FC<FilesListProps> = ({ files }) => {
  if (!files || files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No files recorded in breadcrumbs</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center justify-between bg-background border border-border rounded-lg p-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground truncate">{file.path}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-3">
            <Camera className="h-3.5 w-3.5" />
            <span className="font-medium">{file.camera}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
