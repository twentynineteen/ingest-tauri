/**
 * Migration Contracts - Hook Interface Specifications
 * These contracts define the expected behavior before and after migration
 */

// Hook Migration Contract Types
export interface HookMigrationContract<T = any> {
  hookName: string
  beforeMigration: LegacyHookSignature<T>
  afterMigration: ReactQueryHookSignature<T>
  behaviorPreservation: BehaviorAssertion[]
  performanceExpectations: PerformanceContract
}

export interface LegacyHookSignature<T> {
  inputs: Record<string, any>
  outputs: {
    data: T | null
    loading: boolean
    error: Error | null
    refetch?: () => void
  }
  sideEffects: string[]
  dependencies: string[]
}

export interface ReactQueryHookSignature<T> {
  inputs: Record<string, any>
  outputs: {
    data: T | undefined
    isLoading: boolean
    isFetching: boolean
    isError: boolean
    error: Error | null
    refetch: () => void
    isSuccess: boolean
  }
  queryKey: string[]
  queryOptions: Record<string, any>
}

export interface BehaviorAssertion {
  description: string
  testScenario: string
  expectedBehavior: string
  regressionRisk: 'low' | 'medium' | 'high'
}

export interface PerformanceContract {
  maxRenderCount: number
  networkCallReduction: number // percentage
  cacheHitExpected: boolean
  backgroundRefetchSupport: boolean
}

// Specific Hook Migration Contracts

export const useBreadcrumbMigrationContract: HookMigrationContract = {
  hookName: 'useBreadcrumb',
  beforeMigration: {
    inputs: { projectId: 'string' },
    outputs: {
      data: null,
      loading: true,
      error: null,
      refetch: undefined
    },
    sideEffects: ['zustand store updates', 'useEffect cleanup'],
    dependencies: ['projectId', 'breadcrumbStore']
  },
  afterMigration: {
    inputs: { projectId: 'string' },
    outputs: {
      data: undefined,
      isLoading: true,
      isFetching: false,
      isError: false,
      error: null,
      refetch: () => {},
      isSuccess: false
    },
    queryKey: ['breadcrumbs', 'project', '{projectId}'],
    queryOptions: {
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
      retry: 2
    }
  },
  behaviorPreservation: [
    {
      description: 'Breadcrumb data fetching on project change',
      testScenario: 'User navigates to different project',
      expectedBehavior: 'Breadcrumbs update automatically without manual refresh',
      regressionRisk: 'medium'
    },
    {
      description: 'Loading state during fetch',
      testScenario: 'Initial project load',
      expectedBehavior: 'Loading indicator shows until data arrives',
      regressionRisk: 'low'
    }
  ],
  performanceExpectations: {
    maxRenderCount: 3, // Initial, loading, success
    networkCallReduction: 0, // Same number of calls but with caching
    cacheHitExpected: true,
    backgroundRefetchSupport: true
  }
}

export const useTrelloBoardMigrationContract: HookMigrationContract = {
  hookName: 'useTrelloBoard',
  beforeMigration: {
    inputs: { boardId: 'string', apiKey: 'string' },
    outputs: {
      data: null,
      loading: true,
      error: null,
      refetch: undefined
    },
    sideEffects: ['API polling', 'state updates'],
    dependencies: ['boardId', 'apiKey', 'polling interval']
  },
  afterMigration: {
    inputs: { boardId: 'string', apiKey: 'string' },
    outputs: {
      data: undefined,
      isLoading: true,
      isFetching: false,
      isError: false,
      error: null,
      refetch: () => {},
      isSuccess: false
    },
    queryKey: ['trello', 'board', '{boardId}'],
    queryOptions: {
      staleTime: 120000, // 2 minutes
      cacheTime: 600000, // 10 minutes
      retry: 3,
      refetchInterval: 30000 // 30 seconds
    }
  },
  behaviorPreservation: [
    {
      description: 'Automatic board data refresh',
      testScenario: 'Board data becomes stale',
      expectedBehavior: 'Data refreshes automatically in background',
      regressionRisk: 'medium'
    },
    {
      description: 'API key validation',
      testScenario: 'Invalid API key provided',
      expectedBehavior: 'Error state with retry disabled',
      regressionRisk: 'high'
    }
  ],
  performanceExpectations: {
    maxRenderCount: 4, // Initial, loading, success, refetch
    networkCallReduction: 50, // Significant reduction through caching
    cacheHitExpected: true,
    backgroundRefetchSupport: true
  }
}

export const useUploadEventsMigrationContract: HookMigrationContract = {
  hookName: 'useUploadEvents',
  beforeMigration: {
    inputs: { uploadId: 'string' },
    outputs: {
      data: null,
      loading: true,
      error: null
    },
    sideEffects: ['event listeners', 'progress tracking'],
    dependencies: ['uploadId', 'tauri events']
  },
  afterMigration: {
    inputs: { uploadId: 'string' },
    outputs: {
      data: undefined,
      isLoading: true,
      isFetching: false,
      isError: false,
      error: null,
      refetch: () => {},
      isSuccess: false
    },
    queryKey: ['upload', 'progress', '{uploadId}'],
    queryOptions: {
      staleTime: 0, // Real-time data
      cacheTime: 60000, // 1 minute
      retry: 1,
      refetchInterval: 1000 // 1 second for active uploads
    }
  },
  behaviorPreservation: [
    {
      description: 'Real-time progress updates',
      testScenario: 'File upload in progress',
      expectedBehavior: 'Progress bar updates smoothly without lag',
      regressionRisk: 'high'
    },
    {
      description: 'Upload completion detection',
      testScenario: 'Upload finishes successfully',
      expectedBehavior: 'Progress shows 100% and success state',
      regressionRisk: 'medium'
    }
  ],
  performanceExpectations: {
    maxRenderCount: 10, // Multiple progress updates
    networkCallReduction: 0, // Same frequency needed for real-time
    cacheHitExpected: false, // Real-time data shouldn't cache
    backgroundRefetchSupport: true
  }
}

// Cache Invalidation Contracts
export interface CacheInvalidationContract {
  triggerEvent: string
  invalidatedKeys: string[][]
  updateStrategy: 'refetch' | 'optimistic' | 'remove'
  rollbackSupport: boolean
}

export const cacheInvalidationContracts: CacheInvalidationContract[] = [
  {
    triggerEvent: 'project_created',
    invalidatedKeys: [['projects', 'list']],
    updateStrategy: 'optimistic',
    rollbackSupport: true
  },
  {
    triggerEvent: 'file_uploaded',
    invalidatedKeys: [
      ['projects', 'detail'],
      ['files', 'selection']
    ],
    updateStrategy: 'refetch',
    rollbackSupport: false
  },
  {
    triggerEvent: 'trello_card_updated',
    invalidatedKeys: [['trello', 'board']],
    updateStrategy: 'optimistic',
    rollbackSupport: true
  }
]

// Error Handling Contracts
export interface ErrorHandlingContract {
  errorType: 'network' | 'server' | 'validation' | 'business'
  httpStatusCodes: number[]
  retryable: boolean
  userMessage: string
  recoveryAction?: string
}

export const errorHandlingContracts: ErrorHandlingContract[] = [
  {
    errorType: 'network',
    httpStatusCodes: [0, -1],
    retryable: true,
    userMessage: 'Network connection lost. Retrying...',
    recoveryAction: 'Check internet connection'
  },
  {
    errorType: 'server',
    httpStatusCodes: [500, 502, 503, 504],
    retryable: true,
    userMessage: 'Server temporarily unavailable. Please try again.',
    recoveryAction: 'Wait and retry'
  },
  {
    errorType: 'validation',
    httpStatusCodes: [400, 422],
    retryable: false,
    userMessage: 'Invalid data provided.',
    recoveryAction: 'Check your input and try again'
  },
  {
    errorType: 'business',
    httpStatusCodes: [401, 403, 409],
    retryable: false,
    userMessage: 'Access denied or resource conflict.',
    recoveryAction: 'Check permissions or resolve conflicts'
  }
]