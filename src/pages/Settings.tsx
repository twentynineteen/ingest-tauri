import { Button } from '@components/ui/button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { open as openPath } from '@tauri-apps/plugin-dialog'
import { open } from '@tauri-apps/plugin-shell'
import { useBreadcrumb } from 'hooks/useBreadcrumb'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import React, { useState } from 'react'
import { useAppStore } from 'store/useAppStore'
import ApiKeyInput from 'utils/ApiKeyInput'
import { useAIProvider } from '../hooks/useAIProvider'
import { queryKeys } from '../lib/query-keys'
import { createQueryError, createQueryOptions, shouldRetry } from '../lib/query-utils'
import { ApiKeys, loadApiKeys, saveApiKeys } from '../utils/storage'

const Settings: React.FC = () => {
  const queryClient = useQueryClient()

  // Local state for form inputs (separate from cached data)
  const [localApiKeys, setLocalApiKeys] = useState<Partial<ApiKeys>>({})

  // AI Provider state for testing connection
  const { validateProvider } = useAIProvider()
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error'
    message?: string
    modelsFound?: number
    latencyMs?: number
  }>({ status: 'idle' })

  // Page label - shadcn breadcrumb component
  useBreadcrumb([{ label: 'Settings', href: '/settings/general' }, { label: 'General' }])

  // Use React Query to load API keys
  const { data: apiKeys = {} } = useQuery({
    ...createQueryOptions(
      queryKeys.settings.apiKeys(),
      async () => {
        try {
          return await loadApiKeys()
        } catch (error) {
          throw createQueryError(`Failed to load API keys: ${error}`, 'SETTINGS_LOAD')
        }
      },
      'DYNAMIC',
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // Keep cached for 10 minutes
        retry: (failureCount, error) => shouldRetry(error, failureCount, 'settings')
      }
    )
  })

  // Mutation for saving API keys
  const saveApiKeysMutation = useMutation({
    mutationFn: async (newApiKeys: Partial<ApiKeys>) => {
      try {
        await saveApiKeys({ ...apiKeys, ...newApiKeys })
        return { ...apiKeys, ...newApiKeys }
      } catch (error) {
        throw createQueryError(`Failed to save API keys: ${error}`, 'SETTINGS_SAVE')
      }
    },
    onSuccess: updatedKeys => {
      // Update the cache with the new keys
      queryClient.setQueryData(queryKeys.settings.apiKeys(), updatedKeys)
    }
  })

  // Add default folder input and store in zustand app store
  const defaultBackgroundFolder = useAppStore(state => state.defaultBackgroundFolder)
  const setDefaultBackgroundFolder = useAppStore(
    state => state.setDefaultBackgroundFolder
  )

  // Ollama URL setting
  const ollamaUrl = useAppStore(state => state.ollamaUrl)
  const setOllamaUrl = useAppStore(state => state.setOllamaUrl)

  const handleSelectDefaultBackgroundFolder = async () => {
    const folder = await openPath({
      directory: true,
      multiple: false
    })
    if (typeof folder === 'string') {
      setDefaultBackgroundFolder(folder)
    }
  }

  const handleSaveDefaultBackground = async () => {
    try {
      await saveApiKeysMutation.mutateAsync({ defaultBackgroundFolder })
      alert('Default background folder saved!')
    } catch (error) {
      alert('Failed to save default background folder')
      console.error('Save error:', error)
    }
  }

  const handleSaveOllamaUrl = async () => {
    try {
      await saveApiKeysMutation.mutateAsync({ ollamaUrl })
      alert('Ollama URL saved successfully!')
    } catch (error) {
      alert('Failed to save Ollama URL')
      console.error('Save error:', error)
    }
  }

  const handleAuthorizeWithTrello = async () => {
    if (!localApiKeys.trello) {
      alert('Please enter your Trello API key first.')
      return
    }

    const authUrl = `https://trello.com/1/authorize?expiration=never&name=MyApp&scope=read,write&response_type=token&key=${localApiKeys.trello}`

    try {
      await open(authUrl)
      alert('After authorizing, copy the token from the URL and paste it below.')
    } catch (err) {
      console.error('Failed to open Trello authorization URL:', err)
    }
  }

  // Update local state when cached data changes
  React.useEffect(() => {
    if (apiKeys && Object.keys(apiKeys).length > 0) {
      setLocalApiKeys(apiKeys)
    }
  }, [apiKeys])

  const handleSaveSproutKey = async () => {
    try {
      await saveApiKeysMutation.mutateAsync({ sproutVideo: localApiKeys.sproutVideo })
      alert('SproutVideo API Key saved successfully!')
    } catch (error) {
      alert('Failed to save SproutVideo API Key')
      console.error('Save error:', error)
    }
  }

  const handleSaveTrelloKey = async () => {
    try {
      await saveApiKeysMutation.mutateAsync({ trello: localApiKeys.trello })
      alert('Trello API Key saved successfully!')
    } catch (error) {
      alert('Failed to save Trello API Key')
      console.error('Save error:', error)
    }
  }

  const handleSaveTrelloToken = async () => {
    try {
      await saveApiKeysMutation.mutateAsync({ trelloToken: localApiKeys.trelloToken })
      alert('Trello API Token saved successfully!')
    } catch (error) {
      alert('Failed to save Trello API Token')
      console.error('Save error:', error)
    }
  }

  const handleOllamaUrlChange = (newUrl: string) => {
    setOllamaUrl(newUrl)
    setLocalApiKeys({ ...localApiKeys, ollamaUrl: newUrl })
    // Reset connection status when URL changes
    setConnectionStatus({ status: 'idle' })
  }

  const handleTestConnection = async () => {
    const testUrl = ollamaUrl || 'http://localhost:11434'
    setConnectionStatus({ status: 'testing' })

    const result = await validateProvider('ollama', {
      serviceUrl: testUrl,
      connectionStatus: 'not-configured',
      timeout: 5000
    })

    if (result.success) {
      const modelsFound = result.modelsFound ?? 0
      setConnectionStatus({
        status: 'success',
        message: `Connected successfully! Found ${modelsFound} model${modelsFound !== 1 ? 's' : ''}.`,
        modelsFound,
        latencyMs: result.latencyMs
      })
    } else {
      setConnectionStatus({
        status: 'error',
        message:
          result.errorMessage || 'Connection failed. Please check if Ollama is running.'
      })
    }
  }

  return (
    <div className="w-full pb-4">
      <h2 className="px-4 text-2xl font-semibold mb-6">Settings</h2>

      <div className="px-4 mx-4 space-y-8">
        {/* AI Models Section */}
        <section className="space-y-4 border border-gray-300 rounded-lg p-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">AI Models</h3>
            <p className="text-sm text-gray-500">
              Configure AI provider settings for script formatting
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Ollama URL
              <span className="text-xs text-gray-500 ml-2">
                (Default: http://localhost:11434)
              </span>
            </label>
            <div className="space-y-2">
              <ApiKeyInput
                apiKey={ollamaUrl || 'http://localhost:11434'}
                setApiKey={handleOllamaUrlChange}
                onSave={handleSaveOllamaUrl}
              />
              <div className="flex gap-2 items-center">
                <Button
                  onClick={handleTestConnection}
                  disabled={connectionStatus.status === 'testing'}
                  className="px-3 py-1 border rounded flex items-center gap-2"
                >
                  {connectionStatus.status === 'testing' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {connectionStatus.status === 'testing'
                    ? 'Testing...'
                    : 'Test Connection'}
                </Button>

                {connectionStatus.status === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>{connectionStatus.message}</span>
                    {connectionStatus.latencyMs && (
                      <span className="text-gray-500">
                        ({connectionStatus.latencyMs}ms)
                      </span>
                    )}
                  </div>
                )}

                {connectionStatus.status === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>{connectionStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Trello Section */}
        <section className="space-y-4 border border-gray-300 rounded-lg p-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Trello</h3>
            <p className="text-sm text-gray-500">
              Configure Trello API integration for project management
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Trello API Key</label>
            <ApiKeyInput
              apiKey={localApiKeys.trello || ''}
              setApiKey={(newKey: string) =>
                setLocalApiKeys({ ...localApiKeys, trello: newKey })
              }
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
              apiKey={localApiKeys.trelloToken || ''}
              setApiKey={(newKey: string) =>
                setLocalApiKeys({ ...localApiKeys, trelloToken: newKey })
              }
              onSave={handleSaveTrelloToken}
            />
          </div>
        </section>

        {/* SproutVideo Section */}
        <section className="space-y-4 border border-gray-300 rounded-lg p-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">SproutVideo</h3>
            <p className="text-sm text-gray-500">
              Configure SproutVideo API for video hosting
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">SproutVideo API Key</label>
            <ApiKeyInput
              apiKey={localApiKeys.sproutVideo || ''}
              setApiKey={(newKey: string) =>
                setLocalApiKeys({ ...localApiKeys, sproutVideo: newKey })
              }
              onSave={handleSaveSproutKey}
            />
          </div>
        </section>

        {/* Backgrounds Section */}
        <section className="space-y-4 border border-gray-300 rounded-lg p-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Backgrounds</h3>
            <p className="text-sm text-gray-500">
              Set default folder for background assets
            </p>
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
        </section>
      </div>
    </div>
  )
}

export default Settings
