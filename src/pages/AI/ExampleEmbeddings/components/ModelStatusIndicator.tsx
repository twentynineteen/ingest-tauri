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
    if (isCheckingModel) return 'border-info/20 bg-info/10'
    if (isModelReady) return 'border-success/20 bg-success/10'
    return 'border-destructive/20 bg-destructive/10'
  }

  return (
    <div className={`rounded-md border p-3 ${getStatusStyles()}`}>
      <div className="flex items-center gap-2">
        {isCheckingModel ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-info" />
            <span className="text-sm text-info">Checking embedding model...</span>
          </>
        ) : isModelReady ? (
          <>
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-success">
              Embedding model ready: <code className="font-mono">{modelName}</code>
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Embedding model not available
              </p>
              {modelError && (
                <p className="text-xs text-destructive/90 mt-1">{modelError.message}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
