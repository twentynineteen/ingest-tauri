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
import { useAuth } from 'src/context/AuthProvider'

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
          title: 'History',
          // url: '/ingest/history'
          url: '#'
        }
      ]
    },
    {
      title: 'Upload content',
      url: '/upload/sprout',
      icon: HardDriveUpload,
      isActive: false,
      items: [
        // {
        //   title: 'Sprout video',
        //   // url: '/upload/sprout'
        //   url: '#'
        // },
        // {
        //   title: 'Posterframe',
        //   // url: '/upload/posterframe'
        //   url: '#'
        // },
        // {
        //   title: 'Trello',
        //   // url: '/upload/trello'
        //   url: '#'
        // },
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
      url: '#',
      icon: Settings,
      isActive: false,
      items: [
        {
          title: 'General',
          // url: '/settings/general'
          url: '#'
        },
        {
          title: 'Connected apps',
          // url: '/settings/connected-apps'
          url: '#'
        }
      ]
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { logout, username } = useAuth()

  const user = {
    name: username || 'Dan',
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
        <NavUser user={user} onLogout={logout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
