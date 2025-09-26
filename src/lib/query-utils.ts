import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'

export type QueryKey =
  | readonly [
      domain: string,
      action: string,
      ...identifiers: readonly (string | number)[]
    ]
  | readonly (string | number)[]

export interface QueryConfiguration {
  queryKey: QueryKey
  staleTime: number
  cacheTime: number
  retry: number | boolean
  refetchOnWindowFocus: boolean
}

export interface MutationConfiguration<
  TData = unknown,
  TVariables = unknown,
  TContext = unknown
> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onMutate?: (variables: TVariables) => Promise<TContext>
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void
  onError?: (error: Error, variables: TVariables, context: TContext) => void
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext
  ) => void
}

export type QueryDomain = 'projects' | 'trello' | 'files' | 'user' | 'settings' | 'upload'

export interface LoadingState {
  isLoading: boolean
  isFetching: boolean
  isRefetching: boolean
  isLoadingError: boolean
  progress?: number
}

export interface ProgressState {
  total: number
  completed: number
  percentage: number
  estimatedTimeRemaining?: number
  currentItem?: string
}

export interface QueryError {
  type:
    | 'network'
    | 'server'
    | 'validation'
    | 'timeout'
    | 'authentication'
    | 'system'
    | 'unknown'
  message: string
  code?: number
  retryable: boolean
  context?: Record<string, unknown>
}

export interface RetryConfiguration {
  attempts: number
  delay: (attempt: number) => number
  condition: (error: Error) => boolean
}

export const QUERY_PROFILES = {
  STATIC: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    refetchOnWindowFocus: false
  },
  DYNAMIC: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true
  },
  REALTIME: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
    refetchOnWindowFocus: true
  },
  EXTERNAL: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: false
  }
} as const

export function createQueryOptions<TData = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  profile: keyof typeof QUERY_PROFILES = 'DYNAMIC',
  overrides?: Partial<UseQueryOptions<TData>>
): UseQueryOptions<TData> {
  const profileConfig = QUERY_PROFILES[profile]

  return {
    queryKey,
    queryFn,
    ...profileConfig,
    ...overrides
  }
}

export function createMutationOptions<
  TData = unknown,
  TVariables = unknown,
  TContext = unknown
>(
  config: MutationConfiguration<TData, TVariables, TContext>
): UseMutationOptions<TData, Error, TVariables, TContext> {
  return {
    mutationFn: config.mutationFn,
    onMutate: config.onMutate,
    onSuccess: config.onSuccess,
    onError: config.onError,
    onSettled: config.onSettled
  }
}

export const retryStrategies: Record<string, RetryConfiguration> = {
  network: {
    attempts: 3,
    delay: (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000),
    condition: (error: Error) =>
      error.name === 'NetworkError' || error.message.includes('network')
  },
  server: {
    attempts: 2,
    delay: (attempt: number) => 1000 * attempt,
    condition: (error: Error) =>
      error.message.includes('5') && error.message.includes('server')
  },
  validation: {
    attempts: 0,
    delay: () => 0,
    condition: () => false
  }
}

export function shouldRetry(
  error: Error,
  attempt: number,
  strategy: keyof typeof retryStrategies
): boolean {
  const config = retryStrategies[strategy]
  return attempt < config.attempts && config.condition(error)
}

export function getRetryDelay(
  attempt: number,
  strategy: keyof typeof retryStrategies
): number {
  const config = retryStrategies[strategy]
  return config.delay(attempt)
}

/**
 * Infer error type from error message for better type safety
 */
export function inferErrorType(errorInfo: string): QueryError['type'] {
  const lowerError = errorInfo.toLowerCase()

  if (lowerError.includes('network') || lowerError.includes('connection'))
    return 'network'
  if (lowerError.includes('timeout')) return 'timeout'
  if (lowerError.includes('auth') || lowerError.includes('unauthorized'))
    return 'authentication'
  if (lowerError.includes('system') || lowerError.includes('app version')) return 'system'
  if (lowerError.includes('validation') || lowerError.includes('invalid'))
    return 'validation'
  if (lowerError.includes('server') || lowerError.includes('internal')) return 'server'

  return 'unknown'
}

export function createQueryError(
  message: string,
  typeOrInfo?: QueryError['type'] | string,
  code?: number,
  context?: Record<string, unknown>
): QueryError {
  // If typeOrInfo is a recognized error type, use it directly
  const validTypes = [
    'network',
    'server',
    'validation',
    'timeout',
    'authentication',
    'system',
    'unknown'
  ]
  const type = validTypes.includes(typeOrInfo as string)
    ? (typeOrInfo as QueryError['type'])
    : inferErrorType(typeOrInfo || message)

  return {
    type,
    message,
    code,
    retryable: type === 'network' || type === 'server' || type === 'timeout',
    context
  }
}

export function calculateProgress(completed: number, total: number): ProgressState {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    percentage
  }
}
