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
      <div className="p-8 bg-green-50 border border-green-200 rounded-lg text-center">
        <Download className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Download Complete!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your formatted script has been saved successfully.
        </p>
        <button
          onClick={onFormatAnother}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Format Another Script
        </button>
      </div>
    </div>
  )
}
