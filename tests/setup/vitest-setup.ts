import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'

// Mock matchMedia IMMEDIATELY at module load time
// This is required for both our code and Framer Motion's reduced motion detection
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(mockMatchMedia)
})

// Also ensure global.matchMedia exists for Node environment
if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(mockMatchMedia)
  })
}

// Mock Tauri APIs
const mockTauriApis = () => {
  // Note: We don't mock @tauri-apps/api/core here because mockIPC() from
  // tauri-mocks.ts handles invoke() mocking for contract/integration tests.
  // Individual tests can use vi.mock() locally if they need custom behavior.

  // Mock event listeners - must return unlisten function to avoid cleanup errors
  vi.mock('@tauri-apps/api/event', () => ({
    listen: vi.fn().mockResolvedValue(vi.fn()),
    emit: vi.fn().mockResolvedValue(undefined)
  }))

  // Mock app functions
  vi.mock('@tauri-apps/api/app', () => ({
    getVersion: vi.fn().mockResolvedValue('1.0.0'),
  }))

  // Mock plugin-dialog
  vi.mock('@tauri-apps/plugin-dialog', () => ({
    open: vi.fn(),
  }))

  // Mock plugin-shell
  vi.mock('@tauri-apps/plugin-shell', () => ({
    open: vi.fn(),
  }))

  // Mock plugin-process
  vi.mock('@tauri-apps/plugin-process', () => ({
    relaunch: vi.fn(),
  }))

  // Mock plugin-updater
  vi.mock('@tauri-apps/plugin-updater', () => ({
    check: vi.fn(),
  }))

  // Mock plugin-store
  vi.mock('@tauri-apps/plugin-store', () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  }))
}

// Mock browser APIs
const mockBrowserApis = () => {
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock TextEncoder/TextDecoder for Node.js environment
  if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util')
    global.TextEncoder = TextEncoder
    global.TextDecoder = TextDecoder
  }

  // Mock fetch if not available
  if (typeof global.fetch === 'undefined') {
    global.fetch = vi.fn()
  }
}

beforeAll(() => {
  mockTauriApis()
  mockBrowserApis()
})

afterEach(() => {
  vi.clearAllMocks()
})

afterAll(() => {
  vi.restoreAllMocks()
})

// Export common test utilities
export const createMockQueryClient = async () => {
  const { QueryClient } = await import('@tanstack/react-query')
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const createWrapper = (queryClient?: any) => {
  return ({ children }: { children: React.ReactNode }) => {
    const React = require('react')
    const { QueryClientProvider } = require('@tanstack/react-query')
    const client = queryClient || new (require('@tanstack/react-query').QueryClient)({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false }
      }
    })
    
    return React.createElement(QueryClientProvider, { client }, children)
  }
}