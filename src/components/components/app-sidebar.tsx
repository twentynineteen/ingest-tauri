import { NavMain } from '@components/components/nav-main'
import { NavUser } from '@components/components/nav-user'
import { TeamSwitcher } from '@components/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@components/components/ui/sidebar'
import { Clapperboard, HardDriveUpload, Save, Settings } from 'lucide-react'
import * as React from 'react'
import { useAuth } from 'src/context/AuthContext'

// This is sample data.
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
          title: 'History',
          url: '/ingest/history'
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
        },
        {
          title: 'Otter',
          url: '/upload/otter'
        },
        {
          title: 'Settings',
          url: '#'
        }
      ]
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings,
      isActive: false,
      items: [
        {
          title: 'General',
          url: '/settings/general'
        },
        {
          title: 'Connected apps',
          url: '/settings/connected-apps'
        }
      ]
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { username, logout } = useAuth() // Get username & logout function
  const user = {
    name: username,
    // email: 'me@example.com',
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
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
