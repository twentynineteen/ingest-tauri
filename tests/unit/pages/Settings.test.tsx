/**
 * Tests for Settings page - Trello board ID configuration
 * DEBT-014: Add UI for configuring Trello board ID
 *
 * TDD Phase: RED (Writing failing tests first)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Settings from '@/pages/Settings'
import * as storage from '@/utils/storage'
import { appStore } from '@/store/useAppStore'

// Mock Tauri APIs
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn()
}))

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn()
}))

// Mock storage utilities
vi.mock('@/utils/storage', () => ({
  loadApiKeys: vi.fn(),
  saveApiKeys: vi.fn()
}))

// Mock hooks
vi.mock('@/hooks/useBreadcrumb', () => ({
  useBreadcrumb: vi.fn()
}))

vi.mock('@/hooks/useAIProvider', () => ({
  useAIProvider: vi.fn(() => ({
    validateProvider: vi.fn()
  }))
}))

// Mock app store
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const mockState = {
      defaultBackgroundFolder: '',
      setDefaultBackgroundFolder: vi.fn(),
      ollamaUrl: 'http://localhost:11434',
      setOllamaUrl: vi.fn(),
      trelloBoardId: '', // NEW: For DEBT-014
      setTrelloBoardId: vi.fn() // NEW: For DEBT-014
    }
    return selector ? selector(mockState) : mockState
  }),
  appStore: {
    getState: vi.fn(() => ({
      defaultBackgroundFolder: '',
      setDefaultBackgroundFolder: vi.fn(),
      ollamaUrl: 'http://localhost:11434',
      setOllamaUrl: vi.fn(),
      trelloBoardId: '', // NEW: For DEBT-014
      setTrelloBoardId: vi.fn() // NEW: For DEBT-014
    }))
  }
}))

describe('Settings - Trello Board Configuration (DEBT-014)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
    vi.mocked(storage.loadApiKeys).mockResolvedValue({})
    vi.mocked(storage.saveApiKeys).mockResolvedValue()
  })

  const renderSettings = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Settings />
      </QueryClientProvider>
    )
  }

  // Helper to find the save button for Board ID input
  const findBoardIdSaveButton = () => {
    const saveButtons = screen.getAllByRole('button', { name: /save/i })
    const boardIdInput = screen.getByLabelText(/Trello Board ID/i)
    return saveButtons.find(btn => {
      const inputParent = boardIdInput.parentElement?.parentElement
      return inputParent?.contains(btn)
    })
  }

  describe('UI Rendering', () => {
    it('should render Trello section with board ID input', async () => {
      renderSettings()

      await waitFor(() => {
        expect(screen.getByText('Trello')).toBeInTheDocument()
      })

      // Should have label for board ID
      expect(screen.getByText(/Trello Board ID/i)).toBeInTheDocument()
    })

    it('should render Trello board ID input field', async () => {
      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'text')
      })
    })

    it('should show placeholder text for board ID', async () => {
      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        expect(input).toHaveAttribute('placeholder', expect.stringContaining('Board ID'))
      })
    })

    it('should show help text explaining board ID format', async () => {
      renderSettings()

      await waitFor(() => {
        expect(
          screen.getByText(/24-character alphanumeric ID/i)
        ).toBeInTheDocument()
      })
    })

    it('should have save button for board ID', async () => {
      renderSettings()

      await waitFor(() => {
        // Find save button within Trello section
        const trelloSection = screen.getByText('Trello').closest('section')
        expect(trelloSection).toBeInTheDocument()

        const saveButtons = screen.getAllByText('Save')
        expect(saveButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Loading Saved Board ID', () => {
    it('should display saved board ID on load', async () => {
      const savedBoardId = '55a504d70bed2bd21008dc5a'
      vi.mocked(storage.loadApiKeys).mockResolvedValue({
        trelloBoardId: savedBoardId
      })

      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i) as HTMLInputElement
        expect(input.value).toBe(savedBoardId)
      })
    })

    it('should show empty input when no board ID is saved', async () => {
      vi.mocked(storage.loadApiKeys).mockResolvedValue({})

      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i) as HTMLInputElement
        expect(input.value).toBe('')
      })
    })

    it('should display board ID from storage', async () => {
      const storedBoardId = 'store-board-id-123'
      vi.mocked(storage.loadApiKeys).mockResolvedValue({
        trelloBoardId: storedBoardId
      })

      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i) as HTMLInputElement
        expect(input.value).toBe(storedBoardId)
      })
    })
  })

  describe('User Input', () => {
    it('should update input value when user types', async () => {
      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i) as HTMLInputElement
        fireEvent.change(input, { target: { value: 'new-board-id' } })
        expect(input.value).toBe('new-board-id')
      })
    })

    it('should allow user to clear the input', async () => {
      vi.mocked(storage.loadApiKeys).mockResolvedValue({
        trelloBoardId: '55a504d70bed2bd21008dc5a'
      })

      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i) as HTMLInputElement
        expect(input.value).toBe('55a504d70bed2bd21008dc5a')

        fireEvent.change(input, { target: { value: '' } })
        expect(input.value).toBe('')
      })
    })

    it('should accept 24-character hex board ID', async () => {
      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        const validBoardId = 'abcdef1234567890abcdef12'
        fireEvent.change(input, { target: { value: validBoardId } })
        expect(input).toHaveValue(validBoardId)
      })
    })

    it('should accept short board IDs', async () => {
      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        fireEvent.change(input, { target: { value: 'shortId' } })
        expect(input).toHaveValue('shortId')
      })
    })
  })

  describe('Saving Board ID', () => {
    it('should save board ID when save button is clicked', async () => {
      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        fireEvent.change(input, { target: { value: 'new-board-123' } })
      })

      // Find the save buttons - there are multiple "Save" buttons
      // The board ID save button is the one after the Board ID input
      const saveButtons = screen.getAllByRole('button', { name: /save/i })
      // Find the correct save button - it should be near the Board ID input
      const boardIdInput = screen.getByLabelText(/Trello Board ID/i)
      const saveButton = saveButtons.find(btn => {
        const inputParent = boardIdInput.parentElement?.parentElement
        return inputParent?.contains(btn)
      })

      if (saveButton) {
        fireEvent.click(saveButton)
      }

      await waitFor(() => {
        expect(storage.saveApiKeys).toHaveBeenCalledWith(
          expect.objectContaining({
            trelloBoardId: 'new-board-123'
          })
        )
      })
    })

    it('should call saveApiKeys when saving board ID', async () => {
      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        fireEvent.change(input, { target: { value: 'board-456' } })
      })

      const saveButton = findBoardIdSaveButton()
      if (saveButton) {
        fireEvent.click(saveButton)
      }

      await waitFor(() => {
        expect(storage.saveApiKeys).toHaveBeenCalledWith(
          expect.objectContaining({
            trelloBoardId: 'board-456'
          })
        )
      })
    })

    it('should show success message after saving', async () => {
      vi.mocked(storage.saveApiKeys).mockResolvedValue()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        fireEvent.change(input, { target: { value: 'saved-board' } })
      })

      const saveButton = findBoardIdSaveButton()
      if (saveButton) {
        fireEvent.click(saveButton)
      }

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('saved successfully')
        )
      })

      alertSpy.mockRestore()
    })

    it('should handle save errors gracefully', async () => {
      vi.mocked(storage.saveApiKeys).mockRejectedValue(new Error('Save failed'))
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        fireEvent.change(input, { target: { value: 'error-board' } })
      })

      const saveButton = findBoardIdSaveButton()
      if (saveButton) {
        fireEvent.click(saveButton)
      }

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed'))
      })

      alertSpy.mockRestore()
    })

    it.skip('should preserve other API keys when saving board ID', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      vi.mocked(storage.loadApiKeys).mockResolvedValue({
        trello: 'existing-key',
        trelloToken: 'existing-token',
        sproutVideo: 'existing-sprout'
      })

      renderSettings()

      // Wait for API keys to load and React Query to complete
      await waitFor(() => {
        expect(storage.loadApiKeys).toHaveBeenCalled()
      })

      const input = screen.getByLabelText(/Trello Board ID/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'new-board-id' } })

      // Wait for input value to update (ensuring React state has updated)
      await waitFor(() => {
        expect(input.value).toBe('new-board-id')
      })

      const saveButton = findBoardIdSaveButton()
      if (saveButton) {
        fireEvent.click(saveButton)
      }

      await waitFor(() => {
        expect(storage.saveApiKeys).toHaveBeenCalledWith(
          expect.objectContaining({
            trello: 'existing-key',
            trelloToken: 'existing-token',
            sproutVideo: 'existing-sprout',
            trelloBoardId: 'new-board-id'
          })
        )
      })

      alertSpy.mockRestore()
    })
  })

  describe('Validation', () => {
    it.skip('should allow saving empty board ID', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      renderSettings()

      const input = screen.getByLabelText(/Trello Board ID/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: '' } })

      // Wait for input value to update
      await waitFor(() => {
        expect(input.value).toBe('')
      })

      const saveButton = findBoardIdSaveButton()
      if (saveButton) {
        fireEvent.click(saveButton)
      }

      await waitFor(() => {
        expect(storage.saveApiKeys).toHaveBeenCalledWith(
          expect.objectContaining({
            trelloBoardId: ''
          })
        )
      })

      alertSpy.mockRestore()
    })

    it('should trim whitespace from board ID before saving', async () => {
      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        fireEvent.change(input, { target: { value: '  board-with-spaces  ' } })
      })

      const saveButton = findBoardIdSaveButton()
      if (saveButton) {
        fireEvent.click(saveButton)
      }

      await waitFor(() => {
        expect(storage.saveApiKeys).toHaveBeenCalledWith(
          expect.objectContaining({
            trelloBoardId: 'board-with-spaces'
          })
        )
      })
    })
  })

  describe('Integration with other Trello settings', () => {
    it('should display all Trello-related fields together', async () => {
      renderSettings()

      await waitFor(() => {
        expect(screen.getByText(/Trello API Key/i)).toBeInTheDocument()
        expect(screen.getByText(/Trello API Token/i)).toBeInTheDocument()
        expect(screen.getByText(/Trello Board ID/i)).toBeInTheDocument()
      })
    })

    it('should maintain independence between board ID and API key/token', async () => {
      renderSettings()

      await waitFor(async () => {
        // Change board ID
        const boardInput = screen.getByLabelText(/Trello Board ID/i)
        fireEvent.change(boardInput, { target: { value: 'new-board' } })

        // API key input should not be affected
        const apiKeyInput = screen.getByLabelText(/Trello API Key/i) as HTMLInputElement
        expect(apiKeyInput.value).toBe('')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association', async () => {
      renderSettings()

      await waitFor(() => {
        const label = screen.getByText(/Trello Board ID/i)
        const input = screen.getByLabelText(/Trello Board ID/i)
        expect(label).toBeInTheDocument()
        expect(input).toBeInTheDocument()
      })
    })

    it('should be keyboard navigable', async () => {
      renderSettings()

      await waitFor(() => {
        const input = screen.getByLabelText(/Trello Board ID/i)
        expect(input).not.toHaveAttribute('disabled')
        input.focus()
        expect(document.activeElement).toBe(input)
      })
    })
  })
})
