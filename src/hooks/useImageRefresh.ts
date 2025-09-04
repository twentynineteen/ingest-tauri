import { useEffect, useState } from 'react'
import { SproutUploadResponse } from '../utils/types'

interface UseImageRefreshReturn {
  thumbnailLoaded: boolean
  refreshTimestamp: number
  setThumbnailLoaded: (loaded: boolean) => void
}

export const useImageRefresh = (response: SproutUploadResponse | null): UseImageRefreshReturn => {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const [refreshTimestamp, setRefreshTimestamp] = useState<number>(Date.now())

  useEffect(() => {
    // This effect will trigger a refresh of the image every 30 seconds after an upload response is available.
    if (response) {
      const timer = setTimeout(() => {
        // Update refreshTimestamp to force re-rendering of the image.
        setRefreshTimestamp(Date.now())
        // Reset the thumbnailLoaded flag to show a loading placeholder again.
        setThumbnailLoaded(false)
      }, 30000) // 30,000ms = 30 seconds
      
      return () => clearTimeout(timer)
    }
  }, [response])

  return {
    thumbnailLoaded,
    refreshTimestamp,
    setThumbnailLoaded
  }
}