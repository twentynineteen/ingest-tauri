/**
 * Baker Trello Integration Hook
 *
 * Handles complex Trello card updating logic for Baker batch operations.
 */

import { readTextFile } from '@tauri-apps/plugin-fs'
import { useCallback } from 'react'

interface TrelloError {
  project: string
  error: string
}

interface UseBakerTrelloIntegrationProps {
  apiKey?: string
  token?: string
}

interface UseBakerTrelloIntegrationResult {
  updateTrelloCards: (projectPaths: string[]) => Promise<TrelloError[]>
}

export function useBakerTrelloIntegration({
  apiKey,
  token
}: UseBakerTrelloIntegrationProps): UseBakerTrelloIntegrationResult {
  const updateTrelloCards = useCallback(
    async (projectPaths: string[]): Promise<TrelloError[]> => {
      const trelloErrors: TrelloError[] = []

      // Only proceed if we have API credentials
      if (!apiKey || !token) {
        return trelloErrors
      }

      for (const projectPath of projectPaths) {
        try {
          // Read the updated breadcrumbs file
          const breadcrumbsPath = `${projectPath}/breadcrumbs.json`
          const breadcrumbsContent = await readTextFile(breadcrumbsPath)
          const breadcrumbsData = JSON.parse(breadcrumbsContent)

          // Check if this project has a linked Trello card
          if (breadcrumbsData.trelloCardUrl) {
            // Extract card ID from URL
            const cardIdMatch = breadcrumbsData.trelloCardUrl.match(/\/c\/([^/]+)/)
            if (cardIdMatch) {
              const cardId = cardIdMatch[1]

              // Create a mock TrelloCard object for the API call
              const mockCard = {
                id: cardId,
                desc: '',
                name: 'Baker Update',
                idList: ''
              }

              // Use the core utility functions with the specific breadcrumbs data
              const { generateBreadcrumbsBlock, updateTrelloCardWithBreadcrumbs } =
                await import('hooks/useAppendBreadcrumbs')

              const block = generateBreadcrumbsBlock(breadcrumbsData)
              if (block) {
                await updateTrelloCardWithBreadcrumbs(mockCard, block, apiKey, token, {
                  autoReplace: true,
                  silentErrors: true
                })
              }
            }
          }
        } catch (trelloError) {
          const projectName = projectPath.split('/').pop() || projectPath
          trelloErrors.push({
            project: projectName,
            error:
              trelloError instanceof Error ? trelloError.message : String(trelloError)
          })
          console.warn(`Failed to update Trello card for ${projectPath}:`, trelloError)
        }
      }

      return trelloErrors
    },
    [apiKey, token]
  )

  return {
    updateTrelloCards
  }
}
