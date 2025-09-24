import { useQueryClient } from '@tanstack/react-query'
import { ask, confirm, open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { appStore } from 'store/useAppStore'
import { TrelloCard } from 'utils/TrelloCards'
import { Breadcrumb } from 'utils/types'

function formatBreadcrumbsForHumans(breadcrumbs: Breadcrumb): string {
  const lines = [
    'PROJECT DETAILS',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ]

  if (breadcrumbs.projectTitle) {
    lines.push(`Project: ${breadcrumbs.projectTitle}`)
  }

  if (breadcrumbs.numberOfCameras) {
    lines.push(`Cameras: ${breadcrumbs.numberOfCameras} cameras`)
  }

  if (breadcrumbs.parentFolder) {
    lines.push(`Location: ${breadcrumbs.parentFolder}`)
  }

  if (breadcrumbs.createdBy) {
    const creator = typeof breadcrumbs.createdBy === 'string' 
      ? breadcrumbs.createdBy 
      : breadcrumbs.createdBy?.data || 'Unknown User'
    lines.push(`Created by: ${creator}`)
  }

  if (breadcrumbs.creationDateTime) {
    lines.push(`Created: ${breadcrumbs.creationDateTime}`)
  }

  if (breadcrumbs.files && breadcrumbs.files.length > 0) {
    const totalFiles = breadcrumbs.files.length
    lines.push(`Files: ${totalFiles} footage files total`)

    // Group files by camera
    const filesByCamera: Record<number, number> = {}
    breadcrumbs.files.forEach(file => {
      filesByCamera[file.camera] = (filesByCamera[file.camera] || 0) + 1
    })

    Object.entries(filesByCamera)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([camera, count]) => {
        lines.push(`   • Camera ${camera}: ${count} files`)
      })
  }

  return lines.join('\n')
}

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

      const humanReadableSummary = formatBreadcrumbsForHumans(finalBreadcrumbs)
      const breadcrumbMarker = '```json\n// BREADCRUMBS'
      const technicalBlock = `${breadcrumbMarker}\n${JSON.stringify(finalBreadcrumbs, null, 2)}\n\`\`\``
      
      const breadcrumbsBlock = `${humanReadableSummary}\n\n---\n*Technical details for Bucket app below:*\n${technicalBlock}`

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
    
    // Check for both new dual-format and legacy JSON-only breadcrumbs
    const newFormatRegex = /PROJECT DETAILS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[\s\S]*?```json\n\/\/ BREADCRUMBS[\s\S]*?```/g
    const legacyFormatRegex = /```json\n\/\/ BREADCRUMBS[\s\S]*?```/g
    
    const hasNewFormatBreadcrumbs = newFormatRegex.test(currentDesc)
    const hasLegacyFormatBreadcrumbs = legacyFormatRegex.test(currentDesc) && !hasNewFormatBreadcrumbs
    const hasBreadcrumbs = hasNewFormatBreadcrumbs || hasLegacyFormatBreadcrumbs
    
    // Use the appropriate regex for replacement
    const regex = hasNewFormatBreadcrumbs ? newFormatRegex : legacyFormatRegex

    let updatedDesc = currentDesc

    if (hasBreadcrumbs) {
      const breadcrumbsType = hasNewFormatBreadcrumbs ? 'project details' : 'legacy breadcrumbs'
      const warningMessage = `This Trello card already contains ${breadcrumbsType} from a previous project link.\n\nReplacing them will remove the existing project connection and add the new one.\n\nDo you want to continue?`
      
      const shouldReplace: boolean = await confirm(
        warningMessage,
        {
          title: 'Breadcrumbs Already Exist',
          okLabel: 'Replace Existing',
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
