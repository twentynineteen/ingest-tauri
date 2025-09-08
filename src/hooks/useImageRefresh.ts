import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SproutUploadResponse } from '../utils/types'
import { queryKeys } from '../lib/query-keys'
import { createQueryOptions } from '../lib/query-utils'

interface UseImageRefreshReturn {
  thumbnailLoaded: boolean
  refreshTimestamp: number
  setThumbnailLoaded: (loaded: boolean) => void
  isRefetching: boolean
  lastRefresh?: string
}

interface ImageRefreshData {
  id: string
  url: string
  lastModified: string
  thumbnailLoaded: boolean
}

export const useImageRefresh = (response: SproutUploadResponse | null): UseImageRefreshReturn => {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)

  // Only create query if response is available
  const videoId = response?.id
  const queryKey = videoId ? queryKeys.images.refresh(videoId) : null

  const { data, isRefetching } = useQuery(
    createQueryOptions(
      queryKey || ['images', 'refresh', 'disabled'],
      async (): Promise<ImageRefreshData> => {
        if (!response) {
          throw new Error('No video response available')
        }

        // Generate a fresh URL with timestamp to force image refresh
        const timestamp = Date.now()
        const refreshUrl = response.assets.thumbnails[0] 
          ? `${response.assets.thumbnails[0]}?t=${timestamp}`
          : `${response.embedded_url}/thumbnail.jpg?t=${timestamp}`

        return {
          id: response.id,
          url: refreshUrl,
          lastModified: new Date().toISOString(),
          thumbnailLoaded: false,
        }
      },
      'REALTIME', // 30-second staleTime with auto-refetch
      {
        enabled: !!response && !!videoId,
        refetchInterval: 30000, // 30 seconds
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        // Note: onSuccess is deprecated in newer React Query versions
        // Consider using useEffect to watch for data changes instead
      }
    )
  )

  // Calculate refresh timestamp from data or fallback to current time
  const refreshTimestamp = data?.lastModified 
    ? new Date(data.lastModified).getTime()
    : Date.now()

  return {
    thumbnailLoaded,
    refreshTimestamp,
    setThumbnailLoaded,
    isRefetching,
    lastRefresh: data?.lastModified,
  }
}