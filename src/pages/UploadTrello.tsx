import { Button } from '@components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@components/ui/dialog'
import { open } from '@tauri-apps/plugin-shell'
import {
  useAppendBreadcrumbs,
  useAppendVideoInfo,
  useBreadcrumb,
  useParsedTrelloDescription,
  useTrelloBoard,
  useTrelloCardDetails,
  useVideoInfoBlock
} from 'hooks'
import { ExternalLink } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { appStore } from 'store/useAppStore'
import CardDetailsAccordion from 'utils/trello/CardDetailsAccordion'
import TooltipPreview from 'utils/trello/TooltipPreview'
import TrelloCardList from 'utils/trello/TrelloCardList'
import VideoInfoTooltip from 'utils/trello/VideoInfoTooltip'
import { Breadcrumb, SproutUploadResponse } from 'utils/types'

const UploadTrello = () => {
  // Hard-coded boardId for 'small projects'
  const boardId = '55a504d70bed2bd21008dc5a'

  const [selectedCard, setSelectedCard] = useState<{ id: string; name: string } | null>(
    null
  )

  // Page label - shadcn breadcrumb component
  useBreadcrumb([
    { label: 'Upload content', href: '/upload/trello' },
    { label: 'Trello' }
  ])

  const { grouped, isLoading: isBoardLoading, apiKey, token } = useTrelloBoard(boardId)

  const breadcrumbs: Breadcrumb = appStore.getState().breadcrumbs

  const {
    card: selectedCardDetails,
    members,
    isLoading: isCardLoading,
    refetchCard,
    refetchMembers
  } = useTrelloCardDetails(selectedCard?.id ?? null, apiKey, token)

  useEffect(() => {
    if (selectedCard && selectedCard.id && apiKey && token) {
      refetchCard()
      refetchMembers()
    }
  }, [selectedCard?.id, apiKey, token, refetchCard, refetchMembers, selectedCard])

  useEffect(() => {
    if (selectedCard && !selectedCardDetails && !isCardLoading) {
      setSelectedCard(null)
    }
  }, [selectedCard, selectedCardDetails, isCardLoading])

  const { getBreadcrumbsBlock, applyBreadcrumbsToCard } = useAppendBreadcrumbs(
    apiKey,
    token
  )
  const { applyVideoInfoToCard } = useAppendVideoInfo(apiKey, token)

  const state = appStore.getState()
  let uploadedVideo: SproutUploadResponse | null = null

  if (state?.latestSproutUpload) {
    // Provide default values for missing properties
    const defaultResponse: SproutUploadResponse = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      height: 0,
      width: 0,
      description: '', // Ensure this is provided with a default value if not present in state.latestSproutUpload
      id: '',
      plays: 0,
      title: '',
      source_video_file_size: 0,
      embed_code: '',
      state: 'default_state', // Replace with the actual default state value
      security_token: '', // Provide a default or appropriate value
      progress: 0, // Default progress value
      tags: [], // Empty array if no tags are provided
      embedded_url: null, // Null as a default value
      duration: 0,
      password: null, // Null as a default value
      privacy: 0, // Default privacy value
      requires_signed_embeds: false, // Default boolean value
      selected_poster_frame_number: 0, // Default frame number
      assets: {
        videos: {
          '240p': '',
          '360p': '',
          '480p': '',
          '720p': '',
          '1080p': '',
          '2k': null,
          '4k': null,
          '8k': null,
          source: null
        },
        thumbnails: [],
        poster_frames: [],
        poster_frame_mp4: null,
        timeline_images: [],
        hls_manifest: ''
      },
      download_sd: null,
      download_hd: null,
      download_source: null,
      allowed_domains: null,
      allowed_ips: null,
      player_social_sharing: null,
      player_embed_sharing: null,
      require_email: false,
      require_name: false,
      hide_on_site: false,
      folder_id: null,
      airplay_support: null,
      session_watermarks: null,
      direct_file_access: null
    }

    // Merge the default response with state.latestSproutUpload to ensure all properties are covered
    uploadedVideo = { ...defaultResponse, ...state.latestSproutUpload }
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
        <div className="px-4 mx-4">
          <TrelloCardList grouped={grouped} onSelect={setSelectedCard} />
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
                        const block = await getBreadcrumbsBlock(
                          selectedCardDetails ?? null
                        )
                        if (block && selectedCardDetails) {
                          await applyBreadcrumbsToCard(selectedCardDetails, block)
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
