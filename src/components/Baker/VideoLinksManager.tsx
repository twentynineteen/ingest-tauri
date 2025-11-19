/**
 * VideoLinksManager - Container component for managing video links
 * Feature: 004-embed-multiple-video
 * Refactored: 2025-11-18 - Extracted state to useVideoLinksManager, dialog to AddVideoDialog
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { useVideoLinksManager } from '@hooks/useVideoLinksManager'
import { AlertCircle, Loader2 } from 'lucide-react'
import { TrelloCardUpdateDialog } from './TrelloCardUpdateDialog'
import { VideoLinkCard } from './VideoLinkCard'
import { AddVideoDialog } from './VideoLinks/AddVideoDialog'

interface VideoLinksManagerProps {
  projectPath: string
}

export function VideoLinksManager({ projectPath }: VideoLinksManagerProps) {
  const {
    // Data
    videoLinks,
    isLoading,
    error,
    addError,
    trelloCards,

    // Form state
    formData,
    updateFormField,
    validationErrors,
    fetchError,

    // Upload state
    selectedFile,
    uploading,
    progress,
    message,
    uploadSuccess,

    // Dialog state
    isDialogOpen,
    isTrelloDialogOpen,
    setIsTrelloDialogOpen,
    addMode,

    // Loading states
    isUpdating,
    isFetchingVideo,

    // Computed
    hasApiKey,
    canAddVideo,

    // Handlers
    handleFetchVideoDetails,
    handleAddVideo,
    handleRemove,
    handleMoveUp,
    handleMoveDown,
    handleUploadAndAdd,
    handleTrelloCardUpdate,
    handleAddTrelloCard,
    handleDialogOpenChange,
    handleTabChange,
    selectFile
  } = useVideoLinksManager({ projectPath })

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load video links:{' '}
          {error instanceof Error ? error.message : String(error)}
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
            {videoLinks.length} {videoLinks.length === 1 ? 'video' : 'videos'} • Sprout
            Video uploads
          </p>
        </div>

        <AddVideoDialog
          isOpen={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          canAddVideo={canAddVideo}
          addMode={addMode}
          onTabChange={handleTabChange}
          formData={formData}
          onFormFieldChange={updateFormField}
          onFetchDetails={handleFetchVideoDetails}
          onAddVideo={handleAddVideo}
          isFetchingVideo={isFetchingVideo}
          hasApiKey={hasApiKey}
          fetchError={fetchError}
          selectedFile={selectedFile}
          uploading={uploading}
          progress={progress}
          message={message}
          uploadSuccess={uploadSuccess}
          onSelectFile={selectFile}
          onUploadAndAdd={handleUploadAndAdd}
          validationErrors={validationErrors}
          addError={addError}
        />
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

      {/* Loading indicator */}
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
