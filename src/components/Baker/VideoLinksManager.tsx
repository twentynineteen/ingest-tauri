/**
 * VideoLinksManager - Container component for managing video links
 * Feature: 004-embed-multiple-video
 */

import { useState, useEffect } from 'react'
import { Plus, AlertCircle, Loader2, Upload as UploadIcon } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoLinkCard } from './VideoLinkCard'
import { TrelloCardUpdateDialog } from './TrelloCardUpdateDialog'
import { useBreadcrumbsVideoLinks } from '../../hooks/useBreadcrumbsVideoLinks'
import { useBreadcrumbsTrelloCards } from '../../hooks/useBreadcrumbsTrelloCards'
import { useSproutVideoApi } from '../../hooks/useSproutVideoApi'
import { useSproutVideoApiKey, useTrelloApiKey } from '../../hooks/useApiKeys'
import { useFileUpload } from '../../hooks/useFileUpload'
import { useUploadEvents } from '../../hooks/useUploadEvents'
import { useSproutVideoProcessor } from '../../hooks/useSproutVideoProcessor'
import { validateVideoLink } from '../../utils/validation'
import { generateBreadcrumbsBlock, updateTrelloCardWithBreadcrumbs } from '../../hooks/useAppendBreadcrumbs'
import { invoke } from '@tauri-apps/api/core'
import type { VideoLink, BreadcrumbsFile } from '../../types/baker'

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

  const { trelloCards } = useBreadcrumbsTrelloCards({ projectPath })
  const { apiKey } = useSproutVideoApiKey()
  const { apiKey: trelloApiKey, token: trelloToken } = useTrelloApiKey()
  const { fetchVideoDetailsAsync, isFetching: isFetchingVideo } = useSproutVideoApi()
  const { selectedFile, uploading, response, selectFile, uploadFile, resetUploadState } =
    useFileUpload()
  const { progress, message } = useUploadEvents()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTrelloDialogOpen, setIsTrelloDialogOpen] = useState(false)
  const [addMode, setAddMode] = useState<'url' | 'upload'>('url')
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    thumbnailUrl: '',
    sproutVideoId: ''
  })
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // React Query-based upload processor (replaces useEffect pattern)
  const videoProcessor = useSproutVideoProcessor({
    response,
    selectedFile,
    uploading,
    enabled: addMode === 'upload',
    onVideoReady: (videoLink) => {
      addVideoLink(videoLink)
      // Don't reset upload state here - keep the success UI showing
      // Don't auto-close - let user see success and close manually

      // Auto-trigger Trello card update if we have cards
      if (trelloCards && trelloCards.length > 0 && trelloApiKey && trelloToken) {
        setIsTrelloDialogOpen(true)
      }
    },
    onError: (error) => {
      setValidationErrors([error])
      setUploadSuccess(false)
    }
  })

  // Track when upload completes (response received, even if still processing)
  useEffect(() => {
    if (response && !uploading && addMode === 'upload') {
      setUploadSuccess(true)
    }
  }, [response, uploading, addMode])

  const handleFetchVideoDetails = async () => {
    if (!formData.url || !apiKey) return

    setFetchError(null)
    setValidationErrors([])

    try {
      const details = await fetchVideoDetailsAsync({
        videoUrl: formData.url,
        apiKey
      })

      // Auto-populate fields from API response
      setFormData({
        ...formData,
        title: details.title,
        thumbnailUrl: details.assets.poster_frames[0] || '',
        sproutVideoId: details.id
      })
    } catch (error) {
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

  const handleUploadAndAdd = async () => {
    if (!selectedFile || !apiKey) return

    try {
      await uploadFile(apiKey)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleTrelloCardUpdate = async (selectedCardIndexes: number[]) => {
    if (!trelloApiKey || !trelloToken) {
      throw new Error('Trello API credentials not configured')
    }

    // Get current breadcrumbs with updated video links
    const breadcrumbsData = await invoke<BreadcrumbsFile>('baker_get_breadcrumbs', {
      projectPath
    })

    // Generate updated breadcrumbs block
    const breadcrumbsBlock = generateBreadcrumbsBlock(breadcrumbsData)

    // Update selected cards
    const updatePromises = selectedCardIndexes.map(async (index) => {
      const card = trelloCards[index]
      // Fetch full card details from Trello API to get current description
      const response = await fetch(
        `https://api.trello.com/1/cards/${card.cardId}?key=${trelloApiKey}&token=${trelloToken}`
      )
      const fullCard = await response.json()

      await updateTrelloCardWithBreadcrumbs(
        fullCard,
        breadcrumbsBlock,
        trelloApiKey,
        trelloToken,
        { autoReplace: true, silentErrors: false }
      )
    })

    await Promise.all(updatePromises)
  }

  const handleAddTrelloCard = () => {
    // TODO: Implement navigation to TrelloCardsManager or open add dialog
    console.log('Add Trello Card functionality to be implemented')
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)

    if (!open) {
      // Reset all state when closing
      setFormData({ url: '', title: '', thumbnailUrl: '', sproutVideoId: '' })
      setValidationErrors([])
      setFetchError(null)
      setAddMode('url')
      setUploadSuccess(false)
      resetUploadState()
      videoProcessor.reset()
    }
  }

  const handleTabChange = (value: string) => {
    setAddMode(value as 'url' | 'upload')
    setValidationErrors([])
    setFetchError(null)
    setUploadSuccess(false)

    // Reset upload state when switching away from upload tab
    if (value === 'url') {
      resetUploadState()
      videoProcessor.reset()
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
            {videoLinks.length} {videoLinks.length === 1 ? 'video' : 'videos'} • Sprout Video uploads
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
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

            <Tabs value={addMode} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Enter URL</TabsTrigger>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
              </TabsList>

              {/* URL Entry Tab */}
              <TabsContent value="url" className="space-y-4 py-4">
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
              </TabsContent>

              {/* Upload File Tab */}
              <TabsContent value="upload" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Video File *</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={selectFile}
                        disabled={uploading}
                        className="flex-1"
                      >
                        <UploadIcon className="mr-2 h-4 w-4" />
                        Select Video File
                      </Button>
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-gray-600">
                        Selected: <span className="font-medium">{selectedFile.split('/').pop()}</span>
                      </p>
                    )}
                  </div>

                  {!apiKey && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Sprout Video API key not configured. Go to Settings to add it.
                      </AlertDescription>
                    </Alert>
                  )}

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Uploading: {progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  )}

                  {message && !uploading && (
                    <Alert variant={typeof message === 'string' && message.includes('failed') ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{String(message)}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              {addMode === 'url' ? (
                <>
                  <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddVideo}>Add Video</Button>
                </>
              ) : uploadSuccess ? (
                <Button onClick={() => handleDialogOpenChange(false)} className="w-full">
                  Finish
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUploadAndAdd}
                    disabled={!selectedFile || !apiKey || uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading... {progress}%
                      </>
                    ) : (
                      'Upload and Add'
                    )}
                  </Button>
                </>
              )}
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

      {/* Trello Card Update Dialog */}
      <TrelloCardUpdateDialog
        open={isTrelloDialogOpen}
        onOpenChange={setIsTrelloDialogOpen}
        trelloCards={trelloCards}
        onUpdate={handleTrelloCardUpdate}
        onAddTrelloCard={handleAddTrelloCard}
      />
    </div>
  )
}