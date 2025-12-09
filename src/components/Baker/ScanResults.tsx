/**
 * Scan Results Component
 *
 * Displays scan progress and results summary for Baker.
 */

import type { ScanResult } from '@/types/baker'
import { formatFileSize } from '@utils/breadcrumbsComparison'
import { RefreshCw } from 'lucide-react'
import React from 'react'

interface ScanResultsProps {
  scanResult: ScanResult | null
  isScanning: boolean
}

export const ScanResults: React.FC<ScanResultsProps> = ({ scanResult, isScanning }) => {
  if (!scanResult) return null

  // Show progress during scan
  if (isScanning) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
            2
          </div>
          <h2 className="text-sm font-semibold text-foreground">Scan Results</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Scanning in progress...</p>
            <p className="text-sm text-muted-foreground">
              {scanResult.totalFolders} folders scanned • {scanResult.validProjects}{' '}
              projects found
            </p>
          </div>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
      </div>
    )
  }

  // Calculate stats
  const validBreadcrumbs = scanResult.projects.filter(
    p => p.hasBreadcrumbs && !p.invalidBreadcrumbs
  ).length
  const invalidBreadcrumbs = scanResult.projects.filter(p => p.invalidBreadcrumbs).length
  const missingBreadcrumbs = scanResult.projects.filter(
    p => !p.hasBreadcrumbs && !p.invalidBreadcrumbs
  ).length

  // Show results summary after scan
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
            2
          </div>
          <h2 className="text-sm font-semibold text-foreground">Scan Results</h2>
        </div>

        {/* Compact stats inline */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Scanned:</span>
            <span className="font-semibold text-foreground">{scanResult.totalFolders}</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Projects:</span>
            <span className="font-semibold text-success">{scanResult.validProjects}</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Breadcrumbs:</span>
            <span className="font-semibold text-success">{validBreadcrumbs}</span>
            {invalidBreadcrumbs > 0 && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold text-destructive">{invalidBreadcrumbs}</span>
              </>
            )}
            {missingBreadcrumbs > 0 && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold text-warning">{missingBreadcrumbs}</span>
              </>
            )}
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-semibold text-foreground">
              {formatFileSize(scanResult.totalFolderSize)}
            </span>
          </div>
          {scanResult.errors.length > 0 && (
            <>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Errors:</span>
                <span className="font-semibold text-destructive">{scanResult.errors.length}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
