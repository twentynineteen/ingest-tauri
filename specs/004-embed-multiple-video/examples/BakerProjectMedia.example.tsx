/**
 * Example: Baker Project Media Manager
 *
 * This example shows how to integrate VideoLinksManager and TrelloCardsManager
 * into the Baker project details view.
 *
 * Usage: Add this component to your Baker ScanResults page
 */

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoLinksManager } from '@/components/Baker/VideoLinksManager'
import { TrelloCardsManager } from '@/components/Baker/TrelloCardsManager'
import type { ProjectFolder } from '@/types/baker'

interface BakerProjectMediaProps {
  project: ProjectFolder
  userSettings?: {
    trello?: {
      apiKey: string
      apiToken: string
    }
  }
}

/**
 * EXAMPLE 1: Tabbed Interface
 * Shows video links and Trello cards in separate tabs
 */
export function BakerProjectMediaTabs({ project, userSettings }: BakerProjectMediaProps) {
  return (
    <div className="w-full">
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="trello">Trello Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <VideoLinksManager projectPath={project.path} />
        </TabsContent>

        <TabsContent value="trello" className="space-y-4">
          <TrelloCardsManager
            projectPath={project.path}
            trelloApiKey={userSettings?.trello?.apiKey}
            trelloApiToken={userSettings?.trello?.apiToken}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * EXAMPLE 2: Stacked Layout
 * Shows both sections in a vertical layout
 */
export function BakerProjectMediaStacked({ project, userSettings }: BakerProjectMediaProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <VideoLinksManager projectPath={project.path} />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <TrelloCardsManager
          projectPath={project.path}
          trelloApiKey={userSettings?.trello?.apiKey}
          trelloApiToken={userSettings?.trello?.apiToken}
        />
      </section>
    </div>
  )
}

/**
 * EXAMPLE 3: Collapsible Sections
 * Shows sections that can be expanded/collapsed
 */
export function BakerProjectMediaCollapsible({ project, userSettings }: BakerProjectMediaProps) {
  const [videosExpanded, setVideosExpanded] = useState(true)
  const [trelloExpanded, setTrelloExpanded] = useState(true)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white">
        <button
          onClick={() => setVideosExpanded(!videosExpanded)}
          className="flex w-full items-center justify-between px-6 py-4 text-left font-medium hover:bg-gray-50"
        >
          <span>Video Links</span>
          <span>{videosExpanded ? '−' : '+'}</span>
        </button>
        {videosExpanded && (
          <div className="border-t border-gray-200 p-6">
            <VideoLinksManager projectPath={project.path} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <button
          onClick={() => setTrelloExpanded(!trelloExpanded)}
          className="flex w-full items-center justify-between px-6 py-4 text-left font-medium hover:bg-gray-50"
        >
          <span>Trello Cards</span>
          <span>{trelloExpanded ? '−' : '+'}</span>
        </button>
        {trelloExpanded && (
          <div className="border-t border-gray-200 p-6">
            <TrelloCardsManager
              projectPath={project.path}
              trelloApiKey={userSettings?.trello?.apiKey}
              trelloApiToken={userSettings?.trello?.apiToken}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * EXAMPLE 4: Integration with Existing Baker ScanResults
 *
 * Add this to your existing ScanResults.tsx:
 */
export function IntegrationExample() {
  // In your ScanResults component, add this where you show project details:

  return `
  // Inside your ScanResults component:

  {selectedProject && (
    <div className="space-y-6">
      {/* Existing breadcrumbs info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">Project Information</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Project Title</dt>
            <dd className="font-medium">{selectedProject.breadcrumbs?.projectTitle}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Cameras</dt>
            <dd className="font-medium">{selectedProject.breadcrumbs?.numberOfCameras}</dd>
          </div>
          {/* ... other fields */}
        </dl>
      </div>

      {/* NEW: Add media sections */}
      <BakerProjectMediaStacked
        project={selectedProject}
        userSettings={userSettings}
      />
    </div>
  )}
  `
}

/**
 * EXAMPLE 5: Using Hooks Directly
 *
 * For custom implementations, use the hooks directly:
 */
export function CustomVideoList({ projectPath }: { projectPath: string }) {
  const { videoLinks, isLoading, addVideoLinkAsync } = useBreadcrumbsVideoLinks({
    projectPath
  })

  const handleQuickAdd = async () => {
    const videoLink = {
      url: 'https://sproutvideo.com/videos/example123',
      title: 'Quick Added Video'
    }

    try {
      await addVideoLinkAsync(videoLink)
      alert('Video added!')
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <button onClick={handleQuickAdd}>Quick Add Video</button>
      <ul>
        {videoLinks.map((video, i) => (
          <li key={i}>{video.title}</li>
        ))}
      </ul>
    </div>
  )
}

// Note: Import the hook at the top of your file:
import { useBreadcrumbsVideoLinks } from '@/hooks/useBreadcrumbsVideoLinks'