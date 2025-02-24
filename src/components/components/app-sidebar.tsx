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
import { core } from '@tauri-apps/api'
import { invoke } from '@tauri-apps/api/core'
import { ask, message } from '@tauri-apps/plugin-dialog'
// import { relaunch } from '@tauri-apps/plugin-process'
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
  const { logout } = useAuth()
  const onUpdateClicked = React.useCallback(async (onUserClick: false) => {
    const update = await check()
    if (update === null) {
      await message('Failed to check for updates.\nPlease try again later.', {
        title: 'Error',
        kind: 'error',
        okLabel: 'OK'
      })
      return
    } else if (update?.available) {
      const yes = await ask(
        `Update to ${update.version} is available!\n\nRelease notes: ${update.body}`,
        {
          title: 'Update Available',
          kind: 'info',
          okLabel: 'Update',
          cancelLabel: 'Cancel'
        }
      )
      if (yes) {
        await update.downloadAndInstall()
        // Restart the app after the update is installed by calling the Tauri command that handles restart for your app
        // It is good practice to shut down any background processes gracefully before restarting
        // As an alternative, you could ask the user to restart the app manually
        await invoke('graceful_restart')
      }
    } else if (onUserClick) {
      await message('You are on the latest version. Stay awesome!', {
        title: 'No Update Available',
        kind: 'info',
        okLabel: 'OK'
      })
    }
    // try {
    //   const update = await check()
    //   if (update) {
    //     console.log(
    //       `found update ${update.version} from ${update.date} with notes ${update.body}`
    //     )
    //     let downloaded = 0
    //     let contentLength = 0
    //     // alternatively we could also call update.download() and update.install() separately
    //     await update.downloadAndInstall(event => {
    //       switch (event.event) {
    //         case 'Started':
    //           contentLength = event.data.contentLength
    //           console.log(`started downloading ${event.data.contentLength} bytes`)
    //           break
    //         case 'Progress':
    //           downloaded += event.data.chunkLength
    //           console.log(`downloaded ${downloaded} from ${contentLength}`)
    //           break
    //         case 'Finished':
    //           console.log('download finished')
    //           break
    //       }
    //     })

    //     console.log('update installed')
    //     await relaunch()
    //   }
    // } catch (error) {
    //   console.error('Update check failed: ', error)
    // }
  }, [])

  const [username, setUsername] = useState('')

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
        <NavUser user={user} onLogout={logout} onUpdateClicked={onUpdateClicked} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
