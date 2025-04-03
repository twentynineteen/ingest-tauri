import { fontDir } from '@tauri-apps/api/path'
import { exists, readFile } from '@tauri-apps/plugin-fs'

export async function loadFont() {
  const fontPath = await fontDir()
  const path = `${fontPath}/Cabrito.otf`

  const found = await exists(path)
  if (!found) return

  const data = await readFile(path)
  const blob = new Blob([new Uint8Array(data)], { type: 'font/otf' })
  const url = URL.createObjectURL(blob)

  const font = new FontFace('Cabrito', `url(${url})`)
  await font.load()
  document.fonts.add(font)
}
