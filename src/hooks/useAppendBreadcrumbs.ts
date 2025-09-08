import { useQueryClient } from '@tanstack/react-query'
import { ask, confirm, open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { appStore } from 'store/useAppStore'
import { TrelloCard } from 'utils/TrelloCards'

export function useAppendBreadcrumbs(
  apiKey: string | null,
  token: string | null
): {
  getBreadcrumbsBlock: (card: TrelloCard | null) => Promise<string | null>
  applyBreadcrumbsToCard: (card: TrelloCard, breadcrumbsBlock: string) => Promise<void>
} {
  const queryClient = useQueryClient()

  async function getBreadcrumbsBlock(card: TrelloCard | null): Promise<string | null> {
    if (!card || !apiKey || !token) return null

    try {
      const breadcrumbs = appStore.getState().breadcrumbs

      const useCurrent: boolean = await ask(
        'Use current in-app breadcrumbs? Click "No" to load from a JSON file.',
        {
          title: 'Choose Breadcrumb Source',
          okLabel: 'Use Current',
          cancelLabel: 'Load from File'
        }
      )

      let finalBreadcrumbs = breadcrumbs

      if (!useCurrent) {
        const selectedFile = await open({
          multiple: false,
          filters: [{ name: 'JSON Files', extensions: ['json'] }]
        })
        if (typeof selectedFile === 'string') {
          const fileContents: string = await readTextFile(selectedFile)
          finalBreadcrumbs = JSON.parse(fileContents)
        } else {
          return null // User canceled file selection
        }
      }

      const breadcrumbMarker = '```json\n// BREADCRUMBS'
      const breadcrumbsBlock: string = `${breadcrumbMarker}\n${JSON.stringify(finalBreadcrumbs, null, 2)}\n\`\`\``

      return breadcrumbsBlock
    } catch (err) {
      console.error('Failed to prepare breadcrumbs:', err)
      return null
    }
  }

  async function applyBreadcrumbsToCard(
    card: TrelloCard,
    breadcrumbsBlock: string
  ): Promise<void> {
    const currentDesc = card.desc ?? ''
    const regex = /```json\n\/\/ BREADCRUMBS[\s\S]*?```/g
    const hasBreadcrumbs = regex.test(currentDesc)

    let updatedDesc = currentDesc

    if (hasBreadcrumbs) {
      const shouldReplace: boolean = await confirm(
        'This card already contains breadcrumbs. Replace them?',
        {
          title: 'Replace Breadcrumbs',
          okLabel: 'Yes',
          cancelLabel: 'Cancel'
        }
      )
      if (!shouldReplace) return
      updatedDesc = currentDesc.replace(regex, breadcrumbsBlock)
    } else {
      updatedDesc = `${currentDesc}\n\n${breadcrumbsBlock}`
    }

    const response = await fetch(
      `https://api.trello.com/1/cards/${card.id}?key=${apiKey}&token=${token}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desc: updatedDesc })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update card: ${response.statusText}`)
    }

    // Add a comment to the card indicating breadcrumbs were linked
    const commentResponse = await fetch(
      `https://api.trello.com/1/cards/${card.id}/actions/comments?key=${apiKey}&token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: 'Linked this card to the project and left some breadcrumbs...' 
        })
      }
    )

    if (!commentResponse.ok) {
      console.warn(`Failed to add comment: ${commentResponse.statusText}`)
    }

    await queryClient.invalidateQueries({ queryKey: ['trello-card', card.id] })
  }

  return { getBreadcrumbsBlock, applyBreadcrumbsToCard }
}
