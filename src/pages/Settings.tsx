import { Button } from '@components/components/ui/button'
import { open as openPath } from '@tauri-apps/plugin-dialog'
import { open } from '@tauri-apps/plugin-shell'
import { useBreadcrumb } from 'hooks/useBreadcrumb'
import React, { useEffect, useState } from 'react'
import { useAppStore } from 'store/useAppStore'
import ApiKeyInput from 'utils/ApiKeyInput'
import { ApiKeys, loadApiKeys, saveApiKeys } from '../utils/storage'

const Settings: React.FC = () => {
  // State to hold multiple API keys.
  const [apiKeys, setApiKeys] = useState<ApiKeys>({})

  // Page label - shadcn breadcrumb component
  useBreadcrumb([{ label: 'Settings', href: '/settings/general' }, { label: 'General' }])

  // Load API keys when component mounts.
  useEffect(() => {
    const fetchApiKeys = async () => {
      const keys = await loadApiKeys()
      setApiKeys(keys)
    }
    fetchApiKeys()
  }, [])

  // Add default folder input and store in zustand app store
  const defaultBackgroundFolder = useAppStore(state => state.defaultBackgroundFolder)
  const setDefaultBackgroundFolder = useAppStore(
    state => state.setDefaultBackgroundFolder
  )

  const handleSelectDefaultBackgroundFolder = async () => {
    const folder = await openPath({
      directory: true,
      multiple: false
    })
    if (typeof folder === 'string') {
      setDefaultBackgroundFolder(folder)
      setApiKeys(prev => ({ ...prev, defaultBackgroundFolder: folder }))
    }
  }

  const handleSaveDefaultBackground = async () => {
    await saveApiKeys({ ...apiKeys, defaultBackgroundFolder })
    alert('Default background folder saved!')
  }

  const handleAuthorizeWithTrello = async () => {
    if (!apiKeys.trello) {
      alert('Please enter your Trello API key first.')
      return
    }

    const authUrl = `https://trello.com/1/authorize?expiration=never&name=MyApp&scope=read,write&response_type=token&key=${apiKeys.trello}`

    try {
      await open(authUrl)
      alert('After authorizing, copy the token from the URL and paste it below.')
    } catch (err) {
      console.error('Failed to open Trello authorization URL:', err)
    }
  }

  const handleSaveSproutKey = async () => {
    await saveApiKeys({ ...apiKeys, sproutVideo: apiKeys.sproutVideo })

    alert('SproutVideo API Key saved successfully!')
  }

  const handleSaveTrelloKey = async () => {
    await saveApiKeys({ ...apiKeys, trello: apiKeys.trello })
    alert('Trello API Key saved successfully!')
  }
  const handleSaveTrelloToken = async () => {
    await saveApiKeys({ ...apiKeys, trelloToken: apiKeys.trelloToken })
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
          <label className="block text-sm font-medium mb-2">Trello Auth</label>
          <Button onClick={handleAuthorizeWithTrello}>Authorize with Trello</Button>
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
        <div>
          <label className="block text-sm font-medium mb-2">
            Default Background Folder
          </label>
          <div className="flex gap-2 items-center">
            <Button
              onClick={handleSelectDefaultBackgroundFolder}
              className="px-3 py-1 border rounded"
            >
              Choose Folder
            </Button>
            <Button
              onClick={handleSaveDefaultBackground}
              className="px-3 py-1 border rounded"
            >
              Save
            </Button>
          </div>
          {defaultBackgroundFolder && (
            <p className="text-sm mt-1 text-muted-foreground">
              {defaultBackgroundFolder}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
