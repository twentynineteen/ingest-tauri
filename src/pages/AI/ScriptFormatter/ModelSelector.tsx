/**
 * ModelSelector Component
 * Feature: 006-i-wish-to (T045)
 * Purpose: Select AI model with capabilities display
 */

import React from 'react'
import { Brain, Loader2, Wrench, Zap } from 'lucide-react'
import type { AIModel } from '../../../types/scriptFormatter'

interface ModelSelectorProps {
  models: AIModel[]
  selectedModel: string | null
  onSelect: (modelId: string) => void
  isLoading?: boolean
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelect,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-600">Loading models...</span>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          No models available. Please check your provider connection.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Select Model</label>

      <div className="space-y-2">
        {models.map((model) => (
          <div
            key={model.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedModel === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelect(model.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{model.displayName}</p>
                  {model.size && (
                    <p className="text-xs text-gray-500 mt-0.5">Size: {model.size}</p>
                  )}

                  {/* Show model capabilities */}
                  <div className="flex items-center gap-3 mt-2">
                    {model.capabilities.supportsToolCalling && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Wrench className="h-3 w-3" />
                        <span className="text-xs">Tool Calling</span>
                      </div>
                    )}
                    {model.capabilities.supportsStreaming && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Zap className="h-3 w-3" />
                        <span className="text-xs">Streaming</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Availability indicator */}
              {model.availabilityStatus === 'online' && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  Available
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedModel && (
        <p className="text-xs text-gray-500">
          Selected: {models.find((m) => m.id === selectedModel)?.displayName}
        </p>
      )}
    </div>
  )
}
