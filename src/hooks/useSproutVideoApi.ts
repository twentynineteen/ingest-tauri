/**
 * React Query hook for fetching Sprout Video metadata
 * Feature: 004-embed-multiple-video - URL auto-fetch
 *
 * Parses Sprout Video URLs and fetches metadata from Sprout API via Tauri command
 */

import { useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { parseSproutVideoUrl } from '../utils/parseSproutVideoUrl'
import type { SproutVideoDetails } from '../types/media'

interface FetchVideoDetailsParams {
  videoUrl: string
  apiKey: string
}

/**
 * Hook for fetching Sprout Video details from URL
 *
 * @example
 * const { fetchVideoDetailsAsync, isFetching, error } = useSproutVideoApi()
 *
 * try {
 *   const details = await fetchVideoDetailsAsync({
 *     videoUrl: 'https://sproutvideo.com/videos/abc123',
 *     apiKey: userApiKey
 *   })
 *   console.log(details.title, details.assets.poster_frames[0])
 * } catch (err) {
 *   console.error('Failed to fetch:', err)
 * }
 */
export function useSproutVideoApi() {
  const fetchVideoDetails = useMutation({
    mutationFn: async ({ videoUrl, apiKey }: FetchVideoDetailsParams) => {
      console.log('[useSproutVideoApi] Starting fetch with URL:', videoUrl)
      console.log('[useSproutVideoApi] API Key length:', apiKey?.length || 0)

      // Parse URL to extract video ID
      const videoId = parseSproutVideoUrl(videoUrl)
      console.log('[useSproutVideoApi] Parsed video ID:', videoId)

      if (!videoId) {
        console.error('[useSproutVideoApi] Failed to parse video ID from URL')
        throw new Error('Invalid Sprout Video URL format')
      }

      // Fetch details from Sprout API via Tauri command
      console.log('[useSproutVideoApi] Invoking Tauri command...')
      const details = await invoke<SproutVideoDetails>('fetch_sprout_video_details', {
        videoId,
        apiKey
      })
      console.log('[useSproutVideoApi] Received details from Tauri:', details)

      return details
    }
  })

  return {
    fetchVideoDetails: fetchVideoDetails.mutate,
    fetchVideoDetailsAsync: fetchVideoDetails.mutateAsync,
    isFetching: fetchVideoDetails.isPending,
    error: fetchVideoDetails.error,
    data: fetchVideoDetails.data,
    reset: fetchVideoDetails.reset
  }
}
