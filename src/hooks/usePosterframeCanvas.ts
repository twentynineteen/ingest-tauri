import { useCallback, useRef } from 'react'
import { loadFont } from 'utils/loadFont'

export function usePosterframeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(async (imageUrl: string, title: string) => {
    if (!canvasRef.current || !imageUrl) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = imageUrl

    img.onload = async () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      await loadFont()

      if (title.trim()) {
        ctx.font = '37px Cabrito'
        ctx.fillStyle = 'white'
        ctx.textAlign = 'left'

        const x = 292
        const yStart = 467
        const maxWidth = 365
        const lineHeight = 45

        const words = title.split(' ')
        let line = ''
        let y = yStart

        for (let word of words) {
          const testLine = line + word + ' '
          const metrics = ctx.measureText(testLine)
          if (metrics.width > maxWidth && line) {
            ctx.fillText(line, x, y)
            line = word + ' '
            y += lineHeight
          } else {
            line = testLine
          }
        }

        ctx.fillText(line, x, y)
      }
    }
  }, [])

  return { canvasRef, draw }
}
