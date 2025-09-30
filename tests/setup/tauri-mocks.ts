import { mockIPC } from '@tauri-apps/api/mocks'
import type { BreadcrumbsFile, VideoLink, TrelloCard } from '../../src/types/baker'

export function setupTauriMocks() {
  // Mock breadcrumbs file storage (in-memory)
  const mockBreadcrumbsStore = new Map<string, BreadcrumbsFile>()

  mockIPC((cmd, args) => {
    switch (cmd) {
      case 'baker_get_video_links': {
        const breadcrumbs = mockBreadcrumbsStore.get(args.projectPath as string)
        return Promise.resolve(breadcrumbs?.videoLinks ?? [])
      }

      case 'baker_associate_video_link': {
        const projectPath = args.projectPath as string
        const videoLink = args.videoLink as VideoLink
        const existing =
          mockBreadcrumbsStore.get(projectPath) || createEmptyBreadcrumbs(projectPath)

        // Validate max 20 videos
        if ((existing.videoLinks?.length ?? 0) >= 20) {
          return Promise.reject('Maximum of 20 videos per project reached')
        }

        existing.videoLinks = [...(existing.videoLinks ?? []), videoLink]
        existing.lastModified = new Date().toISOString()
        mockBreadcrumbsStore.set(projectPath, existing)
        return Promise.resolve(existing)
      }

      case 'baker_remove_video_link': {
        const projectPath = args.projectPath as string
        const videoIndex = args.videoIndex as number
        const breadcrumbs = mockBreadcrumbsStore.get(projectPath)

        if (!breadcrumbs || !breadcrumbs.videoLinks) {
          return Promise.reject('No videos found')
        }

        if (videoIndex < 0 || videoIndex >= breadcrumbs.videoLinks.length) {
          return Promise.reject('Video index out of bounds')
        }

        breadcrumbs.videoLinks.splice(videoIndex, 1)
        breadcrumbs.lastModified = new Date().toISOString()
        return Promise.resolve(breadcrumbs)
      }

      case 'baker_update_video_link': {
        const projectPath = args.projectPath as string
        const videoIndex = args.videoIndex as number
        const updatedLink = args.updatedLink as VideoLink
        const breadcrumbs = mockBreadcrumbsStore.get(projectPath)

        if (!breadcrumbs || !breadcrumbs.videoLinks) {
          return Promise.reject('No videos found')
        }

        if (videoIndex < 0 || videoIndex >= breadcrumbs.videoLinks.length) {
          return Promise.reject('Video index out of bounds')
        }

        breadcrumbs.videoLinks[videoIndex] = updatedLink
        breadcrumbs.lastModified = new Date().toISOString()
        return Promise.resolve(breadcrumbs)
      }

      case 'baker_reorder_video_links': {
        const projectPath = args.projectPath as string
        const fromIndex = args.fromIndex as number
        const toIndex = args.toIndex as number
        const breadcrumbs = mockBreadcrumbsStore.get(projectPath)

        if (!breadcrumbs || !breadcrumbs.videoLinks) {
          return Promise.reject('No videos found')
        }

        const videos = breadcrumbs.videoLinks
        if (fromIndex < 0 || fromIndex >= videos.length || toIndex < 0 || toIndex >= videos.length) {
          return Promise.reject('Index out of bounds')
        }

        // Move item from fromIndex to toIndex
        const [removed] = videos.splice(fromIndex, 1)
        videos.splice(toIndex, 0, removed)

        breadcrumbs.lastModified = new Date().toISOString()
        return Promise.resolve(breadcrumbs)
      }

      case 'baker_get_trello_cards': {
        const breadcrumbs = mockBreadcrumbsStore.get(args.projectPath as string)
        if (!breadcrumbs) {
          return Promise.resolve([])
        }

        // Migration: If no trelloCards array but trelloCardUrl exists, migrate in-memory
        if (!breadcrumbs.trelloCards && breadcrumbs.trelloCardUrl) {
          const match = breadcrumbs.trelloCardUrl.match(/trello\.com\/c\/([a-zA-Z0-9]{8,24})/)
          if (match) {
            const cardId = match[1]
            return Promise.resolve([{
              url: breadcrumbs.trelloCardUrl,
              cardId,
              title: `Card ${cardId}` // Default title for migrated cards
            }])
          }
        }

        return Promise.resolve(breadcrumbs.trelloCards ?? [])
      }

      case 'baker_associate_trello_card': {
        const projectPath = args.projectPath as string
        const trelloCard = args.trelloCard as TrelloCard
        const existing =
          mockBreadcrumbsStore.get(projectPath) || createEmptyBreadcrumbs(projectPath)

        // Validate max 10 cards
        if ((existing.trelloCards?.length ?? 0) >= 10) {
          return Promise.reject('Maximum of 10 Trello cards per project reached')
        }

        // Check for duplicate cardId
        if (existing.trelloCards?.some((c) => c.cardId === trelloCard.cardId)) {
          return Promise.reject('This Trello card is already associated with the project')
        }

        existing.trelloCards = [...(existing.trelloCards ?? []), trelloCard]
        // Update backward-compatible field
        if (existing.trelloCards.length === 1) {
          existing.trelloCardUrl = trelloCard.url
        }
        existing.lastModified = new Date().toISOString()
        mockBreadcrumbsStore.set(projectPath, existing)
        return Promise.resolve(existing)
      }

      case 'baker_remove_trello_card': {
        const projectPath = args.projectPath as string
        const cardIndex = args.cardIndex as number
        const breadcrumbs = mockBreadcrumbsStore.get(projectPath)

        if (!breadcrumbs || !breadcrumbs.trelloCards) {
          return Promise.reject('No cards found')
        }

        if (cardIndex < 0 || cardIndex >= breadcrumbs.trelloCards.length) {
          return Promise.reject('Card index out of bounds')
        }

        breadcrumbs.trelloCards.splice(cardIndex, 1)
        // Update backward-compatible field
        breadcrumbs.trelloCardUrl =
          breadcrumbs.trelloCards.length > 0 ? breadcrumbs.trelloCards[0].url : undefined
        breadcrumbs.lastModified = new Date().toISOString()
        return Promise.resolve(breadcrumbs)
      }

      case 'baker_fetch_trello_card_details': {
        const cardUrl = args.cardUrl as string
        const apiKey = args.apiKey as string
        const apiToken = args.apiToken as string

        // Extract cardId from URL
        const match = cardUrl.match(/trello\.com\/c\/([a-zA-Z0-9]{8,24})/)
        if (!match) {
          return Promise.reject('Invalid Trello card URL format')
        }

        const cardId = match[1]

        // This will be intercepted by MSW in actual tests
        return fetch(
          `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${apiToken}`
        ).then((res) => {
          if (!res.ok) {
            if (res.status === 401) {
              return Promise.reject('Unauthorized: Invalid API credentials')
            }
            if (res.status === 404) {
              return Promise.reject('Card not found')
            }
            return Promise.reject(`API error: ${res.status}`)
          }
          return res.json().then((data) => ({
            url: cardUrl,
            cardId,
            title: data.name,
            boardName: data.idBoard ? 'Mock Board Name' : undefined,
            lastFetched: new Date().toISOString()
          }))
        })
      }

      default:
        throw new Error(`Unmocked Tauri command: ${cmd}`)
    }
  })

  return {
    setBreadcrumbs: (path: string, breadcrumbs: BreadcrumbsFile) => {
      mockBreadcrumbsStore.set(path, breadcrumbs)
    },
    getBreadcrumbs: (path: string) => mockBreadcrumbsStore.get(path),
    clearMocks: () => mockBreadcrumbsStore.clear()
  }
}

function createEmptyBreadcrumbs(projectPath: string): BreadcrumbsFile {
  return {
    projectTitle: projectPath.split('/').pop() || 'Test Project',
    numberOfCameras: 0,
    files: [],
    parentFolder: projectPath.split('/').slice(0, -1).join('/'),
    createdBy: 'test@example.com',
    creationDateTime: new Date().toISOString()
  }
}