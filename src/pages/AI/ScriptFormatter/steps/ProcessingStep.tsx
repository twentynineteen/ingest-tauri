/**
 * ProcessingStep Component
 * Step 3: Script Processing with Progress
 */

import { AlertCircle, Database, Sparkles } from 'lucide-react'
import React from 'react'

interface ProcessingStepProps {
  progress: number
  ragStatus: string
  processingError: Error | null
  onCancel: () => void
  onRetry: () => void
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({
  progress,
  ragStatus,
  processingError,
  onCancel,
  onRetry
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-8 border border-gray-300 rounded-lg text-center">
        <Sparkles className="h-16 w-16 text-black mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Formatting your script...
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Using AI to optimize for autocue readability
        </p>

        {/* RAG Status */}
        {ragStatus && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-800">
              <Database className="h-4 w-4" />
              <span>{ragStatus}</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>

        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
        >
          Cancel Processing
        </button>
      </div>

      {/* Error Display */}
      {processingError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Processing Error</p>
              <p className="text-sm text-red-700 mt-1">{processingError.message}</p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
