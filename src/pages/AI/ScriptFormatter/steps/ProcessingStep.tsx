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
      <div className="p-8 border border-border rounded-lg text-center">
        <Sparkles className="h-16 w-16 text-foreground mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Formatting your script...
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Using AI to optimize for autocue readability
        </p>

        {/* RAG Status */}
        {ragStatus && (
          <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-info">
              <Database className="h-4 w-4" />
              <span>{ragStatus}</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2 mb-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>

        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 text-sm text-destructive border border-destructive/30 rounded hover:bg-destructive/10"
        >
          Cancel Processing
        </button>
      </div>

      {/* Error Display */}
      {processingError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Processing Error</p>
              <p className="text-sm text-destructive/90 mt-1">
                {processingError.message}
              </p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
