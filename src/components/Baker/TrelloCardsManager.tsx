/**
 * TrelloCardsManager - Container component for managing Trello cards
 * Feature: 004-embed-multiple-video
 */

import { useState, useMemo } from 'react'
import { Plus, AlertCircle, Loader2, Search } from 'lucide-react'
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
import { TrelloCardItem } from './TrelloCardItem'
import { useBreadcrumbsTrelloCards } from '../../hooks/useBreadcrumbsTrelloCards'
import { useTrelloBoard, useFuzzySearch } from '../../hooks'
import TrelloCardList from '../../utils/trello/TrelloCardList'
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
  const [addMode, setAddMode] = useState<'url' | 'select'>('url')

  // Fetch Trello board cards if API credentials are available
  const boardId = '55a504d70bed2bd21008dc5a' // Small projects board
  const { grouped, isLoading: isBoardLoading, apiKey, token } = useTrelloBoard(
    trelloApiKey && trelloApiToken ? boardId : null
  )

  // Flatten all cards for search
  const allCards = useMemo(() => {
    const cards: any[] = []
    Object.values(grouped).forEach(cardList => {
      cards.push(...cardList)
    })
    return cards
  }, [grouped])

  // Use fuzzy search hook
  const {
    searchTerm,
    setSearchTerm,
    results: filteredCards
  } = useFuzzySearch(allCards, {
    keys: ['name', 'desc'],
    threshold: 0.4
  })

  // Re-group filtered cards by list
  const filteredGrouped = useMemo(() => {
    if (!searchTerm.trim()) {
      return grouped
    }

    const result: Record<string, any[]> = {}
    filteredCards.forEach(card => {
      Object.entries(grouped).forEach(([listName, cards]) => {
        if (cards.some((c: any) => c.id === card.id)) {
          if (!result[listName]) {
            result[listName] = []
          }
          result[listName].push(card)
        }
      })
    })
    return result
  }, [searchTerm, filteredCards, grouped])

  const handleSelectCard = async (selectedCard: { id: string; name: string }) => {
    // Check limit
    if (trelloCards.length >= 10) {
      setValidationErrors(['Maximum of 10 Trello cards per project reached'])
      return
    }

    // Check for duplicate
    if (trelloCards.some(card => card.cardId === selectedCard.id)) {
      setValidationErrors(['This Trello card is already associated with the project'])
      return
    }

    setValidationErrors([])

    // Construct URL from card ID
    const url = `https://trello.com/c/${selectedCard.id}`

    // Fetch card details with API
    if (trelloApiKey && trelloApiToken) {
      try {
        setIsFetchingCard(true)
        const cardData = await fetchCardDetailsAsync({
          cardUrl: url,
          apiKey: trelloApiKey,
          apiToken: trelloApiToken
        })

        // Add card
        addTrelloCard(cardData)
        setIsDialogOpen(false)
      } catch (err) {
        setValidationErrors([
          err instanceof Error ? err.message : 'Failed to fetch card details'
        ])
      } finally {
        setIsFetchingCard(false)
      }
    }
  }

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
            {trelloCards.length} {trelloCards.length === 1 ? 'card' : 'cards'} • Project management
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={trelloCards.length >= 10 || isUpdating}>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Trello Card</DialogTitle>
              <DialogDescription>
                {trelloApiKey && trelloApiToken
                  ? 'Select a card from your board or enter a URL'
                  : 'Enter the URL of a Trello card'}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'url' | 'select')}>
              {trelloApiKey && trelloApiToken && (
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">Select from Board</TabsTrigger>
                  <TabsTrigger value="url">Enter URL</TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="select" className="space-y-4">
                {isBoardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading cards...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="search">Search Cards</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Search by name or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto border rounded-md p-4">
                      {isFetchingCard ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          <span className="ml-2 text-sm text-gray-500">Adding card...</span>
                        </div>
                      ) : (
                        <TrelloCardList grouped={filteredGrouped} onSelect={handleSelectCard} />
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
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
              </TabsContent>
            </Tabs>

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