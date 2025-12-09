/**
 * ModelSelector Component
 * Feature: 006-i-wish-to (T045)
 * Purpose: Select AI model with capabilities display
 */

import { Brain, Loader2, Wrench, Zap } from 'lucide-react'
import React from 'react'
import type { AIModel } from '@/types/scriptFormatter'

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
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 border border-border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading models...</span>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <p className="text-sm text-warning">
          No models available. Please check your provider connection.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">Select Model</label>

      <div className="space-y-2">
        {models.map(model => (
          <div
            key={model.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedModel === model.id
                ? 'border-foreground bg-secondary'
                : 'border-border hover:border-foreground/50'
            }`}
            onClick={() => onSelect(model.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{model.displayName}</p>
                  {model.size && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Size: {model.size}
                    </p>
                  )}

                  {/* Show model capabilities */}
                  <div className="flex items-center gap-3 mt-2">
                    {model.capabilities.supportsToolCalling && (
                      <div className="flex items-center gap-1 text-success">
                        <Wrench className="h-3 w-3" />
                        <span className="text-xs">Tool Calling</span>
                      </div>
                    )}
                    {model.capabilities.supportsStreaming && (
                      <div className="flex items-center gap-1 text-foreground">
                        <Zap className="h-3 w-3" />
                        <span className="text-xs">Streaming</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Availability indicator */}
              {model.availabilityStatus === 'online' && (
                <span className="px-2 py-1 text-xs bg-success/10 text-success rounded">
                  Available
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedModel && (
        <p className="text-xs text-muted-foreground">
          Selected: {models.find(m => m.id === selectedModel)?.displayName}
        </p>
      )}
    </div>
  )
}
