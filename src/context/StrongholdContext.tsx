import { appDataDir } from '@tauri-apps/api/path'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { Client, Stronghold } from '@tauri-apps/plugin-stronghold'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

// Define the context type
interface StrongholdContextType {
  stronghold: Stronghold | null
  client: Client | null
  isInitialized: boolean
}

// Create the context
const StrongholdContext = createContext<StrongholdContextType | undefined>(undefined)

export const StrongholdProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [stronghold, setStronghold] = useState<Stronghold | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const isInitializing = useRef(false) // Prevent multiple initializations

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    async function initializeStronghold() {
      if (isInitializing.current) {
        console.warn(
          'Stronghold initialization already in progress. Skipping duplicate call.'
        )
        return
      }

      isInitializing.current = true // Mark as initializing

      try {
        console.log('Step 1: Getting vault path...')
        const vaultPath = `${await appDataDir()}/vault.hold`
        const vaultPassword = 'your-secure-password'

        console.log('🔄 Step 2: Checking if file exists...')
        const response = await readTextFile(vaultPath).catch(() => null)
        if (!response) {
          console.warn('Stronghold file not found. Creating a new one...')
        }

        console.log(`Step 3: Loading Stronghold from path: ${vaultPath}`)
        // Timeout after 15 seconds
        const timeout = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('⏳ Stronghold load timeout exceeded!')),
            15000
          )
        )

        // Attempt to load Stronghold
        const strongholdInstance = await Promise.race([
          Stronghold.load(vaultPath, vaultPassword),
          timeout
        ])

        // Ensure Stronghold loaded succesfully
        if (!(strongholdInstance instanceof Stronghold)) {
          throw new Error('Failed to load Stronghold. Instance is null..')
        }

        // let clientInstance
        // const clientName = 'my-client'

        // console.log('Step 4: Checking for existing client...')
        // try {
        //   clientInstance = await strongholdInstance.loadClient(clientName)
        //   console.log('Step 4a: Stronghold client loaded.')
        // } catch {
        //   clientInstance = await strongholdInstance.createClient(clientName)
        //   console.log('Step 4b: Stronghold client created.')
        // }

        console.log('Step 5: Setting up state...')

        setStronghold(strongholdInstance)
        // setClient(clientInstance)
        setIsInitialized(true)
        console.log('Stronghold successfully initialized.')
      } catch (error) {
        console.error('Failed to initialize Stronghold:', error)
        setIsInitialized(false)
      } finally {
        isInitializing.current = false // Mark as not initializing
      }
    }

    initializeStronghold()

    return () => {
      console.log('⏳ Cleanup: Aborting Stronghold initialization...')
      controller.abort()
    }
  }, [])

  return (
    <StrongholdContext.Provider value={{ stronghold, client, isInitialized }}>
      {children}
    </StrongholdContext.Provider>
  )
}

export const useStronghold = (): StrongholdContextType => {
  const context = useContext(StrongholdContext)
  if (!context) {
    throw new Error('useStronghold must be used within a StrongholdProvider')
  }
  return context
}
