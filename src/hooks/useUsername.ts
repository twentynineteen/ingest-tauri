import { core } from '@tauri-apps/api'
import { useEffect, useState } from 'react'

export function useUsername() {
  const [username, setUsername] = useState('')

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const name = await core.invoke<string>('get_username')
        setUsername(name)
      } catch (error) {
        console.error('Failed to fetch username', error)
      }
    }

    fetchUsername()
  }, [])

  return username
}
