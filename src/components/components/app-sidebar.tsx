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
import { useStronghold } from 'src/context/StrongholdContext'

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
  const { stronghold, client } = useStronghold() // Get Stronghold instance
  const [username, setUsername] = React.useState<string | null>(null)
  const [isInitialized, setIsInitialized] = React.useState(false) // track stronghold initialization

  // Fetch username from Stronghold when component mounts
  React.useEffect(() => {
    // Ensure Stronghold is initialized before fetching data
    if (!stronghold || !client) {
      console.warn('🔄 Waiting for Stronghold to initialize...')
      return
    }

    async function fetchUsername() {
      try {
        const store = client.getStore()
        const storedUsernameData = await store.get('username')

        if (storedUsernameData) {
          const decodedUsername = new TextDecoder().decode(
            new Uint8Array(storedUsernameData)
          )
          setUsername(decodedUsername)
        } else {
          console.warn('No username found in Stronghold')
        }
        setIsInitialized(true) // Mark Stronghold as initialized
      } catch (error) {
        console.error('Failed to retrieve username from Stronghold:', error)
      }
    }

    fetchUsername()
  }, [stronghold, client]) // Runs only when both stronghold and client are ready

  // ✅ Implement Stronghold-based logout
  async function handleLogout() {
    if (!client) {
      console.error('Stronghold client is not initialized')
      return
    }

    try {
      const store = client.getStore()
      await store.remove('username') // ✅ Remove username from Stronghold
      await stronghold?.save() // ✅ Save changes to Stronghold
      setUsername(null) // ✅ Update UI state
      console.log('✅ User logged out successfully')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Show loading state while Stronghold initializes
  if (!isInitialized) {
    return <p className="text-center text-gray-500">🔄 Loading...</p>
  }

  const user = {
    name: username || 'Guest',
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
        <NavUser user={user} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
