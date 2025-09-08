require('@testing-library/jest-dom')

// Add missing polyfills for Node.js environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Add URL polyfill for older Node versions
if (typeof global.URL === 'undefined') {
  global.URL = require('url').URL
}

// Add crypto polyfill
if (typeof global.crypto === 'undefined') {
  const crypto = require('crypto')
  global.crypto = {
    getRandomValues: (buffer) => crypto.randomFillSync(buffer),
    subtle: crypto.webcrypto?.subtle,
    randomUUID: crypto.randomUUID || (() => crypto.randomBytes(16).toString('hex'))
  }
}

// Mock Tauri API
global.mockTauri = () => {
  const mockInvoke = jest.fn()
  const mockListen = jest.fn(() => Promise.resolve(() => {}))
  const mockEmit = jest.fn()

  global.__TAURI__ = {
    invoke: mockInvoke,
    event: {
      listen: mockListen,
      emit: mockEmit,
    },
  }

  return {
    invoke: mockInvoke,
    listen: mockListen,
    emit: mockEmit,
  }
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock import.meta for Vite/ES modules
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        DEV: false,
        PROD: true,
        NODE_ENV: 'test'
      }
    }
  },
  writable: false
})

// MSW setup moved to individual test files due to ESM issues

// Increase Jest timeout for async operations
jest.setTimeout(10000)