/**
 * Query Key Schema - Standardized cache key specifications
 * Defines the structure and validation rules for React Query cache keys
 */

// Query Key Type Definitions
export type QueryKeyDomain = 
  | 'projects' 
  | 'trello' 
  | 'files' 
  | 'user' 
  | 'settings' 
  | 'upload'
  | 'breadcrumbs'

export type QueryKeyAction =
  | 'list'
  | 'detail' 
  | 'status'
  | 'progress'
  | 'preferences'
  | 'selection'
  | 'board'
  | 'cards'
  | 'profile'

export type QueryKey = [QueryKeyDomain, QueryKeyAction, ...(string | number)[]]

// Query Key Factory Functions
export const queryKeys = {
  // Projects domain
  projects: {
    all: ['projects'] as const,
    lists: () => ['projects', 'list'] as const,
    list: (filters: Record<string, any>) => ['projects', 'list', filters] as const,
    details: () => ['projects', 'detail'] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    status: (id: string) => ['projects', 'status', id] as const,
  },
  
  // Trello domain
  trello: {
    all: ['trello'] as const,
    boards: () => ['trello', 'board'] as const,
    board: (boardId: string) => ['trello', 'board', boardId] as const,
    cards: (boardId: string) => ['trello', 'cards', boardId] as const,
    card: (boardId: string, cardId: string) => ['trello', 'cards', boardId, cardId] as const,
  },
  
  // Files domain
  files: {
    all: ['files'] as const,
    selections: () => ['files', 'selection'] as const,
    selection: (projectId: string) => ['files', 'selection', projectId] as const,
    progress: (uploadId: string) => ['files', 'progress', uploadId] as const,
  },
  
  // User domain
  user: {
    all: ['user'] as const,
    profile: () => ['user', 'profile'] as const,
    preferences: () => ['user', 'preferences'] as const,
  },
  
  // Settings domain
  settings: {
    all: ['settings'] as const,
    preferences: () => ['settings', 'preferences'] as const,
    apiKeys: () => ['settings', 'api-keys'] as const,
  },
  
  // Upload domain
  upload: {
    all: ['upload'] as const,
    progress: (uploadId: string) => ['upload', 'progress', uploadId] as const,
    status: (uploadId: string) => ['upload', 'status', uploadId] as const,
  },
  
  // Breadcrumbs domain
  breadcrumbs: {
    all: ['breadcrumbs'] as const,
    project: (projectId: string) => ['breadcrumbs', 'project', projectId] as const,
  }
}

// Query Key Validation Contract
export interface QueryKeyValidation {
  key: QueryKey
  isValid: boolean
  errors: string[]
}

export function validateQueryKey(key: unknown[]): QueryKeyValidation {
  const errors: string[] = []
  
  if (!Array.isArray(key) || key.length < 2) {
    errors.push('Query key must be an array with at least 2 elements')
    return { key: key as QueryKey, isValid: false, errors }
  }
  
  const [domain, action, ...identifiers] = key
  
  // Validate domain
  const validDomains: QueryKeyDomain[] = ['projects', 'trello', 'files', 'user', 'settings', 'upload', 'breadcrumbs']
  if (!validDomains.includes(domain as QueryKeyDomain)) {
    errors.push(`Invalid domain "${domain}". Must be one of: ${validDomains.join(', ')}`)
  }
  
  // Validate action
  const validActions: QueryKeyAction[] = ['list', 'detail', 'status', 'progress', 'preferences', 'selection', 'board', 'cards', 'profile']
  if (!validActions.includes(action as QueryKeyAction)) {
    errors.push(`Invalid action "${action}". Must be one of: ${validActions.join(', ')}`)
  }
  
  // Validate identifiers
  for (const identifier of identifiers) {
    if (typeof identifier !== 'string' && typeof identifier !== 'number') {
      errors.push(`Identifier "${identifier}" must be string or number`)
    }
    if (typeof identifier === 'string' && identifier.trim() === '') {
      errors.push('String identifiers cannot be empty')
    }
  }
  
  return {
    key: key as QueryKey,
    isValid: errors.length === 0,
    errors
  }
}

// Cache Invalidation Patterns
export interface InvalidationPattern {
  description: string
  trigger: QueryKey
  invalidates: QueryKey[]
  strategy: 'exact' | 'prefix' | 'predicate'
  predicate?: (key: QueryKey) => boolean
}

export const invalidationPatterns: InvalidationPattern[] = [
  {
    description: 'Project creation invalidates project list',
    trigger: ['projects', 'detail', 'new'],
    invalidates: [['projects', 'list']],
    strategy: 'exact'
  },
  {
    description: 'Project update invalidates related queries',
    trigger: ['projects', 'detail', '*'],
    invalidates: [['projects', 'list'], ['projects', 'detail']],
    strategy: 'prefix'
  },
  {
    description: 'File upload completion invalidates project and file queries',
    trigger: ['upload', 'status', '*'],
    invalidates: [],
    strategy: 'predicate',
    predicate: (key) => {
      const [domain] = key
      return domain === 'projects' || domain === 'files'
    }
  },
  {
    description: 'Trello board update invalidates board and card queries',
    trigger: ['trello', 'board', '*'],
    invalidates: [['trello', 'cards']],
    strategy: 'prefix'
  },
  {
    description: 'User profile update invalidates user queries',
    trigger: ['user', 'profile'],
    invalidates: [['user', 'preferences']],
    strategy: 'prefix'
  },
  {
    description: 'Settings change invalidates all settings queries',
    trigger: ['settings', '*'],
    invalidates: [['settings']],
    strategy: 'prefix'
  }
]

// Query Configuration Schema
export interface QueryConfigurationSchema {
  queryKey: QueryKey
  staleTime: number
  cacheTime: number
  retry: number | boolean
  refetchOnWindowFocus: boolean
  refetchOnReconnect: boolean
  refetchInterval?: number | false
  enabled?: boolean
}

export const defaultQueryConfigurations: Record<string, Partial<QueryConfigurationSchema>> = {
  // Static data (user preferences, settings)
  static: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  },
  
  // Dynamic data (project status, file lists)
  dynamic: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  },
  
  // Real-time data (upload progress)
  realtime: {
    staleTime: 0, // Always stale
    cacheTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 // 1 second
  },
  
  // External API data (Trello)
  external: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  }
}

// Query Key to Configuration Mapping
export function getQueryConfiguration(queryKey: QueryKey): Partial<QueryConfigurationSchema> {
  const [domain, action] = queryKey
  
  // Real-time data
  if (domain === 'upload' && action === 'progress') {
    return defaultQueryConfigurations.realtime
  }
  
  // External API data
  if (domain === 'trello') {
    return defaultQueryConfigurations.external
  }
  
  // Static data
  if ((domain === 'user' && action === 'preferences') || 
      (domain === 'settings')) {
    return defaultQueryConfigurations.static
  }
  
  // Default to dynamic data
  return defaultQueryConfigurations.dynamic
}