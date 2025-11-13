/**
 * ProviderSelector Component
 * Feature: 006-i-wish-to (T044)
 * Purpose: Select and validate AI provider
 */

import { CheckCircle, Loader2, XCircle, Zap } from 'lucide-react'
import React from 'react'
import type { AIProvider, ProviderConfiguration } from '../../../types/scriptFormatter'

interface ProviderSelectorProps {
  providers: AIProvider[]
  activeProvider: AIProvider | null
  onSelect: (providerId: string) => void
  onValidate: (providerId: string, config: ProviderConfiguration) => void
  isValidating?: boolean
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  activeProvider,
  onSelect,
  onValidate,
  isValidating = false
}) => {
  const handleProviderSelect = (providerId: string) => {
    onSelect(providerId)
    // Auto-validate after selection
    const provider = providers.find(p => p.id === providerId)
    if (provider) {
      onValidate(providerId, provider.configuration)
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">AI Provider</label>

      <div className="space-y-2">
        {providers.map(provider => (
          <div
            key={provider.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              activeProvider?.id === provider.id
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleProviderSelect(provider.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{provider.displayName}</p>
                  <p className="text-xs text-gray-500">
                    {provider.configuration.serviceUrl}
                  </p>
                </div>
              </div>

              {/* Connection status indicator */}
              <div className="flex items-center gap-2">
                {isValidating && activeProvider?.id === provider.id ? (
                  <div className="flex items-center gap-1 text-black">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Validating...</span>
                  </div>
                ) : (
                  <>
                    {provider.status === 'configured' && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Connected</span>
                      </div>
                    )}
                    {provider.status === 'error' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">Error</span>
                      </div>
                    )}
                    {provider.status === 'not-configured' && (
                      <span className="text-xs text-gray-500">Not configured</span>
                    )}

                    {/* Show latency if available */}
                    {provider.configuration.lastValidationResult?.latencyMs && (
                      <span className="text-xs text-gray-500">
                        ({provider.configuration.lastValidationResult.latencyMs}ms)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show validation error message */}
      {activeProvider?.configuration.lastValidationResult?.errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            {activeProvider.configuration.lastValidationResult.errorMessage}
          </p>
        </div>
      )}
    </div>
  )
}
