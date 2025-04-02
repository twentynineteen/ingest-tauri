// src/hooks/useAppendBreadcrumbs.ts
import { useQueryClient } from '@tanstack/react-query'
import { ask, confirm, open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useAppStore } from 'src/store/useAppStore'
import { TrelloCard } from 'src/utils/TrelloCards'

export function useAppendBreadcrumbs(apiKey: string | null, token: string | null) {
  const queryClient = useQueryClient()

  const getBreadcrumbsBlock = async (card: TrelloCard | null): Promise<string | null> => {
    if (!card || !apiKey || !token) return null

    try {
      const breadcrumbs = useAppStore.getState().breadcrumbs

      const useCurrent = await ask(
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
          const fileContents = await readTextFile(selectedFile)
          finalBreadcrumbs = JSON.parse(fileContents)
        } else {
          return null // User canceled file selection
        }
      }

      const breadcrumbMarker = '```json\n// BREADCRUMBS'
      const breadcrumbsBlock = `${breadcrumbMarker}\n${JSON.stringify(finalBreadcrumbs, null, 2)}\n\`\`\``

      return breadcrumbsBlock
    } catch (err) {
      console.error('Failed to prepare breadcrumbs:', err)
      return null
    }
  }

  const applyBreadcrumbsToCard = async (card: TrelloCard, breadcrumbsBlock: string) => {
    const currentDesc = card.desc ?? ''
    const regex = /```json\n\/\/ BREADCRUMBS[\s\S]*?```/g
    const hasBreadcrumbs = regex.test(currentDesc)

    let updatedDesc = currentDesc

    if (hasBreadcrumbs) {
      const shouldReplace = await confirm(
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

    await queryClient.invalidateQueries({ queryKey: ['trello-card', card.id] })
  }

  return { getBreadcrumbsBlock, applyBreadcrumbsToCard }
}
