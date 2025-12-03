/**
 * Folder Selector Component
 *
 * Handles folder selection and scan initiation for Baker.
 */

import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { open } from '@tauri-apps/plugin-dialog'
import { FolderOpen, Play, RefreshCw, Square } from 'lucide-react'
import React, { useCallback } from 'react'
import { logger } from '@/utils/logger'

interface FolderSelectorProps {
  selectedFolder: string
  onFolderChange: (folder: string) => void
  onStartScan: () => void
  onCancelScan: () => void
  onClearResults: () => void
  isScanning: boolean
  hasResults: boolean
  disabled?: boolean
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  selectedFolder,
  onFolderChange,
  onStartScan,
  onCancelScan,
  onClearResults,
  isScanning,
  hasResults,
  disabled = false
}) => {
  const handleSelectFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select folder to scan for projects'
      })

      if (selected && typeof selected === 'string') {
        onFolderChange(selected)
      }
    } catch (error) {
      logger.error('Failed to select folder:', error)
    }
  }, [onFolderChange])

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-medium">Select Folder to Scan</h3>
      <p className="text-sm text-gray-600">
        Choose a root directory to scan for BuildProject-compatible folders
      </p>

      <div className="flex space-x-2">
        <Input
          placeholder="No folder selected"
          value={selectedFolder}
          readOnly
          className="flex-1"
        />
        <Button
          onClick={handleSelectFolder}
          variant="outline"
          disabled={disabled || isScanning}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={onStartScan}
          disabled={!selectedFolder || isScanning || disabled}
          className="flex-1"
        >
          {isScanning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Scan
            </>
          )}
        </Button>

        {isScanning && (
          <Button onClick={onCancelScan} variant="outline">
            <Square className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}

        {hasResults && (
          <Button onClick={onClearResults} variant="outline">
            Clear Results
          </Button>
        )}
      </div>
    </div>
  )
}
