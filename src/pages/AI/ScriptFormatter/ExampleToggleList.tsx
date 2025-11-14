/**
 * ExampleToggleList Component
 * Displays a list of script examples with toggle controls
 */

import { CheckCircle2, Circle } from 'lucide-react'
import React from 'react'
import type { ExampleWithMetadata } from '../../../types/exampleEmbeddings'

interface ExampleToggleListProps {
  examples: ExampleWithMetadata[]
  enabledIds: Set<string>
  onToggle: (id: string) => void
  isLoading?: boolean
}

export function ExampleToggleList({
  examples,
  enabledIds,
  onToggle,
  isLoading = false
}: ExampleToggleListProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">Loading examples...</div>
    )
  }

  if (examples.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">No examples available</div>
    )
  }

  const enabledCount = examples.filter(ex => enabledIds.has(ex.id)).length
  const totalCount = examples.length

  return (
    <div className="space-y-2">
      {/* Header with count */}
      <div className="flex items-center justify-between px-2 pb-2 border-b">
        <span className="text-xs font-medium text-gray-700">
          {enabledCount} of {totalCount} enabled
        </span>
        <div className="flex gap-2">
          <button
            onClick={() =>
              examples.forEach(ex => !enabledIds.has(ex.id) && onToggle(ex.id))
            }
            className="text-xs text-blue-600 hover:text-blue-700"
            disabled={enabledCount === totalCount}
          >
            Enable All
          </button>
          <button
            onClick={() =>
              examples.forEach(ex => enabledIds.has(ex.id) && onToggle(ex.id))
            }
            className="text-xs text-gray-600 hover:text-gray-700"
            disabled={enabledCount === 0}
          >
            Disable All
          </button>
        </div>
      </div>

      {/* Example list */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {examples.map(example => {
          const isEnabled = enabledIds.has(example.id)
          return (
            <button
              key={example.id}
              onClick={() => onToggle(example.id)}
              className={`w-full flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors text-left ${
                isEnabled ? 'bg-blue-50/50' : 'bg-white'
              }`}
            >
              {isEnabled ? (
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm font-medium ${
                      isEnabled ? 'text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {example.title}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      isEnabled
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {example.source === 'bundled' ? 'Bundled' : 'Custom'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{example.category}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
