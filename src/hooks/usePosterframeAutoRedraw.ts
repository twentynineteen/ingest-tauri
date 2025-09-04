import { useEffect, useRef } from 'react'
import { debounce } from 'utils/debounce'

interface AutoRedrawProps {
  draw: (imageUrl: string, title: string) => Promise<void>
  imageUrl: string | null
  title: string
  debounceMs?: number
}

export function usePosterframeAutoRedraw({ 
  draw, 
  imageUrl, 
  title, 
  debounceMs = 300 
}: AutoRedrawProps) {
  const debouncedDrawRef = useRef(debounce(draw, debounceMs))

  useEffect(() => {
    debouncedDrawRef.current = debounce(draw, debounceMs)
  }, [draw, debounceMs])

  useEffect(() => {
    if (imageUrl && title.trim()) {
      debouncedDrawRef.current(imageUrl, title)
    }
  }, [imageUrl, title])
}