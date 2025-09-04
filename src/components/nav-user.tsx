import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@components/ui/sidebar'
import { useSidebar } from '@components/ui/use-sidebar'
import { core } from '@tauri-apps/api'
import { getVersion } from '@tauri-apps/api/app'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  user: {
    name: string
    avatar: string
  }
  onLogout: () => void
  onUpdateClicked: () => void
  // isLoading: boolean
}

export function NavUser({ user, onLogout, onUpdateClicked }: Props) {
  const { isMobile } = useSidebar()

  const [username, setUsername] = useState('')
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    // Fetch the version when the component mounts
    const fetchVersion = async () => {
      try {
        // Get the app version using Tauri's API
        const ver = await getVersion()
        setVersion(ver)
      } catch (error) {
        console.error('Failed to get app version:', error)
      }
    }

    fetchVersion()
  }, [])

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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                {/* <span className="truncate text-xs">{user.email}</span> */}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  {/* <span className="truncate text-xs">{user.email}</span> */}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Version: {version}
                {/* {isLoading ? 'Checking for updates...' : 'Check for updates'} */}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <div className="flex items-center space-x-2">
                  <Link to="#" onClick={onUpdateClicked}>
                    {/* <Bell size={16} />  */}
                    Check for updates
                    {/* {isLoading ? 'Checking for updates...' : 'Check for updates'} */}
                  </Link>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              <Link to="#" onClick={onLogout}>
                Log out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
