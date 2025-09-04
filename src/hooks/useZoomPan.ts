import { useEffect, useState } from 'react'

interface ZoomPanData {
  zoomLevel: number
  pan: { x: number; y: number }
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void
  setPan: (pan: { x: number; y: number }) => void
}

export function useZoomPan(initialZoom = 1): ZoomPanData {
  const [zoomLevel, setZoomLevel] = useState(initialZoom)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Reset pan when zoom level is reset to 1
  useEffect(() => {
    if (zoomLevel === 1) {
      setPan({ x: 0, y: 0 })
    }
  }, [zoomLevel])

  return {
    zoomLevel,
    pan,
    setZoomLevel,
    setPan
  }
}