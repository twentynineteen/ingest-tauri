/**
 * VideoLinksManager - Container component for managing video links
 * Feature: 004-embed-multiple-video
 */

import { useState } from 'react'
import { Plus, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VideoLinkCard } from './VideoLinkCard'
import { useBreadcrumbsVideoLinks } from '../../hooks/useBreadcrumbsVideoLinks'
import { useSproutVideoApi } from '../../hooks/useSproutVideoApi'
import { useSproutVideoApiKey } from '../../hooks/useApiKeys'
import { validateVideoLink } from '../../utils/validation'
import type { VideoLink } from '../../types/baker'

interface VideoLinksManagerProps {
  projectPath: string
}

export function VideoLinksManager({ projectPath }: VideoLinksManagerProps) {
  const {
    videoLinks,
    isLoading,
    error,
    addVideoLink,
    removeVideoLink,
    reorderVideoLinks,
    isUpdating,
    addError
  } = useBreadcrumbsVideoLinks({ projectPath })

  const { apiKey } = useSproutVideoApiKey()
  const { fetchVideoDetailsAsync, isFetching: isFetchingVideo } = useSproutVideoApi()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    thumbnailUrl: '',
    sproutVideoId: ''
  })
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  const handleFetchVideoDetails = async () => {
    console.log('[VideoLinksManager] Fetch button clicked')
    console.log('[VideoLinksManager] URL:', formData.url)
    console.log('[VideoLinksManager] API Key available:', !!apiKey)
    console.log('[VideoLinksManager] API Key value:', apiKey)

    if (!formData.url || !apiKey) {
      console.log('[VideoLinksManager] Early return - missing URL or API key')
      return
    }

    setFetchError(null)
    setValidationErrors([])

    try {
      console.log('[VideoLinksManager] Calling fetchVideoDetailsAsync...')
      const details = await fetchVideoDetailsAsync({
        videoUrl: formData.url,
        apiKey
      })
      console.log('[VideoLinksManager] Received details:', details)

      // Auto-populate fields from API response
      setFormData({
        ...formData,
        title: details.title,
        thumbnailUrl: details.assets.poster_frames[0] || '',
        sproutVideoId: details.id
      })
    } catch (error) {
      console.error('[VideoLinksManager] Fetch failed:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch video details'
      setFetchError(errorMessage)
    }
  }

  const handleAddVideo = () => {
    // Build VideoLink object
    const newLink: VideoLink = {
      url: formData.url.trim(),
      title: formData.title.trim(),
      thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
      sproutVideoId: formData.sproutVideoId.trim() || undefined
    }

    // Validate
    const errors = validateVideoLink(newLink)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    // Check limit
    if (videoLinks.length >= 20) {
      setValidationErrors(['Maximum of 20 videos per project reached'])
      return
    }

    // Add video
    addVideoLink(newLink)

    // Reset form and close dialog
    setFormData({ url: '', title: '', thumbnailUrl: '', sproutVideoId: '' })
    setValidationErrors([])
    setIsDialogOpen(false)
  }

  const handleRemove = (index: number) => {
    if (confirm('Are you sure you want to remove this video link?')) {
      removeVideoLink(index)
    }
  }

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderVideoLinks({ fromIndex: index, toIndex: index - 1 })
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < videoLinks.length - 1) {
      reorderVideoLinks({ fromIndex: index, toIndex: index + 1 })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load video links: {error instanceof Error ? error.message : String(error)}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Video Links</h3>
          <p className="text-sm text-gray-500">
            {videoLinks.length} of 20 videos • Sprout Video uploads
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={videoLinks.length >= 20 || isUpdating}>
              <Plus className="mr-2 h-4 w-4" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Video Link</DialogTitle>
              <DialogDescription>
                Add a link to a video uploaded on Sprout Video
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="video-url"
                    placeholder="https://sproutvideo.com/videos/..."
                    value={formData.url}
                    onChange={(e) => {
                      setFormData({ ...formData, url: e.target.value })
                      setFetchError(null)
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleFetchVideoDetails}
                    disabled={!formData.url || !apiKey || isFetchingVideo}
                  >
                    {isFetchingVideo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Fetch Details'
                    )}
                  </Button>
                </div>
                {!apiKey && formData.url && (
                  <p className="text-xs text-amber-600">
                    Sprout Video API key not configured. Go to Settings to add it.
                  </p>
                )}
              </div>

              {fetchError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="video-title">Title *</Label>
                <Input
                  id="video-title"
                  placeholder="Video title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprout-id">Sprout Video ID</Label>
                <Input
                  id="sprout-id"
                  placeholder="abc123xyz"
                  value={formData.sproutVideoId}
                  onChange={(e) => setFormData({ ...formData, sproutVideoId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail-url">Thumbnail URL</Label>
                <Input
                  id="thumbnail-url"
                  placeholder="https://..."
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                />
              </div>

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {addError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {addError instanceof Error ? addError.message : String(addError)}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVideo}>Add Video</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Video List */}
      {videoLinks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-sm text-gray-500">No video links added yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Add videos uploaded to Sprout Video to associate them with this project
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {videoLinks.map((link, index) => (
            <VideoLinkCard
              key={`${link.url}-${index}`}
              videoLink={link}
              onRemove={() => handleRemove(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              canMoveUp={index > 0}
              canMoveDown={index < videoLinks.length - 1}
            />
          ))}
        </div>
      )}

      {isUpdating && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Updating...</span>
        </div>
      )}
    </div>
  )
}