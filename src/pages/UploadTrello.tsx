import { Button } from '@components/components/ui/button'
import React, { useEffect, useState } from 'react'
import { loadApiKeys } from 'src/utils/storage'
import { fetchTrelloCards, TrelloCard } from 'src/utils/TrelloCards'

const UploadTrello = () => {
  const [apiKey, setApiKey] = useState<string | null>(null)
  // You'll need a token as well. This might come from storage or be hard-coded for testing.
  const [token, setToken] = useState<string | null>(null)
  const [cards, setCards] = useState<TrelloCard[]>([])

  // Load API key when component mounts
  useEffect(() => {
    const fetchApiKey = async () => {
      const key = await loadApiKeys()
      setApiKey(key.trello)
      setToken(key.trelloToken)
    }
    fetchApiKey()
  }, [])
  // Fetch Trello cards once API key and token are available.
  useEffect(() => {
    if (apiKey && token) {
      const fetchCards = async () => {
        // Board ID for "Small Projects"
        const boardId = '55a504d70bed2bd21008dc5a'
        const fetchedCards = await fetchTrelloCards(apiKey, token, boardId)
        setCards(fetchedCards)
      }
      fetchCards()
    }
  }, [apiKey, token])

  const getTrelloCardMembers = (cardId: string) => {

  }

  return (
    <>
      <div className="w-full pb-4 border-b mb-4">
        <h2 className="px-4 text-2xl font-semibold flex flex-row items-center gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M7 7h3v9H7zm7 0h3v5h-3z" />
            </g>
          </svg>
          Trello: Small Projects
        </h2>
        <div className="px-4 mx-4">
          <div className="flex flex-col items-start space-y-4 mt-4">
            {/* Display trello cards here */}
            {cards.length > 0 ? (
              cards.map(card => (
                <div
                  key={card.id}
                  className="border p-4 w-[450px] rounded-lg hover:bg-slate-50 "
                >
                  <h3 className="font-bold pb-2">{card.name}</h3>
                  <div className="flex flex-row">
                    <p className="w-2/3 text-sm text-gray-600">{card.desc}</p>
                    <div className="w-1/3 flex flex-col justify-evenly items-center p-4">
                    
                      <Button className="w-full">Join</Button>
                      <Button className="w-full">Edit</Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No cards found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default UploadTrello
