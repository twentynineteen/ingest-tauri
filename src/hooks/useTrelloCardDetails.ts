import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { TrelloCard, TrelloMember } from '@utils/TrelloCards'

interface CardDetailsResult {
  card: TrelloCard | undefined
  members: TrelloMember[] | undefined
  isLoading: boolean
  refetchCard: () => Promise<UseQueryResult<TrelloCard, Error>>
  refetchMembers: () => Promise<UseQueryResult<TrelloMember[], Error>>
}

export function useTrelloCardDetails(
  cardId: string | null,
  apiKey: string | null,
  token: string | null
): CardDetailsResult {
  const cardQuery = useQuery({
    queryKey: ['trello-card', cardId],
    queryFn: async () => {
      const res = await fetch(
        `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${token}`
      )
      if (!res.ok) throw new Error('Failed to fetch card')
      return res.json()
    },
    enabled: !!cardId && !!apiKey && !!token
  })

  const membersQuery = useQuery({
    queryKey: ['trello-card-members', cardId],
    queryFn: async () => {
      const res = await fetch(
        `https://api.trello.com/1/cards/${cardId}/members?key=${apiKey}&token=${token}`
      )
      if (!res.ok) throw new Error('Failed to fetch card members')
      return res.json()
    },
    enabled: !!cardId && !!apiKey && !!token
  })

  return {
    card: cardQuery.data,
    members: membersQuery.data,
    isLoading: cardQuery.isLoading || membersQuery.isLoading,
    refetchCard: cardQuery.refetch,
    refetchMembers: membersQuery.refetch
  }
}
