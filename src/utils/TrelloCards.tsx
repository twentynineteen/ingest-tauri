import { useQuery } from '@tanstack/react-query'

// Define an interface for a Trello card (adjust fields as needed)
export interface TrelloCard {
  id: string
  name: string
  desc: string
  // Add more properties as required by your display needs.
}

/**
 * Fetches the cards for the "Small Projects" Trello board.
 * @param apiKey - Your Trello API key.
 * @param token - Your Trello authentication token.
 * @returns A promise that resolves to an array of TrelloCard objects.
 */
export async function fetchTrelloCards(
  apiKey: string,
  token: string,
  boardId: string
): Promise<TrelloCard[]> {
  // Construct the URL with both key and token.
  const url = `https://api.trello.com/1/boards/${boardId}/cards?key=${apiKey}&token=${token}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    // Parse and return the cards as an array of TrelloCard objects.
    const cards: TrelloCard[] = await response.json()
    return cards
  } catch (error) {
    console.error('Error fetching Trello cards:', error)
    return []
  }
}

export interface TrelloMember {
  id: string
  fullName: string
  username: string
  avatarUrl?: string // Optional if API provides avatars
}

/**
 * Custom hook to fetch Trello card members using React Query.
 * @param cardId - The id for the requested Trello card.
 * @param apiKey - Your Trello API key.
 * @param token - Your Trello authentication token.
 * @returns The query result with data, error, and status.
 */
export function useTrelloCardMembers(cardId: string, apiKey: string, token: string) {
  const query = useQuery({
    queryKey: ['trelloCardMembers', cardId],
    queryFn: async () => {
      const url = `https://api.trello.com/1/cards/${cardId}/members?key=${apiKey}&token=${token}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const members: TrelloMember[] = await response.json()
      return members
    }
  })

  return query

  // return useQuery<TrelloMember[], Error>(
  //   ['useTrelloCardMembers', cardId], // Query key
  //   async () => {
  //     const url = `https://api.trello.com/1/cards/${cardId}/members?key=${apiKey}&token=${token}`
  //     const response = await fetch(url)
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`)
  //     }
  //     const members: TrelloMember[] = await response.json()
  //     return members
  //   }
  // )
}
