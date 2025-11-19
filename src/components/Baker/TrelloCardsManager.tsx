/**
 * TrelloCardsManager - Container component for managing Trello cards
 * Feature: 004-embed-multiple-video
 * Refactored: 2025-11-18 - Extracted state to useTrelloCardsManager, dialog to AddCardDialog
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTrelloCardsManager } from '@hooks/useTrelloCardsManager'
import { AlertCircle, Loader2 } from 'lucide-react'
import { TrelloCardItem } from './TrelloCardItem'
import { AddCardDialog } from './TrelloCards/AddCardDialog'

interface TrelloCardsManagerProps {
  projectPath: string
  trelloApiKey?: string
  trelloApiToken?: string
  autoSyncToTrello?: boolean
}

export function TrelloCardsManager({
  projectPath,
  trelloApiKey,
  trelloApiToken,
  autoSyncToTrello = false
}: TrelloCardsManagerProps) {
  const {
    // Data
    trelloCards,
    isLoading,
    error,
    addError,
    fetchError,
    validationErrors,

    // UI state
    isDialogOpen,
    setIsDialogOpen,
    cardUrl,
    setCardUrl,
    addMode,
    setAddMode,
    searchTerm,
    setSearchTerm,
    filteredGrouped,

    // Loading states
    isUpdating,
    isFetchingDetails,
    isFetchingCard,
    isBoardLoading,
    isSyncingToTrello,

    // Computed
    hasApiCredentials,
    canAddCard,

    // Handlers
    handleSelectCard,
    handleFetchAndAdd,
    handleRemove,
    handleRefresh
  } = useTrelloCardsManager({
    projectPath,
    trelloApiKey,
    trelloApiToken,
    autoSyncToTrello
  })

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
          Failed to load Trello cards:{' '}
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
          <h3 className="text-lg font-semibold text-gray-900">Trello Cards</h3>
          <p className="text-sm text-gray-500">
            {trelloCards.length} {trelloCards.length === 1 ? 'card' : 'cards'} • Project
            management
          </p>
        </div>

        <AddCardDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          canAddCard={canAddCard}
          hasApiCredentials={hasApiCredentials}
          addMode={addMode}
          onAddModeChange={setAddMode}
          cardUrl={cardUrl}
          onCardUrlChange={setCardUrl}
          onFetchAndAdd={handleFetchAndAdd}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filteredGrouped={filteredGrouped}
          onSelectCard={handleSelectCard}
          isBoardLoading={isBoardLoading}
          isFetchingCard={isFetchingCard}
          onClose={() => {
            setIsDialogOpen(false)
            setCardUrl('')
          }}
          validationErrors={validationErrors}
          addError={addError}
          fetchError={fetchError}
        />
      </div>

      {/* Card List */}
      {trelloCards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-sm text-gray-500">No Trello cards added yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Link Trello cards to track project management tasks
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trelloCards.map((card, index) => (
            <TrelloCardItem
              key={`${card.cardId}-${index}`}
              trelloCard={card}
              onRemove={() => handleRemove(index)}
              onRefresh={hasApiCredentials ? () => handleRefresh(index) : undefined}
            />
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {(isUpdating || isFetchingDetails || isSyncingToTrello) && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">
            {isSyncingToTrello
              ? 'Syncing breadcrumbs to Trello...'
              : isFetchingDetails
                ? 'Fetching card details...'
                : 'Updating...'}
          </span>
        </div>
      )}
    </div>
  )
}
