/**
 * ModelStatusIndicator Component
 *
 * Displays the status of the Ollama embedding model.
 */

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface ModelStatusIndicatorProps {
  isCheckingModel: boolean
  isModelReady: boolean
  modelName: string
  modelError: Error | null
}

export function ModelStatusIndicator({
  isCheckingModel,
  isModelReady,
  modelName,
  modelError
}: ModelStatusIndicatorProps) {
  const getStatusStyles = () => {
    if (isCheckingModel) return 'border-blue-200 bg-blue-50'
    if (isModelReady) return 'border-green-200 bg-green-50'
    return 'border-red-200 bg-red-50'
  }

  return (
    <div className={`rounded-md border p-3 ${getStatusStyles()}`}>
      <div className="flex items-center gap-2">
        {isCheckingModel ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Checking embedding model...</span>
          </>
        ) : isModelReady ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              Embedding model ready: <code className="font-mono">{modelName}</code>
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">
                Embedding model not available
              </p>
              {modelError && (
                <p className="text-xs text-red-600 mt-1">{modelError.message}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
