/**
 * FileUploader Component
 * Feature: 006-i-wish-to (T043)
 * Purpose: Upload .docx files with validation
 */

import React, { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'
import { Upload, FileText, AlertCircle } from 'lucide-react'

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
  error?: Error | null
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  isLoading = false,
  error = null,
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const handleUploadClick = async () => {
    try {
      // Trigger Tauri file dialog
      const selected = await open({
        filters: [
          {
            name: 'Word Documents',
            extensions: ['docx'],
          },
        ],
        multiple: false,
      })

      if (!selected || typeof selected !== 'string') {
        return
      }

      // Validate .docx extension
      if (!selected.toLowerCase().endsWith('.docx')) {
        throw new Error('File must be a .docx document')
      }

      // Read file using Tauri FS plugin
      const bytes = await readFile(selected)
      const filename = selected.split('/').pop() || 'document.docx'

      // Check file size (1GB limit)
      if (bytes.length > 1024 * 1024 * 1024) {
        throw new Error('File size exceeds 1GB limit')
      }

      // Create File object
      const file = new File([bytes], filename, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      setSelectedFileName(filename)
      onFileSelect(file)
    } catch (err) {
      console.error('File upload error:', err)
      // Error is handled by parent component
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <button
          onClick={handleUploadClick}
          disabled={isLoading}
          className="w-full flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              <p className="text-sm text-gray-600">Processing file...</p>
            </>
          ) : (
            <>
              {selectedFileName ? (
                <>
                  <FileText className="h-12 w-12 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFileName}</p>
                    <p className="text-xs text-gray-500 mt-1">Click to select a different file</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Click to upload .docx script
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Maximum file size: 1GB</p>
                  </div>
                </>
              )}
            </>
          )}
        </button>
      </div>

      {/* Display validation errors */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Upload Error</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
