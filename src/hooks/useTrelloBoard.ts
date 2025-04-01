import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { loadApiKeys } from 'src/utils/storage'
import {
  fetchTrelloCards,
  fetchTrelloLists,
  groupCardsByList,
  TrelloCard,
  TrelloList
} from 'src/utils/TrelloCards'

/**
 * Custom hook to fetch Trello cards and lists for a board,
 * then group the cards by their list.
 */
export function useTrelloBoard(boardId: string) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [grouped, setGrouped] = useState<Record<string, TrelloCard[]>>({})

  // Load credentials once
  useEffect(() => {
    const fetchKeys = async () => {
      const keys = await loadApiKeys()
      setApiKey(keys.trello)
      setToken(keys.trelloToken)
    }
    fetchKeys()
  }, [])

  // Fetch cards
  const { data: cards } = useQuery({
    queryKey: ['trello-cards', boardId],
    queryFn: () => {
      if (!apiKey || !token) throw new Error('API key or token missing')
      return fetchTrelloCards(apiKey, token, boardId)
    },
    enabled: !!apiKey && !!token
  })

  // Fetch lists
  const { data: lists } = useQuery({
    queryKey: ['trello-lists', boardId],
    queryFn: () => {
      if (!apiKey || !token) throw new Error('API key or token missing')
      return fetchTrelloLists(apiKey, token, boardId)
    },
    enabled: !!apiKey && !!token
  })

  // Group cards once both are available
  useEffect(() => {
    if (cards && lists) {
      try {
        const groupedCards = groupCardsByList(cards, lists)
        setGrouped(groupedCards)
      } catch (error) {
        console.error('Error grouping Trello cards:', error)
      }
    }
  }, [cards, lists])

  return {
    grouped,
    isLoading: !cards || !lists,
    apiKey,
    token
  }
}
