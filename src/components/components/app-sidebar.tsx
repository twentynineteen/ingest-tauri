import { log } from 'util'
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
// import { relaunch } from '@tauri-apps/plugin-process'
import { useMutation } from '@tanstack/react-query'
import { core } from '@tauri-apps/api'
import { invoke } from '@tauri-apps/api/core'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { check } from '@tauri-apps/plugin-updater'
import { Clapperboard, HardDriveUpload, Save, Settings } from 'lucide-react'
import * as React from 'react'
import { useEffect, useState } from 'react'
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
        }
        // {
        //   title: 'History',
        //   // url: '/ingest/history'
        //   url: '#'
        // }
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
        }
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

/**
 * Custom hook that returns a mutation for checking and applying updates.
 * The mutation function accepts an object with a boolean property `onUserClick`
 * to indicate if the update check was initiated by the user.
 */
function useUpdateMutation() {
  // Define the mutation function with an explicit parameter type.
  const mutationFn = async (variables: { onUserClick: boolean }): Promise<void> => {
    // Destructure the onUserClick flag from the variables.
    const { onUserClick } = variables
    try {
      // Check for available update
      const update = await check()

      // If the update check fails, display an error message.
      if (update === null) {
        // await message('Failed to check for updates.\nPlease try again later.', {
        //   title: 'Oh, Richard!',
        //   kind: 'error',
        //   okLabel: 'OK'
        // })
        // / If no update is available and the user manually triggered the check,
        // inform them that they are on the latest version.
        await message('You are on the latest version. My Sheridan has updated already!', {
          title: 'No Update Available',
          kind: 'info',
          okLabel: 'OK'
        })

        return
      }

      // If an update is available, prompt the user for confirmation.
      if (update.available) {
        const userConfirmed = await ask(
          `Update to ${update.version} is available!\n\nRelease notes: ${update.body}`,
          {
            title: 'Update Available',
            kind: 'info',
            okLabel: 'Update',
            cancelLabel: 'Cancel'
          }
        )
        if (userConfirmed) {
          // Download and install the update.
          await update.downloadAndInstall()
          // Restart the application gracefully.
          await invoke('graceful_restart')
        }
      } else if (onUserClick) {
        // If no update is available and the user manually triggered the check,
        // inform them that they are on the latest version.
        await message('You are on the latest version. My Sheridan has updated already!', {
          title: 'No Update Available',
          kind: 'info',
          okLabel: 'OK'
        })
      }
    } catch (error) {
      console.error('Error! ', error)
      await message(error.message, {
        title: 'Error',
        kind: 'error',
        okLabel: 'OK'
      })
    }
  }

  // Return the mutation using the new options object format.
  return useMutation<void, Error, { onUserClick: boolean }>({
    mutationFn: mutationFn
  })
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [username, setUsername] = useState('')
  const { logout } = useAuth()

  // Create the update mutation hook instance.
  const updateMutation = useUpdateMutation()

  // Callback for when the update button is clicked.
  const onUpdateClicked = React.useCallback(() => {
    // Set `onUserClick` to true to show feedback when no update is available.
    updateMutation.mutate({ onUserClick: true })
  }, [updateMutation])

  useEffect(() => {
    async function fetchUsername() {
      try {
        const name = await core.invoke<string>('get_username')
        setUsername(name)
      } catch (error) {
        console.error('Failed to fetch username', error)
      }
    }
    fetchUsername()
  }, [])

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
          // isLoading={updateMutation.isLoading}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
