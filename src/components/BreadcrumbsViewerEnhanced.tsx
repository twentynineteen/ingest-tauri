/**
 * Enhanced BreadcrumbsViewer Component with Change Preview
 *
 * Displays breadcrumbs.json files with side-by-side preview of changes
 * that Baker will make during updates.
 */

import type { BreadcrumbsViewerProps } from '@/types/baker'
import { Eye, EyeOff, File } from 'lucide-react'
import React from 'react'
import { NormalView } from './BreadcrumbsViewer/NormalView'
import { PreviewComparison } from './BreadcrumbsViewer/PreviewComparison'
import { Button } from './ui/button'

export const BreadcrumbsViewerEnhanced: React.FC<BreadcrumbsViewerProps> = ({
  breadcrumbs,
  projectPath,
  previewMode = false,
  preview,
  onTogglePreview,
  trelloApiKey,
  trelloApiToken
}) => {
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-4 text-sm">
      <div className="border-b border-border pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-foreground flex items-center">
              <File className="h-4 w-4 mr-2" />
              Breadcrumbs.json
              {previewMode && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  Preview Mode
                </span>
              )}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">{projectPath}</p>
          </div>
          {onTogglePreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePreview}
              className="flex items-center"
            >
              {previewMode ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {previewMode && preview ? (
        <PreviewComparison preview={preview} />
      ) : (
        <NormalView
          breadcrumbs={breadcrumbs}
          projectPath={projectPath}
          trelloApiKey={trelloApiKey}
          trelloApiToken={trelloApiToken}
        />
      )}
    </div>
  )
}
