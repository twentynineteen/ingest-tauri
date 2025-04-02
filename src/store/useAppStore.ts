import { Breadcrumb } from 'src/utils/types'
import { create } from 'zustand'

// Global state definition
interface AppState {
  trelloApiKey: string
  setTrelloApiKey: (trelloKey: string) => void
  trelloApiToken: string
  setTrelloApiToken: (trelloToken: string) => void
  sproutVideoApiKey: string
  setSproutVideoApiKey: (sproutKey: string) => void
  breadcrumbs: Breadcrumb
  setBreadcrumbs: (breadcrumb: Breadcrumb) => void
}

// Create the Zustand store
export const useAppStore = create<AppState>(set => ({
  trelloApiKey: '',
  setTrelloApiKey: trelloKey => set({ trelloApiKey: trelloKey }),
  trelloApiToken: '',
  setTrelloApiToken: trelloToken => set({ trelloApiToken: trelloToken }),
  sproutVideoApiKey: '',
  setSproutVideoApiKey: sproutKey => set({ sproutVideoApiKey: sproutKey }),
  breadcrumbs: {},
  setBreadcrumbs: breadcrumb => set({ breadcrumbs: breadcrumb })
}))

export const appStore = useAppStore
