import { Button } from '@components/components/ui/button'
import { Input } from '@components/components/ui/input'
import React, { useEffect, useState } from 'react'
import { loadApiKey, saveApiKey } from '../utils/storage'

const Settings = () => {
  const [apiKey, setApiKey] = useState('')

  // Load API key when component mounts
  useEffect(() => {
    const fetchApiKey = async () => {
      const storedKey = await loadApiKey()
      if (storedKey) {
        setApiKey(storedKey)
      }
    }
    fetchApiKey()
  }, [])

  // Handle saving the API key
  const handleSave = async () => {
    await saveApiKey(apiKey)
    alert('API Key saved successfully!')
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">SproutVideo API Key</label>
        <Input
          type="text"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="Enter your SproutVideo API key..."
        />
      </div>

      <Button onClick={handleSave} className="w-full">
        Save API Key
      </Button>
    </div>
  )
}

export default Settings
