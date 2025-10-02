/**
 * VideoLinkCard - Displays a single video link with thumbnail and actions
 * Feature: 004-embed-multiple-video
 */

import { ExternalLink, Trash2, ChevronUp, ChevronDown, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { openUrl } from '@tauri-apps/plugin-opener'
import type { VideoLink } from '../../types/baker'

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
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const openInBrowser = async () => {
    try {
      await openUrl(videoLink.url)
    } catch (error) {
      console.error('Failed to open video URL:', error)
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {videoLink.thumbnailUrl ? (
          <img
            src={videoLink.thumbnailUrl}
            alt={videoLink.title}
            className="h-20 w-32 rounded object-cover"
          />
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded bg-gray-100">
            <Video className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{videoLink.title}</h3>

        {videoLink.sproutVideoId && (
          <p className="text-sm text-gray-500 mt-1">ID: {videoLink.sproutVideoId}</p>
        )}

        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          {videoLink.uploadDate && (
            <span>Uploaded: {formatDate(videoLink.uploadDate)}</span>
          )}
          {videoLink.sourceRenderFile && (
            <span className="truncate" title={videoLink.sourceRenderFile}>
              Source: {videoLink.sourceRenderFile}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={openInBrowser}
          className="mt-2 h-7 text-xs"
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Open in Sprout Video
        </Button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="h-8 w-8"
          title="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="h-8 w-8"
          title="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-red-600 hover:text-red-700"
          title="Remove video"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}