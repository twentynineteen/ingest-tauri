import { NavMain } from '@components/nav-main'
import { NavUser } from '@components/nav-user'
import { TeamSwitcher } from '@components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@components/ui/sidebar'
import { useAuth } from 'hooks/useAuth'
import { useUpdateManager } from 'hooks/useUpdateManager'
import { useUsername } from 'hooks/useUsername'
import { Clapperboard, FileText, HardDriveUpload, Save, Settings } from 'lucide-react'
import * as React from 'react'

// This is sample data. User data is located just before function return statement
const data = {
  teams: [
    {
      name: 'Media Team',
      logo: Clapperboard,
      plan: 'Teaching and Learning Enhancement'
    }
  ],
  navMain: [
    {
      title: 'Ingest footage',
      url: '/ingest/build',
      icon: Save,
      isActive: true,
      items: [
        {
          title: 'Build a project',
          url: '/ingest/build'
        },
        {
          title: 'Baker',
          url: '/ingest/baker'
        }
        // {
        //   title: 'History',
        //   // url: '/ingest/history'
        //   url: '#'
        // }
      ]
    },
    {
      title: 'AI tools',
      url: '/ai-tools/script-formatter',
      icon: FileText,
      isActive: false,
      items: [
        {
          title: 'Autocue script formatter',
          url: '/ai-tools/script-formatter'
        },
        {
          title: 'Example embeddings',
          url: '/ai-tools/example-embeddings'
        }
      ]
    },
    {
      title: 'Upload content',
      url: '/upload/sprout',
      icon: HardDriveUpload,
      isActive: false,
      items: [
        {
          title: 'Sprout video',
          url: '/upload/sprout'
        },
        {
          title: 'Posterframe',
          url: '/upload/posterframe'
        },
        {
          title: 'Trello',
          url: '/upload/trello'
        }
        // {
        //   title: 'Otter',
        //   // url: '/upload/otter'
        //   url: '#'
        // },
        // {
        //   title: 'Settings',
        //   url: '#'
        // }
      ]
    },
    {
      title: 'Settings',
      url: '/settings/general',
      icon: Settings,
      isActive: false,
      items: [
        {
          title: 'General',
          url: '/settings/general'
        }
        // {
        //   title: 'Connected apps',
        //   url: '/settings/connected-apps'
        // }
      ]
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { logout } = useAuth()
  const { data: username } = useUsername()

  // Create the update manager hook instance.
  const updateManager = useUpdateManager()

  // Callback for when the update button is clicked.
  const onUpdateClicked = React.useCallback(() => {
    // Set `onUserClick` to true to show feedback when no update is available.
    updateManager.mutate({ onUserClick: true })
  }, [updateManager])

  const user = {
    name: username || 'Unknown User',
    avatar: '/filepath/file.jpg'
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={user}
          onLogout={logout}
          onUpdateClicked={onUpdateClicked}
          // isLoading={updateManager.isPending}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
