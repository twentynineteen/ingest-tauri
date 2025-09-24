import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { loadApiKeys } from 'utils/storage'
import {
  fetchTrelloCards,
  fetchTrelloLists,
  groupCardsByList,
  TrelloCard
} from 'utils/TrelloCards'
import { createQueryOptions, createQueryError, shouldRetry } from '../lib/query-utils'
import { queryKeys } from '../lib/query-keys'

interface TrelloBoardData {
  grouped: Record<string, TrelloCard[]>
  isLoading: boolean
  apiKey: string | null
  token: string | null
}

/**
 * Custom hook to fetch Trello cards and lists for a board,
 * then group the cards by their list.
 */
export function useTrelloBoard(boardId: string): TrelloBoardData {
  const [grouped, setGrouped] = useState<Record<string, TrelloCard[]>>({})

  // Use a simpler approach - direct query for credentials
  const { data: credentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: loadApiKeys,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })

  const apiKey = credentials?.trello || null
  const token = credentials?.trelloToken || null

  // Fetch cards with proper error handling
  const { data: cards, isLoading: cardsLoading, error: cardsError } = useQuery({
    ...createQueryOptions(
      queryKeys.trello.cards(boardId),
      async () => {
        if (!apiKey || !token) throw createQueryError('API key or token missing', 'AUTHENTICATION')
        return fetchTrelloCards(apiKey, token, boardId)
      },
      'DYNAMIC',
      {
        enabled: !!apiKey && !!token && !credentialsLoading,
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: (failureCount, error) => shouldRetry(error, failureCount, 'external')
      }
    )
  })

  // Fetch lists with proper error handling
  const { data: lists, isLoading: listsLoading, error: listsError } = useQuery({
    ...createQueryOptions(
      queryKeys.trello.lists(boardId),
      async () => {
        if (!apiKey || !token) throw createQueryError('API key or token missing', 'AUTHENTICATION')
        return fetchTrelloLists(apiKey, token, boardId)
      },
      'DYNAMIC',
      {
        enabled: !!apiKey && !!token && !credentialsLoading,
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: (failureCount, error) => shouldRetry(error, failureCount, 'external')
      }
    )
  })

  // Use React Query's computed state pattern instead of useEffect
  const isDataReady = cards && lists && !cardsLoading && !listsLoading
  const isLoading = credentialsLoading || cardsLoading || listsLoading


  // Group cards when data changes
  useEffect(() => {
    if (isDataReady) {
      try {
        const groupedCards = groupCardsByList(cards, lists)
        setGrouped(groupedCards)
      } catch (error) {
        console.error('Error grouping Trello cards:', error)
        // Reset to empty state on error
        setGrouped({})
      }
    } else {
      // Clear grouped data when dependencies are loading/missing
      setGrouped({})
    }
  }, [cards, lists, isDataReady])

  return {
    grouped,
    isLoading,
    apiKey,
    token
  }
}
