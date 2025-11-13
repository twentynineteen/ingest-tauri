/**
 * Scan Results Component
 *
 * Displays scan progress and results summary for Baker.
 */

import { formatFileSize } from '@utils/breadcrumbsComparison'
import { RefreshCw } from 'lucide-react'
import React from 'react'
import type { ScanResult } from '../../types/baker'

interface ScanResultsProps {
  scanResult: ScanResult | null
  isScanning: boolean
}

export const ScanResults: React.FC<ScanResultsProps> = ({ scanResult, isScanning }) => {
  if (!scanResult) return null

  // Show progress during scan
  if (isScanning) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Scanning in progress...</p>
            <p className="text-sm text-gray-500">
              {scanResult.totalFolders} folders scanned • {scanResult.validProjects}{' '}
              projects found
            </p>
          </div>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
      </div>
    )
  }

  // Show results summary after scan
  return (
    <div className="border rounded-lg p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{scanResult.totalFolders}</p>
          <p className="text-sm text-gray-500">Folders Scanned</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{scanResult.validProjects}</p>
          <p className="text-sm text-gray-500">Valid Projects</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">
            {
              scanResult.projects.filter(p => p.hasBreadcrumbs && !p.invalidBreadcrumbs)
                .length
            }
          </p>
          <p className="text-sm text-gray-500">Valid Breadcrumbs</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600">
            {scanResult.projects.filter(p => p.invalidBreadcrumbs).length}
          </p>
          <p className="text-sm text-gray-500">Invalid Breadcrumbs</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-purple-600">
            {formatFileSize(scanResult.totalFolderSize)}
          </p>
          <p className="text-sm text-gray-500">Total Size</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-orange-600">{scanResult.errors.length}</p>
          <p className="text-sm text-gray-500">Errors</p>
        </div>
      </div>
    </div>
  )
}
