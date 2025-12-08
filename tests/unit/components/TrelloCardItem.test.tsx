/**
 * Test Suite: TrelloCardItem Component
 *
 * Tests for the Baker workflow Trello card display item.
 * Following TDD methodology as per DEBT-009 Phase 4.
 *
 * Test Categories:
 * 1. Rendering (2 tests)
 * 2. Relative Time Display (3 tests)
 * 3. Actions (2 tests)
 * 4. Stale State (1 test)
 *
 * Total: 8 tests
 */

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { TrelloCardItem } from '@components/Baker/TrelloCardItem'
import type { TrelloCard } from '@/types/baker'

// Mock Tauri opener
vi.mock('@tauri-apps/plugin-opener', () => ({
  openUrl: vi.fn()
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}))

import { openUrl } from '@tauri-apps/plugin-opener'
import { logger } from '@/utils/logger'

describe('TrelloCardItem Component', () => {
  // Mock functions for callbacks
  let mockOnRemove: ReturnType<typeof vi.fn>
  let mockOnRefresh: ReturnType<typeof vi.fn>

  // Mock data
  const baseTrelloCard: TrelloCard = {
    url: 'https://trello.com/c/abc123',
    cardId: 'abc123',
    title: 'Test Project - Video Edit',
    boardName: 'Production Board',
    cachedTitle: 'Test Project - Video Edit',
    lastFetched: new Date().toISOString() // Current time
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnRemove = vi.fn()
    mockOnRefresh = vi.fn()
  })

  // =================================================================
  // Test Category 1: Rendering (2 tests)
  // =================================================================

  describe('Rendering', () => {
    test('renders card with all information', () => {
      // Arrange & Act
      render(
        <TrelloCardItem
          trelloCard={baseTrelloCard}
          onRemove={mockOnRemove}
          onRefresh={mockOnRefresh}
        />
      )

      // Assert
      expect(screen.getByText('Test Project - Video Edit')).toBeInTheDocument()
      expect(screen.getByText(/ID: abc123/i)).toBeInTheDocument()
      expect(screen.getByText(/Board: Production Board/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /open in trello/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /remove card/i })).toBeInTheDocument()
    })

    test('renders without board name when not provided', () => {
      // Arrange
      const cardWithoutBoard: TrelloCard = {
        ...baseTrelloCard,
        boardName: null
      }

      // Act
      render(
        <TrelloCardItem
          trelloCard={cardWithoutBoard}
          onRemove={mockOnRemove}
          onRefresh={mockOnRefresh}
        />
      )

      // Assert
      expect(screen.getByText('Test Project - Video Edit')).toBeInTheDocument()
      expect(screen.queryByText(/Board:/i)).not.toBeInTheDocument()
    })
  })

  // =================================================================
  // Test Category 2: Relative Time Display (3 tests)
  // =================================================================

  describe('Relative Time Display', () => {
    test('displays "today" for current date', () => {
      // Arrange
      const todayCard: TrelloCard = {
        ...baseTrelloCard,
        lastFetched: new Date().toISOString()
      }

      // Act
      render(
        <TrelloCardItem trelloCard={todayCard} onRemove={mockOnRemove} onRefresh={mockOnRefresh} />
      )

      // Assert
      expect(screen.getByText(/Last updated: today/i)).toBeInTheDocument()
    })

    test('displays "X days ago" for recent dates', () => {
      // Arrange
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const recentCard: TrelloCard = {
        ...baseTrelloCard,
        lastFetched: threeDaysAgo.toISOString()
      }

      // Act
      render(
        <TrelloCardItem trelloCard={recentCard} onRemove={mockOnRemove} onRefresh={mockOnRefresh} />
      )

      // Assert
      expect(screen.getByText(/Last updated: 3 days ago/i)).toBeInTheDocument()
    })

    test('does not display last updated when lastFetched is null', () => {
      // Arrange
      const cardWithoutDate: TrelloCard = {
        ...baseTrelloCard,
        lastFetched: undefined
      }

      // Act
      render(
        <TrelloCardItem
          trelloCard={cardWithoutDate}
          onRemove={mockOnRemove}
          onRefresh={mockOnRefresh}
        />
      )

      // Assert
      expect(screen.queryByText(/Last updated:/i)).not.toBeInTheDocument()
    })
  })

  // =================================================================
  // Test Category 3: Actions (2 tests)
  // =================================================================

  describe('Actions', () => {
    test('opens Trello URL when "Open in Trello" clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TrelloCardItem
          trelloCard={baseTrelloCard}
          onRemove={mockOnRemove}
          onRefresh={mockOnRefresh}
        />
      )

      // Act
      await user.click(screen.getByRole('button', { name: /open in trello/i }))

      // Assert
      expect(openUrl).toHaveBeenCalledWith('https://trello.com/c/abc123')
    })

    test('triggers onRemove when remove button clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TrelloCardItem
          trelloCard={baseTrelloCard}
          onRemove={mockOnRemove}
          onRefresh={mockOnRefresh}
        />
      )

      // Act
      await user.click(screen.getByRole('button', { name: /remove card/i }))

      // Assert
      expect(mockOnRemove).toHaveBeenCalledTimes(1)
    })
  })

  // =================================================================
  // Test Category 4: Stale State (1 test)
  // =================================================================

  describe('Stale State', () => {
    test('displays stale indicator for cards older than 7 days', () => {
      // Arrange
      const eightDaysAgo = new Date()
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)

      const staleCard: TrelloCard = {
        ...baseTrelloCard,
        lastFetched: eightDaysAgo.toISOString()
      }

      // Act
      const { container } = render(
        <TrelloCardItem trelloCard={staleCard} onRemove={mockOnRemove} onRefresh={mockOnRefresh} />
      )

      // Assert
      expect(screen.getByText(/\(stale\)/i)).toBeInTheDocument()
      // Check for warning color class indicating stale state
      const staleText = container.querySelector('.text-warning')
      expect(staleText).toBeInTheDocument()
    })
  })
})
