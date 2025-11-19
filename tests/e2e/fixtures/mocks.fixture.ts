import { Page } from '@playwright/test'

/**
 * Mock data and helpers for Tauri API mocking
 */

/**
 * Mock breadcrumbs data for testing
 */
export const mockBreadcrumbs = {
  projectName: 'Test Project',
  clientName: 'Test Client',
  shootDate: '2024-01-15',
  videoLinks: [],
  trelloCards: [],
}

/**
 * Mock project folder structure
 */
export const mockProjectStructure = {
  path: '/test/project',
  folders: ['Footage', 'Graphics', 'Renders', 'Projects', 'Scripts'],
  hasBreadcrumbs: true,
}

/**
 * Setup common Tauri mocks for E2E tests
 */
export async function setupTauriMocks(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Create mock __TAURI__ object if it doesn't exist
    if (typeof window !== 'undefined') {
      const tauriWindow = window as {
        __TAURI__?: {
          invoke: (cmd: string, args?: unknown) => Promise<unknown>
        }
      }

      tauriWindow.__TAURI__ = {
        invoke: async (cmd: string, args?: unknown) => {
          // Return mock data based on command
          switch (cmd) {
            case 'get_version':
              return '0.9.3'
            case 'check_auth':
              return { authenticated: true, user: 'test@example.com' }
            case 'get_preferences':
              return {
                defaultPath: '/Users/test',
                theme: 'system',
              }
            default:
              // Log unhandled commands for debugging
              // eslint-disable-next-line no-console
              console.warn(`[E2E Mock] Unhandled Tauri command: ${cmd}`, args)
              return null
          }
        },
      }
    }
  })
}

/**
 * Mock file dialog responses
 */
export async function mockFileDialog(
  page: Page,
  response: string | string[] | null
): Promise<void> {
  await page.evaluate((dialogResponse) => {
    const tauriWindow = window as {
      __TAURI__?: {
        dialog?: {
          open: () => Promise<string | string[] | null>
        }
      }
    }

    if (tauriWindow.__TAURI__) {
      tauriWindow.__TAURI__.dialog = {
        open: async () => dialogResponse,
      }
    }
  }, response)
}

/**
 * Mock file system operations
 */
export async function mockFileSystem(
  page: Page,
  files: Record<string, string>
): Promise<void> {
  await page.evaluate((mockFiles) => {
    const tauriWindow = window as {
      __TAURI__?: {
        fs?: {
          readTextFile: (path: string) => Promise<string>
          writeTextFile: (path: string, contents: string) => Promise<void>
          exists: (path: string) => Promise<boolean>
        }
      }
    }

    if (tauriWindow.__TAURI__) {
      tauriWindow.__TAURI__.fs = {
        readTextFile: async (path: string) => {
          if (path in mockFiles) {
            return mockFiles[path]
          }
          throw new Error(`File not found: ${path}`)
        },
        writeTextFile: async (path: string, contents: string) => {
          mockFiles[path] = contents
        },
        exists: async (path: string) => {
          return path in mockFiles
        },
      }
    }
  }, files)
}
