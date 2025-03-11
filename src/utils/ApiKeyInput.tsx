import { Button } from '@components/components/ui/button'
import { Input } from '@components/components/ui/input' // Adjust this import if your Input component is located elsewhere.
import React, { useState } from 'react'

const ApiKeyInput: React.FC = () => {
  // State to hold the API key
  const [apiKey, setApiKey] = useState('')
  // State to track whether the API key should be visible
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {/* Input field with dynamic type based on showApiKey */}
      <Input
        type={showApiKey ? 'text' : 'password'}
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
        placeholder="Enter your SproutVideo API key..."
        style={{ flex: 1 }}
      />
      {/* Button to toggle visibility */}
      <Button onClick={() => setShowApiKey(prev => !prev)} style={{ marginLeft: '8px' }}>
        {showApiKey ? 'Hide' : 'Show'}
      </Button>
    </div>
  )
}

export default ApiKeyInput
