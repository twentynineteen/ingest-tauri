import { Button } from '@components/components/ui/button'
import { Input } from '@components/components/ui/input'
import React, { useEffect, useState } from 'react'
import ApiKeyInput from 'src/utils/ApiKeyInput'
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
    <div className="w-full pb-4 border-b mb-4">
      <h2 className="px-4 text-2xl font-semibold mb-4">Settings</h2>

      <div className="px-4 mx-4">
        <label className="block text-sm font-medium mb-2">SproutVideo API Key</label>
        <div className="flex flex-row items-center mt-4 gap-4">
          <div className="w-full">
            <ApiKeyInput />
          </div>
          <Button onClick={handleSave} className="">
            Save API Key
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Settings
