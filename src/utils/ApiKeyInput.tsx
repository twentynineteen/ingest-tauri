import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input' // Adjust this import if your Input component is located elsewhere.
import React, { useState } from 'react'

type Props = {
  apiKey: string
  setApiKey: React.Dispatch<React.SetStateAction<string>>
  onSave: () => void // Callback to save the API key
}

const ApiKeyInput: React.FC<Props> = ({ apiKey, setApiKey, onSave }) => {
  // State to track whether the API key should be visible
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {/* Input field with dynamic type based on showApiKey */}
      <Input
        type={showApiKey ? 'text' : 'password'}
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
        placeholder="Enter your API key..."
        style={{ flex: 1 }}
      />
      {/* Button to toggle visibility */}
      <Button onClick={() => setShowApiKey(prev => !prev)} style={{ marginLeft: '8px' }}>
        {showApiKey ? 'Hide' : 'Show'}
      </Button>
      {/* Button to save the API key */}
      <Button onClick={onSave} style={{ marginLeft: '8px' }}>
        Save
      </Button>
    </div>
  )
}

export default ApiKeyInput
