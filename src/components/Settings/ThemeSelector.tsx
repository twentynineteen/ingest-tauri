/**
 * ThemeSelector Component
 *
 * Dropdown selector for choosing application themes.
 * Features:
 * - Live preview on hover
 * - Color swatches for visual identification
 * - Grouped themes (System, Light, Dark)
 * - Auto-save on selection
 */

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ThemeColorSwatch } from '@/components/Settings/ThemeColorSwatch'
import { getGroupedThemes } from '@/constants/themes'
import { useThemePreview } from '@/hooks/useThemePreview'
import { useTheme } from 'next-themes'
import React from 'react'

export interface ThemeSelectorProps {
  /** Optional label for the select */
  label?: string
  /** Optional CSS class name */
  className?: string
}

/**
 * Theme selector dropdown with live preview and color swatches
 */
export function ThemeSelector({ label = 'Theme', className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const groupedThemes = React.useMemo(() => getGroupedThemes(), [])
  const { startPreview, stopPreview } = useThemePreview({
    activeTheme: theme || 'system',
  })

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={className}>
        {label && (
          <Label htmlFor="theme-selector" className="mb-2 block">
            {label}
          </Label>
        )}
        <div className="bg-muted h-9 w-full animate-pulse rounded-md" />
      </div>
    )
  }

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="theme-selector" className="mb-2 block">
          {label}
        </Label>
      )}
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger id="theme-selector" className="w-full" aria-label={label || 'Theme'}>
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent className="max-h-[500px]">
          {/* Render grouped themes */}
          {groupedThemes.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.themes.map((themeMetadata) => (
                <SelectItem
                  key={themeMetadata.id}
                  value={themeMetadata.id}
                  aria-label={themeMetadata.name}
                  onMouseEnter={() => startPreview(themeMetadata.id)}
                  onMouseLeave={stopPreview}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Color swatch preview */}
                    <ThemeColorSwatch colors={themeMetadata.colorSwatch} />

                    {/* Theme name and description */}
                    <div className="flex flex-col">
                      <span className="font-medium">{themeMetadata.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {themeMetadata.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      {/* Help text */}
      <p className="text-muted-foreground mt-1 text-xs">
        Hover over themes to preview them. Changes are saved automatically.
      </p>
    </div>
  )
}
