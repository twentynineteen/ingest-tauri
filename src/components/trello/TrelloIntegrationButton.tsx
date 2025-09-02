import { Button } from '@components/ui/button'
import React from 'react'

interface TrelloIntegrationButtonProps {
  onClick: () => void
  disabled?: boolean
}

const TrelloIntegrationButton: React.FC<TrelloIntegrationButtonProps> = ({
  onClick,
  disabled = false
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="bg-blue-500 hover:bg-blue-600 text-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        className="mr-2"
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
      Link to Trello
    </Button>
  )
}

export default TrelloIntegrationButton