/**
 * ReviewStep Component
 * Step 4: Review and Edit Formatted Script
 */

import { Database, Download, Save } from 'lucide-react'
import React from 'react'
import { DiffEditor } from '../DiffEditor'

interface ReviewStepProps {
  originalText: string
  modifiedText: string
  examplesCount: number
  isGenerating: boolean
  generateError: Error | null
  onModifiedChange: (value: string) => void
  onDownload: () => void
  onOpenSaveDialog: () => void
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  originalText,
  modifiedText,
  examplesCount,
  isGenerating,
  generateError,
  onModifiedChange,
  onDownload,
  onOpenSaveDialog
}) => {
  return (
    <div className="w-full space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-gray-900">Review and Edit</h3>
          {examplesCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-800">
              <Database className="h-3 w-3" />
              <span className="hidden sm:inline">
                Enhanced with {examplesCount} example{examplesCount > 1 ? 's' : ''}
              </span>
              <span className="sm:hidden">{examplesCount} ex.</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSaveDialog}
            className="flex-1 lg:flex-initial px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            title="Save this script as an example for future RAG-enhanced formatting"
          >
            <Save className="h-4 w-4" />
            <span className="hidden md:inline">Save as Example</span>
          </button>
          <button
            onClick={onDownload}
            disabled={isGenerating}
            className="flex-1 lg:flex-initial px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">
              {isGenerating ? 'Downloading...' : 'Download Formatted Script'}
            </span>
            <span className="md:hidden">Download</span>
          </button>
        </div>
      </div>

      {/* Diff Editor */}
      <DiffEditor
        original={originalText}
        modified={modifiedText}
        onModifiedChange={onModifiedChange}
      />

      {/* Error Display */}
      {generateError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{generateError.message}</p>
        </div>
      )}
    </div>
  )
}
