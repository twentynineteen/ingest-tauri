import React, { useEffect, useState } from 'react'
import ApiKeyInput from 'src/utils/ApiKeyInput'
import { ApiKeys, loadApiKeys, saveApiKeys } from '../utils/storage'

const Settings: React.FC = () => {
  // State to hold multiple API keys.
  const [apiKeys, setApiKeys] = useState<ApiKeys>({})

  // Load API keys when component mounts.
  useEffect(() => {
    const fetchApiKeys = async () => {
      const keys = await loadApiKeys()
      setApiKeys(keys)
    }
    fetchApiKeys()
  }, [])

  const handleSaveSproutKey = async () => {
    await saveApiKeys({ ...apiKeys, sproutVideo: apiKeys.sproutVideo })
    alert('SproutVideo API Key saved successfully!')
  }

  const handleSaveTrelloKey = async () => {
    await saveApiKeys({ ...apiKeys, trello: apiKeys.trello })
    alert('Trello API Key saved successfully!')
  }
  const handleSaveTrelloToken = async () => {
    await saveApiKeys({ ...apiKeys, trello: apiKeys.trelloToken })
    alert('Trello API Token saved successfully!')
  }

  return (
    <div className="w-full pb-4 border-b mb-4">
      <h2 className="px-4 text-2xl font-semibold mb-4">Settings</h2>

      <div className="px-4 mx-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">SproutVideo API Key</label>
          <ApiKeyInput
            apiKey={apiKeys.sproutVideo || ''}
            setApiKey={(newKey: string) =>
              setApiKeys({ ...apiKeys, sproutVideo: newKey })
            }
            onSave={handleSaveSproutKey}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Trello API Key</label>
          <ApiKeyInput
            apiKey={apiKeys.trello || ''}
            setApiKey={(newKey: string) => setApiKeys({ ...apiKeys, trello: newKey })}
            onSave={handleSaveTrelloKey}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Trello API Token</label>
          <ApiKeyInput
            apiKey={apiKeys.trelloToken || ''}
            setApiKey={(newKey: string) =>
              setApiKeys({ ...apiKeys, trelloToken: newKey })
            }
            onSave={handleSaveTrelloToken}
          />
        </div>
      </div>
    </div>
  )
}

export default Settings
