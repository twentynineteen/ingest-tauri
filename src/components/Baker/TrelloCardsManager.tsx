/**
 * TrelloCardsManager - Container component for managing Trello cards
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
import { TrelloCardItem } from './TrelloCardItem'
import { useBreadcrumbsTrelloCards } from '../../hooks/useBreadcrumbsTrelloCards'
import { validateTrelloCard, extractTrelloCardId } from '../../utils/validation'
import type { TrelloCard } from '../../types/baker'

interface TrelloCardsManagerProps {
  projectPath: string
  trelloApiKey?: string
  trelloApiToken?: string
}

export function TrelloCardsManager({
  projectPath,
  trelloApiKey,
  trelloApiToken
}: TrelloCardsManagerProps) {
  const {
    trelloCards,
    isLoading,
    error,
    addTrelloCard,
    removeTrelloCard,
    fetchCardDetails,
    fetchCardDetailsAsync,
    isUpdating,
    isFetchingDetails,
    addError,
    fetchError,
    fetchedCardData
  } = useBreadcrumbsTrelloCards({ projectPath })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cardUrl, setCardUrl] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isFetchingCard, setIsFetchingCard] = useState(false)

  const handleFetchAndAdd = async () => {
    const url = cardUrl.trim()

    // Basic URL validation
    const cardId = extractTrelloCardId(url)
    if (!cardId) {
      setValidationErrors(['Invalid Trello card URL format'])
      return
    }

    // Check limit
    if (trelloCards.length >= 10) {
      setValidationErrors(['Maximum of 10 Trello cards per project reached'])
      return
    }

    // Check for duplicate
    if (trelloCards.some(card => card.cardId === cardId)) {
      setValidationErrors(['This Trello card is already associated with the project'])
      return
    }

    setValidationErrors([])

    // If API credentials available, fetch details
    if (trelloApiKey && trelloApiToken) {
      try {
        setIsFetchingCard(true)
        const cardData = await fetchCardDetailsAsync({
          cardUrl: url,
          apiKey: trelloApiKey,
          apiToken: trelloApiToken
        })

        // Validate fetched card
        const errors = validateTrelloCard(cardData)
        if (errors.length > 0) {
          setValidationErrors(errors)
          return
        }

        // Add card
        addTrelloCard(cardData)
        setCardUrl('')
        setIsDialogOpen(false)
      } catch (err) {
        setValidationErrors([
          err instanceof Error ? err.message : 'Failed to fetch card details'
        ])
      } finally {
        setIsFetchingCard(false)
      }
    } else {
      // Add card with minimal info (no API fetch)
      const newCard: TrelloCard = {
        url,
        cardId,
        title: `Trello Card ${cardId}`
      }

      const errors = validateTrelloCard(newCard)
      if (errors.length > 0) {
        setValidationErrors(errors)
        return
      }

      addTrelloCard(newCard)
      setCardUrl('')
      setIsDialogOpen(false)
    }
  }

  const handleRemove = (index: number) => {
    if (confirm('Are you sure you want to remove this Trello card?')) {
      removeTrelloCard(index)
    }
  }

  const handleRefresh = async (index: number) => {
    if (!trelloApiKey || !trelloApiToken) {
      alert('Trello API credentials not configured')
      return
    }

    const card = trelloCards[index]
    try {
      const updatedCard = await fetchCardDetailsAsync({
        cardUrl: card.url,
        apiKey: trelloApiKey,
        apiToken: trelloApiToken
      })

      // Remove old and add updated
      removeTrelloCard(index)
      setTimeout(() => {
        addTrelloCard(updatedCard)
      }, 100)
    } catch (err) {
      alert(`Failed to refresh card: ${err instanceof Error ? err.message : String(err)}`)
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
          Failed to load Trello cards: {error instanceof Error ? error.message : String(error)}
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
            {trelloCards.length} of 10 cards • Project management
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={trelloCards.length >= 10 || isUpdating}>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Trello Card</DialogTitle>
              <DialogDescription>
                Enter the URL of a Trello card to associate with this project
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="card-url">Trello Card URL *</Label>
                <Input
                  id="card-url"
                  placeholder="https://trello.com/c/abc12345/card-name"
                  value={cardUrl}
                  onChange={(e) => setCardUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  {trelloApiKey && trelloApiToken
                    ? 'Card details will be fetched automatically'
                    : 'Enter the full URL from your Trello board'}
                </p>
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

              {fetchError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {fetchError instanceof Error ? fetchError.message : String(fetchError)}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setCardUrl('')
                  setValidationErrors([])
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFetchAndAdd}
                disabled={isFetchingCard || !cardUrl.trim()}
              >
                {isFetchingCard ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Add Card'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              onRefresh={
                trelloApiKey && trelloApiToken
                  ? () => handleRefresh(index)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {(isUpdating || isFetchingDetails) && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">
            {isFetchingDetails ? 'Fetching card details...' : 'Updating...'}
          </span>
        </div>
      )}
    </div>
  )
}