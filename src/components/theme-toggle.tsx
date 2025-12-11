import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@components/ui/sidebar'
import { Moon, Palette, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useNavigate } from 'react-router-dom'
import * as React from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const navigate = useNavigate()

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Determine if current theme is light or dark
  const isLightTheme = theme === 'light' || theme === 'catppuccin-latte'

  // Toggle between light and dark (use default themes)
  const handleToggle = () => {
    if (isLightTheme) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleToggle}
          tooltip={
            isLightTheme
              ? 'Switch to dark mode'
              : 'Switch to light mode (or customize in Settings)'
          }
        >
          {isLightTheme ? (
            <>
              <Moon className="h-4 w-4" />
              <span>Dark mode</span>
            </>
          ) : (
            <>
              <Sun className="h-4 w-4" />
              <span>Light mode</span>
            </>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => navigate('/settings/general')}
          tooltip="Customize theme in Settings"
          className="text-muted-foreground text-xs"
        >
          <Palette className="h-4 w-4" />
          <span>Customize</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
