/**
 * DownloadCompleteStep Component
 * Step 5: Download Complete Success State
 */

import { Download } from 'lucide-react'
import React from 'react'

interface DownloadCompleteStepProps {
  onFormatAnother: () => void
}

export const DownloadCompleteStep: React.FC<DownloadCompleteStepProps> = ({
  onFormatAnother
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-8 bg-success/10 border border-success/20 rounded-lg text-center">
        <Download className="h-16 w-16 text-success mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Download Complete!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your formatted script has been saved successfully.
        </p>
        <button
          onClick={onFormatAnother}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Format Another Script
        </button>
      </div>
    </div>
  )
}
