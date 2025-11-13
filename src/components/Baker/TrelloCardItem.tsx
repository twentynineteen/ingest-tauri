/**
 * TrelloCardItem - Displays a single Trello card with title and actions
 * Feature: 004-embed-multiple-video
 */

import { Button } from '@/components/ui/button'
import { openUrl } from '@tauri-apps/plugin-opener'
import { ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import type { TrelloCard } from '../../types/baker'

interface TrelloCardItemProps {
  trelloCard: TrelloCard
  onRemove: () => void
  onRefresh?: () => void
}

export function TrelloCardItem({ trelloCard, onRemove, onRefresh }: TrelloCardItemProps) {
  const getRelativeTime = (isoDate?: string) => {
    if (!isoDate) return null

    const date = new Date(isoDate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const isStale = (isoDate?: string) => {
    if (!isoDate) return false
    const date = new Date(isoDate)
    const now = new Date()
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays > 7
  }

  const openInBrowser = async () => {
    try {
      await openUrl(trelloCard.url)
    } catch (error) {
      console.error('Failed to open Trello URL:', error)
    }
  }

  const stale = isStale(trelloCard.lastFetched)

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Trello icon placeholder */}
      <div className="flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded bg-blue-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="currentColor">
            <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm10.44-6c0 .794-.645 1.44-1.44 1.44H15c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v7.62z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{trelloCard.title}</h3>

        <div className="flex gap-4 mt-1 text-xs text-gray-500">
          <span>ID: {trelloCard.cardId}</span>
          {trelloCard.boardName && <span>Board: {trelloCard.boardName}</span>}
        </div>

        {trelloCard.lastFetched && (
          <p className={`text-xs mt-1 ${stale ? 'text-orange-600' : 'text-gray-500'}`}>
            Last updated: {getRelativeTime(trelloCard.lastFetched)}
            {stale && ' (stale)'}
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={openInBrowser}
          className="mt-2 h-7 text-xs"
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Open in Trello
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className={`h-8 w-8 ${stale ? 'text-orange-600 hover:text-orange-700' : 'text-gray-600 hover:text-gray-700'}`}
            title={stale ? 'Refresh stale card details' : 'Refresh card details'}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-red-600 hover:text-red-700"
          title="Remove card"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
