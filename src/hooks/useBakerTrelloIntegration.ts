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

/**
 * Extract card ID from Trello URL
 */
function extractCardIdFromUrl(trelloCardUrl: string): string | null {
  const cardIdMatch = trelloCardUrl.match(/\/c\/([^/]+)/)
  return cardIdMatch ? cardIdMatch[1] : null
}

/**
 * Update a single project's Trello card with breadcrumbs data
 */
async function updateProjectTrelloCard(
  breadcrumbsData: Record<string, unknown>,
  apiKey: string,
  token: string
): Promise<void> {
  const trelloCardUrl = breadcrumbsData.trelloCardUrl as string | undefined
  if (!trelloCardUrl) return

  const cardId = extractCardIdFromUrl(trelloCardUrl)
  if (!cardId) return

  // Create a mock TrelloCard object for the API call
  const mockCard = {
    id: cardId,
    desc: '',
    name: 'Baker Update',
    idList: ''
  }

  // Use the core utility functions with the specific breadcrumbs data
  const { generateBreadcrumbsBlock, updateTrelloCardWithBreadcrumbs } = await import(
    'hooks/useAppendBreadcrumbs'
  )

  const block = generateBreadcrumbsBlock(breadcrumbsData)
  if (!block) return

  await updateTrelloCardWithBreadcrumbs(mockCard, block, apiKey, token, {
    autoReplace: true,
    silentErrors: true
  })
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

          await updateProjectTrelloCard(breadcrumbsData, apiKey, token)
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
