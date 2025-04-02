import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@components/components/ui/accordion'
import { Button } from '@components/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@components/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@components/components/ui/tooltip'
import { openPath } from '@tauri-apps/plugin-opener'
import { format, parse } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useAppendBreadcrumbs } from 'src/hooks/useAppendBreadcrumbs'
import { useTrelloBoard } from 'src/hooks/useTrelloBoard'
import { useTrelloCardDetails } from 'src/hooks/useTrelloCardDetails'
import { appStore } from 'src/store/useAppStore'
import { Breadcrumb } from 'src/utils/types'

const UploadTrello = () => {
  // Hard coded boardId for 'small projects'
  const boardId = '55a504d70bed2bd21008dc5a'
  const [selectedCard, setSelectedCard] = useState<{ id: string; name: string } | null>(
    null
  )

  // Open in trello via browser
  const cardUrl = selectedCard ? `https://trello.com/c/${selectedCard.id}` : ''

  const { grouped, isLoading, apiKey, token } = useTrelloBoard(boardId)

  const breadcrumbs: Breadcrumb = appStore.getState().breadcrumbs

  const {
    card: cardDetails,
    members,
    isLoading: isCardLoading,
    refetchCard,
    refetchMembers
  } = useTrelloCardDetails(selectedCard?.id ?? null, apiKey, token)

  // Refresh card
  useEffect(() => {
    if (selectedCard && selectedCard.id && apiKey && token) {
      refetchCard()
      refetchMembers()
    }
  }, [selectedCard?.id, apiKey, token])

  // gracefully handle setSelectedCard if API fetch fails or returns null
  useEffect(() => {
    if (selectedCard && !cardDetails && !isCardLoading) {
      setSelectedCard(null)
    }
  }, [selectedCard, cardDetails, isCardLoading])

  const { getBreadcrumbsBlock, applyBreadcrumbsToCard } = useAppendBreadcrumbs(
    apiKey,
    token
  )

  // split description and breadcrumbs into separate accordions
  const rawDescription = cardDetails?.desc ?? ''
  const { mainDescription, breadcrumbsData, breadcrumbsBlock } = useMemo(() => {
    const breadcrumbRegex = /```json\n\/\/ BREADCRUMBS\n([\s\S]*?)```/m
    const match = rawDescription.match(breadcrumbRegex)

    const data = match ? JSON.parse(match[1]) : null
    const main = rawDescription.split(breadcrumbRegex)[0]
    const block = match?.[0] ?? null

    return {
      mainDescription: main,
      breadcrumbsData: data,
      breadcrumbsBlock: block
    }
  }, [rawDescription])

  if (isLoading || isCardLoading) return <div>Loading...</div>

  return (
    <>
      <div className="w-full pb-4 border-b mb-4">
        <h2 className="px-4 text-2xl font-semibold flex flex-row items-center gap-4">
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
          <div className="flex flex-col items-start space-y-4 mt-4">
            {/* Display trello cards here */}
            {Object.entries(grouped).length > 0 ? (
              <div>
                {Object.entries(grouped).map(([listName, cards]) => (
                  <div key={listName}>
                    <h2 className="text-lg font-semibold mt-4">{listName}</h2>
                    <ul className="list-disc ml-5">
                      {cards.map(card => (
                        <li
                          key={card.id}
                          className="hover:bg-gray-200 px-3 py-1 rounded transition-colors cursor-pointer"
                        >
                          <span
                            onClick={() =>
                              setSelectedCard({ id: card.id, name: card.name })
                            }
                          >
                            {card.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p>No cards found.</p>
            )}
          </div>
        </div>
      </div>
      {selectedCard && (
        <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCard?.name}</DialogTitle>
              <DialogDescription>Card ID: {selectedCard?.id}</DialogDescription>
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

                  {cardDetails && (
                    <div className="space-y-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="description">
                          <AccordionTrigger className="focus:outline-none focus-visible:outline-none">
                            Description
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="max-h-48 overflow-auto rounded border bg-muted p-3 text-sm whitespace-pre-wrap focus:outline-none focus-visible:outline-none">
                              {mainDescription.trim() || 'No description.'}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {breadcrumbsBlock && (
                          <AccordionItem value="breadcrumbs">
                            <AccordionTrigger className="font-semibold">
                              Breadcrumbs
                            </AccordionTrigger>
                            <AccordionContent>
                              {breadcrumbsData ? (
                                <div className="space-y-2 text-sm text-muted-foreground">
                                  {breadcrumbsData.projectTitle && (
                                    <p>
                                      <span className="font-medium text-foreground">
                                        Project Title:
                                      </span>{' '}
                                      {breadcrumbsData.projectTitle}
                                    </p>
                                  )}
                                  {breadcrumbsData.createdBy && (
                                    <p>
                                      <span className="font-medium text-foreground">
                                        Created By:
                                      </span>{' '}
                                      {breadcrumbsData.createdBy}
                                    </p>
                                  )}
                                  {breadcrumbsData.creationDateTime && (
                                    <p>
                                      <span className="font-medium text-foreground">
                                        Created On:
                                      </span>{' '}
                                      {format(
                                        parse(
                                          breadcrumbsData.creationDateTime,
                                          'dd/MM/yyyy, HH:mm:ss',
                                          new Date()
                                        ),
                                        'PPPpp'
                                      )}
                                    </p>
                                  )}
                                  {breadcrumbsData.parentFolder && (
                                    <p>
                                      <span className="font-medium text-foreground">
                                        Folder:
                                      </span>{' '}
                                      {breadcrumbsData.parentFolder}
                                    </p>
                                  )}
                                  {breadcrumbsData.files && (
                                    <>
                                      <p>
                                        <span className="font-medium text-foreground">
                                          Files:
                                        </span>{' '}
                                        {breadcrumbsData.files.length} file(s)
                                      </p>
                                      <ul className="list-disc ml-5">
                                        {breadcrumbsData.files.map(file => (
                                          <li key={file.id}>{file.name}</li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No breadcrumbs found.
                                </p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 flex justify-between gap-4 items-center">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={async () => {
                          const block = await getBreadcrumbsBlock(cardDetails ?? null)
                          if (block && cardDetails) {
                            await applyBreadcrumbsToCard(cardDetails, block)
                          }
                        }}
                      >
                        Append Breadcrumbs
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="max-w-[400px] max-h-[300px] overflow-auto bg-white p-3 border border-gray-300 rounded shadow text-xs font-mono whitespace-pre-wrap text-gray-600"
                    >
                      {breadcrumbs
                        ? JSON.stringify(breadcrumbs, null, 2)
                        : 'No breadcrumbs selected'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (selectedCard) {
                      const url = new URL(`https://trello.com/c/${selectedCard.id}`)
                      await open(url.toString())
                      console.log('click')
                    }
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Trello
                </Button>
                <Button onClick={() => setSelectedCard(null)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default UploadTrello
