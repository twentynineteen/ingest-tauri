import { appDataDir } from '@tauri-apps/api/path'
import { exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

const API_KEY_FILE = 'api_key.txt' // Local file to store the key

// Get full path for storing API key
const getFilePath = async () => {
  const dir = await appDataDir()
  return `${dir}${API_KEY_FILE}`
}

// Save API Key to a local file
export const saveApiKey = async (apiKey: string): Promise<void> => {
  try {
    const filePath = await getFilePath()
    await writeTextFile(filePath, apiKey)
  } catch (error) {
    console.error('Error saving API key:', error)
  }
}

// Load API Key from the local file
export const loadApiKey = async (): Promise<string | null> => {
  try {
    const filePath = await getFilePath()
    if (!(await exists(filePath))) return null
    return await readTextFile(filePath)
  } catch (error) {
    console.error('Error loading API key:', error)
    return null
  }
}
