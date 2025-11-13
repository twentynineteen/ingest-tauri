import { Button } from '@components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@components/ui/dialog'
import { Input } from '@components/ui/input'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { open } from '@tauri-apps/plugin-shell'
import {
  useAppendBreadcrumbs,
  useAppendVideoInfo,
  useBreadcrumb,
  useFuzzySearch,
  useParsedTrelloDescription,
  useTrelloBoard,
  useTrelloCardDetails,
  useVideoInfoBlock
} from 'hooks'
import { ExternalLink, Search } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { appStore } from 'store/useAppStore'
import CardDetailsAccordion from 'utils/trello/CardDetailsAccordion'
import TooltipPreview from 'utils/trello/TooltipPreview'
import TrelloCardList from 'utils/trello/TrelloCardList'
import VideoInfoTooltip from 'utils/trello/VideoInfoTooltip'
import { TrelloCard } from 'utils/TrelloCards'
import { Breadcrumb, SproutUploadResponse } from 'utils/types'
import { useCardDetailsSync, useCardValidation } from './UploadTrello/UploadTrelloHooks'
import {
  createDefaultSproutUploadResponse,
  SelectedCard
} from './UploadTrello/UploadTrelloTypes'

const UploadTrello = () => {
  // Hard-coded boardId for 'small projects'
  const boardId = '55a504d70bed2bd21008dc5a'

  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null)

  // Page label - shadcn breadcrumb component
  useBreadcrumb([
    { label: 'Upload content', href: '/upload/trello' },
    { label: 'Trello' }
  ])

  const { grouped, isLoading: isBoardLoading, apiKey, token } = useTrelloBoard(boardId)

  // Flatten all cards for search
  const allCards = useMemo(() => {
    const cards: TrelloCard[] = []
    Object.values(grouped).forEach(cardList => {
      cards.push(...cardList)
    })
    return cards
  }, [grouped])

  // Use fuzzy search hook
  const {
    searchTerm,
    setSearchTerm,
    results: filteredCards
  } = useFuzzySearch(allCards, {
    keys: ['name', 'desc'],
    threshold: 0.4
  })

  // Re-group filtered cards by list
  const filteredGrouped = useMemo(() => {
    if (!searchTerm.trim()) {
      return grouped
    }

    const result: Record<string, TrelloCard[]> = {}
    filteredCards.forEach(card => {
      Object.entries(grouped).forEach(([listName, cards]) => {
        if (cards.some(c => c.id === card.id)) {
          if (!result[listName]) {
            result[listName] = []
          }
          result[listName].push(card)
        }
      })
    })
    return result
  }, [searchTerm, filteredCards, grouped])

  const breadcrumbs: Breadcrumb = appStore.getState().breadcrumbs

  const {
    card: selectedCardDetails,
    members,
    isLoading: isCardLoading,
    refetchCard,
    refetchMembers
  } = useTrelloCardDetails(selectedCard?.id ?? null, apiKey, token)

  useCardDetailsSync(selectedCard, apiKey, token, refetchCard, refetchMembers)

  useCardValidation(selectedCard, selectedCardDetails, isCardLoading, () =>
    setSelectedCard(null)
  )

  const { getBreadcrumbsBlock, applyBreadcrumbsToCard } = useAppendBreadcrumbs(
    apiKey,
    token
  )
  const { applyVideoInfoToCard } = useAppendVideoInfo(apiKey, token)

  const state = appStore.getState()
  let uploadedVideo: SproutUploadResponse | null = null

  if (state?.latestSproutUpload) {
    uploadedVideo = {
      ...createDefaultSproutUploadResponse(),
      ...state.latestSproutUpload
    }
  }

  const rawDescription = selectedCardDetails?.desc ?? ''
  const { videoInfoData, videoInfoBlock } = useVideoInfoBlock(rawDescription)
  const { mainDescription, breadcrumbsData, breadcrumbsBlock } =
    useParsedTrelloDescription(rawDescription)

  if (isBoardLoading || isCardLoading) return <div>Loading...</div>

  return (
    <>
      <div className="w-full pb-4 border-b mb-4">
        <h2 className="px-4 text-2xl font-semibold flex items-center gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M7 7h3v9H7zm7 0h3v5h-3z" />
            </g>
          </svg>
          Trello: Small Projects
        </h2>
        <div className="px-4 mx-4 mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search cards by name or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            {Object.keys(filteredGrouped).length > 0 ? (
              <TrelloCardList grouped={filteredGrouped} onSelect={setSelectedCard} />
            ) : (
              <p className="text-center text-gray-500 py-8">
                {searchTerm.trim()
                  ? 'No cards found matching your search.'
                  : 'No cards available.'}
              </p>
            )}
          </div>
        </div>
      </div>
      {selectedCard && (
        <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCard.name}</DialogTitle>
              <DialogDescription>Card ID: {selectedCard.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isCardLoading ? (
                <p>Loading card details...</p>
              ) : (
                <>
                  {members && members.length > 0 && (
                    <div>
                      <h3 className="font-semibold">Members</h3>
                      <ul className="list-disc ml-5 text-sm">
                        {members.map(member => (
                          <li key={member.id}>{member.fullName}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedCardDetails && (
                    <div className="space-y-4">
                      <CardDetailsAccordion
                        description={mainDescription}
                        breadcrumbsData={breadcrumbsData}
                        breadcrumbsBlock={breadcrumbsBlock}
                        videoInfoBlock={videoInfoBlock}
                        videoInfoData={videoInfoData}
                      />
                    </div>
                  )}
                </>
              )}
              <div className="pt-4 flex justify-between gap-4 items-center">
                <TooltipPreview
                  trigger={
                    <Button
                      onClick={async () => {
                        if (!selectedCardDetails) return

                        // First, add the Trello card URL to the breadcrumbs data
                        const currentBreadcrumbs = appStore.getState().breadcrumbs
                        const trelloCardUrl = `https://trello.com/c/${selectedCardDetails.id}`
                        const updatedBreadcrumbs = {
                          ...currentBreadcrumbs,
                          trelloCardUrl
                        }

                        // Temporarily update the in-app store so getBreadcrumbsBlock includes the URL
                        appStore.getState().setBreadcrumbs(updatedBreadcrumbs)

                        const block = await getBreadcrumbsBlock(selectedCardDetails)
                        if (block && selectedCardDetails) {
                          await applyBreadcrumbsToCard(selectedCardDetails, block)

                          // Save the updated breadcrumbs to the local file if we have the path info
                          if (
                            currentBreadcrumbs &&
                            currentBreadcrumbs.parentFolder &&
                            currentBreadcrumbs.projectTitle
                          ) {
                            const breadcrumbsPath = `${currentBreadcrumbs.parentFolder}/${currentBreadcrumbs.projectTitle}/breadcrumbs.json`
                            try {
                              await writeTextFile(
                                breadcrumbsPath,
                                JSON.stringify(updatedBreadcrumbs, null, 2)
                              )
                            } catch (error) {
                              // You may want to replace this with a toast or notification
                              alert(
                                'Failed to save breadcrumbs: ' + (error?.message || error)
                              )
                              console.error('Failed to write breadcrumbs file:', error)
                            }
                          }

                          // Refresh card details to show updated breadcrumbs
                          refetchCard()
                        }
                      }}
                    >
                      Append Breadcrumbs
                    </Button>
                  }
                  content={
                    breadcrumbs
                      ? JSON.stringify(breadcrumbs, null, 2)
                      : 'No breadcrumbs selected'
                  }
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (selectedCard) {
                      const url = new URL(`https://trello.com/c/${selectedCard.id}`)
                      await open(url.toString())
                    }
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Trello
                </Button>
                <Button onClick={() => setSelectedCard(null)}>Close</Button>
              </div>
              {uploadedVideo && (
                <div className="pt-4">
                  <TooltipPreview
                    trigger={
                      <Button
                        disabled={!uploadedVideo}
                        onClick={async () => {
                          if (selectedCardDetails && uploadedVideo) {
                            await applyVideoInfoToCard(selectedCardDetails, uploadedVideo)
                            // Refresh card details to show updated video info
                            refetchCard()
                          }
                        }}
                      >
                        Append Video Info
                      </Button>
                    }
                    content={
                      uploadedVideo ? (
                        <VideoInfoTooltip video={uploadedVideo} />
                      ) : (
                        'No uploaded video found.'
                      )
                    }
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default UploadTrello
