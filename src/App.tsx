import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import AppRouter from './AppRouter'
import { QueryErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthProvider'
import { initializePerformanceMonitor } from './lib/performance-monitor'
import { initializePrefetchManager } from './lib/prefetch-strategies'
import { initializeCacheService } from './services/cache-invalidation'

// The app component acts as the main routing generator for the application.
// AppRouter wraps the app routes to make use of the useLocation method within react-router-dom
// The top level component, Page, acts as the provider for the layout
// subsequent components are loaded within the page window via the Outlet component.

// Create a QueryClient instance with migration-optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time - data is considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Default garbage collection time - keep unused data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Default retry configuration - retry failed requests 3 times with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) return false
        return failureCount < 3
      },
      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for critical data
      refetchOnWindowFocus: false, // Disabled by default, hooks can override this
      // Background refetch interval for important data
      refetchInterval: false, // Disabled by default, hooks can override this
      // Network mode configuration for Tauri desktop app
      networkMode: 'online'
    },
    mutations: {
      // Default retry configuration for mutations
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) return false
        return failureCount < 2 // Fewer retries for mutations
      },
      // Retry delay for mutations
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000)
    }
  }
})

// Initialize performance and cache management services
initializeCacheService(queryClient)
const prefetchManager = initializePrefetchManager(queryClient)
initializePerformanceMonitor(queryClient)

// Prefetch essential app data on startup (non-blocking)
prefetchManager.prefetchAppStartupData().catch(error => {
  console.warn('Startup prefetching failed:', error)
  // Non-critical - app continues to work normally
})

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorBoundary>
        <AuthProvider>
          <Router>
            <AppRouter />
          </Router>
        </AuthProvider>
      </QueryErrorBoundary>
      {/* React Query DevTools - only shows in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
