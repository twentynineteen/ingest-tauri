/**
 * useTrelloActions - External actions for Trello integration
 * Handles opening cards in browser and dialog management
 */

import { open } from '@tauri-apps/plugin-shell'
import { useCallback } from 'react'
import { SelectedCard } from '../pages/UploadTrello/UploadTrelloTypes'

export function useTrelloActions(
  selectedCard: SelectedCard | null,
  onClose?: () => void
) {
  const handleOpenInTrello = useCallback(async () => {
    if (!selectedCard) return

    const url = `https://trello.com/c/${selectedCard.id}`
    await open(url)
  }, [selectedCard])

  const handleCloseDialog = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  return {
    handleOpenInTrello,
    handleCloseDialog
  }
}
