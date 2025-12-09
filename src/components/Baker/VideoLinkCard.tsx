/**
 * VideoLinkCard - Displays a single video link with thumbnail and actions
 * Feature: 004-embed-multiple-video
 */

import { Button } from '@/components/ui/button'
import type { VideoLink } from '@/types/baker'
import { logger } from '@/utils/logger'
import { openUrl } from '@tauri-apps/plugin-opener'
import { ChevronDown, ChevronUp, ExternalLink, Trash2, Video } from 'lucide-react'

interface VideoLinkCardProps {
  videoLink: VideoLink
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export function VideoLinkCard({
  videoLink,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: VideoLinkCardProps) {
  const formatDate = (isoDate?: string) => {
    if (!isoDate) return null
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const openInBrowser = async () => {
    try {
      await openUrl(videoLink.url)
    } catch (error) {
      logger.error('Failed to open video URL:', error)
    }
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md group">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-muted">
        {videoLink.thumbnailUrl ? (
          <img
            src={videoLink.thumbnailUrl}
            alt={videoLink.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Action buttons overlay */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="h-7 w-7 bg-background/90 backdrop-blur-sm"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="h-7 w-7 bg-background/90 backdrop-blur-sm"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onRemove}
            className="h-7 w-7 bg-destructive/90 text-destructive-foreground backdrop-blur-sm hover:bg-destructive"
            title="Remove video"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 space-y-2">
        <h3 className="font-medium text-sm text-foreground line-clamp-2" title={videoLink.title}>
          {videoLink.title}
        </h3>

        {videoLink.sproutVideoId && (
          <p className="text-xs text-muted-foreground">
            ID: {videoLink.sproutVideoId}
          </p>
        )}

        <div className="space-y-1 text-xs text-muted-foreground">
          {videoLink.uploadDate && (
            <p>Uploaded: {formatDate(videoLink.uploadDate)}</p>
          )}
          {videoLink.sourceRenderFile && (
            <p className="truncate" title={videoLink.sourceRenderFile}>
              Source: {videoLink.sourceRenderFile}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={openInBrowser}
          className="w-full h-8 text-xs mt-2"
        >
          <ExternalLink className="mr-1.5 h-3 w-3" />
          Open in Sprout Video
        </Button>
      </div>
    </div>
  )
}
