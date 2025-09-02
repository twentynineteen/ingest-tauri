// src/components/uploadTrello/TrelloCardList.tsx

import React from 'react'
import { TrelloCard } from '../TrelloCards'

interface TrelloCardListProps {
  grouped: Record<string, TrelloCard[]>
  onSelect: (card: { id: string; name: string }) => void
}

/**
 * Renders a list of Trello cards grouped by their list names.
 * Allows selecting a card by clicking its name.
 */
const TrelloCardList: React.FC<TrelloCardListProps> = ({ grouped, onSelect }) => {
  if (Object.entries(grouped).length === 0) {
    return <p>No cards found.</p>
  }

  return (
    <div>
      {Object.entries(grouped).map(([listName, cards]) => (
        <div key={listName}>
          <h2 className="text-lg font-semibold mt-4">{listName}</h2>
          <ul className="list-disc ml-5">
            {cards.map(card => (
              <li
                key={card.id}
                className="hover:bg-gray-200 px-3 py-1 rounded transition-colors cursor-pointer"
                onClick={() => onSelect({ id: card.id, name: card.name })}
              >
                {card.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default TrelloCardList
