/**
 * ThemeSelector Component Tests
 *
 * Tests for the theme selection dropdown with live preview functionality.
 */

import { ThemeSelector } from '@/components/Settings/ThemeSelector'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it, vi } from 'vitest'

// Mock useThemePreview hook
vi.mock('@/hooks/useThemePreview', () => ({
  useThemePreview: () => ({
    startPreview: vi.fn(),
    stopPreview: vi.fn(),
  }),
}))

describe('ThemeSelector', () => {
  const renderThemeSelector = (initialTheme = 'light') => {
    return render(
      <ThemeProvider attribute="class" defaultTheme={initialTheme}>
        <ThemeSelector />
      </ThemeProvider>
    )
  }

  it('renders the theme selector with label', async () => {
    renderThemeSelector()

    await waitFor(() => {
      expect(screen.getByLabelText(/theme/i)).toBeInTheDocument()
    })
  })

  it('shows help text about hover preview and auto-save', async () => {
    renderThemeSelector()

    await waitFor(() => {
      expect(
        screen.getByText(/hover over themes to preview them/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/changes are saved automatically/i)).toBeInTheDocument()
    })
  })

  it('displays all 8 theme options when opened', async () => {
    const user = userEvent.setup()
    renderThemeSelector()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Open the select dropdown
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Check for all themes
    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument()
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('Dracula')).toBeInTheDocument()
      expect(screen.getByText('Catppuccin Latte')).toBeInTheDocument()
      expect(screen.getByText('Catppuccin Frappé')).toBeInTheDocument()
      expect(screen.getByText('Catppuccin Macchiato')).toBeInTheDocument()
      expect(screen.getByText('Catppuccin Mocha')).toBeInTheDocument()
    })
  })

  it('groups themes into System, Light, and Dark categories', async () => {
    const user = userEvent.setup()
    renderThemeSelector()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument()
      expect(screen.getByText('Light Themes')).toBeInTheDocument()
      expect(screen.getByText('Dark Themes')).toBeInTheDocument()
    })
  })

  it('shows color swatches for each theme', async () => {
    const user = userEvent.setup()
    renderThemeSelector()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Color swatches are rendered (check by looking for presentation role)
    await waitFor(() => {
      const swatches = screen.getAllByRole('presentation')
      expect(swatches.length).toBeGreaterThan(0)
    })
  })

  it('displays theme descriptions', async () => {
    const user = userEvent.setup()
    renderThemeSelector()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/follow system light\/dark preference/i)).toBeInTheDocument()
      expect(
        screen.getByText(/dark theme with vibrant purple and pink accents/i)
      ).toBeInTheDocument()
    })
  })

  it('handles theme selection', async () => {
    const user = userEvent.setup()
    renderThemeSelector()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Select Dracula theme
    const draculaOption = await screen.findByText('Dracula')
    await user.click(draculaOption)

    // Theme should be applied (next-themes handles this)
    await waitFor(() => {
      const html = document.documentElement
      expect(html.classList.contains('dracula')).toBe(true)
    })
  })

  it('shows loading state before mount', () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <ThemeSelector />
      </ThemeProvider>
    )

    // Should show a skeleton/loading state initially
    const loadingElement = container.querySelector('.animate-pulse')
    expect(loadingElement).toBeInTheDocument()
  })

  it('accepts custom label prop', async () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <ThemeSelector label="Choose Color Scheme" />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Choose Color Scheme')).toBeInTheDocument()
    })
  })

  it('applies custom className', async () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <ThemeSelector className="custom-class" />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })
})
