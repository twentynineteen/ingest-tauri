# Phase 1: Data Model - React Query Migration Entities

## Query Configuration Entities

### QueryKey
Hierarchical identifier system for cache management:
```typescript
type QueryKey = [domain: string, action: string, ...identifiers: (string | number)[]]
```

**Examples**:
- `['projects', 'list']` - All projects
- `['trello', 'board', boardId]` - Specific Trello board
- `['files', 'selection', projectId]` - File selection for project
- `['user', 'profile']` - User profile data
- `['settings', 'preferences']` - Application settings

**Validation Rules**:
- Domain must be one of: `projects`, `trello`, `files`, `user`, `settings`, `upload`
- Action must be descriptive: `list`, `detail`, `status`, `progress`
- Identifiers must be stable across renders

### QueryConfiguration
Standard configuration for different data types:

```typescript
interface QueryConfiguration {
  queryKey: QueryKey
  staleTime: number
  cacheTime: number
  retry: number | boolean
  refetchOnWindowFocus: boolean
}
```

**Configuration Profiles**:
- **Static Data** (user preferences, settings): staleTime 5min, retry 3
- **Dynamic Data** (project status, file lists): staleTime 1min, retry 2  
- **Real-time Data** (upload progress): staleTime 30sec, retry 1
- **External APIs** (Trello, Sprout): staleTime 2min, retry 3

### MutationConfiguration
Handles data modifications with optimistic updates:

```typescript
interface MutationConfiguration {
  mutationFn: (variables: any) => Promise<any>
  onMutate?: (variables: any) => Promise<any>
  onSuccess?: (data: any, variables: any) => void
  onError?: (error: Error, variables: any, context: any) => void
  onSettled?: () => void
}
```

**Mutation Types**:
- **Project Operations**: Create, update, delete projects
- **File Operations**: Copy, move, delete files
- **Trello Operations**: Create cards, update status
- **Upload Operations**: Start, pause, cancel uploads

## Cache Invalidation Rules

### Invalidation Patterns
```typescript
interface InvalidationRule {
  trigger: QueryKey
  invalidates: QueryKey[]
  strategy: 'exact' | 'prefix' | 'predicate'
}
```

**Key Invalidation Rules**:
- Project creation invalidates: `['projects', 'list']`
- File upload completion invalidates: `['projects', 'detail', projectId]`, `['files', 'selection', projectId]`
- User profile update invalidates: `['user', 'profile']`
- Settings change invalidates: `['settings', 'preferences']`

### Background Refetch Triggers
- Window focus: High-priority data only
- Network reconnection: All stale queries
- Tab visibility: Resume real-time data
- User interaction: Context-specific refresh

## Loading State Management

### LoadingState Entity
```typescript
interface LoadingState {
  isLoading: boolean
  isFetching: boolean
  isRefetching: boolean
  isLoadingError: boolean
  progress?: number
}
```

**State Transitions**:
- Initial → Loading → Success/Error
- Success → Refetching → Success/Error  
- Error → Retrying → Success/Error
- Background → Fetching → Success/Error

### ProgressTracking
For long-running operations:
```typescript
interface ProgressState {
  total: number
  completed: number
  percentage: number
  estimatedTimeRemaining?: number
  currentItem?: string
}
```

## Error Handling Patterns

### ErrorBoundary Entity
```typescript
interface QueryError {
  type: 'network' | 'server' | 'validation' | 'timeout'
  message: string
  code?: number
  retryable: boolean
  context?: Record<string, any>
}
```

**Error Categories**:
- **Network Errors**: Connection issues, timeout
- **Server Errors**: API failures, 500 responses
- **Validation Errors**: Invalid data, schema mismatch
- **Business Errors**: Insufficient permissions, resource conflicts

### RetryStrategy
```typescript
interface RetryConfiguration {
  attempts: number
  delay: (attempt: number) => number
  condition: (error: Error) => boolean
}
```

**Retry Policies**:
- Network errors: Exponential backoff, max 3 attempts
- Server errors: Linear delay, max 2 attempts  
- Validation errors: No retry
- Business errors: No retry

## Migration Mapping

### Hook Migration Patterns

**useEffect Data Fetching → useQuery**:
```typescript
// Before: useEffect with fetch
useEffect(() => {
  fetchData().then(setData)
}, [dependency])

// After: useQuery
const { data } = useQuery({
  queryKey: ['domain', 'action', dependency],
  queryFn: () => fetchData(dependency)
})
```

**useEffect with Manual Refetch → useMutation**:
```typescript
// Before: useEffect with manual trigger
const [trigger, setTrigger] = useState(0)
useEffect(() => {
  if (trigger > 0) fetchData()
}, [trigger])

// After: useMutation
const { mutate: refetch } = useMutation({
  mutationFn: () => fetchData(),
  onSuccess: (data) => {
    queryClient.setQueryData(['domain', 'action'], data)
  }
})
```

### Component Integration Patterns

**Data Dependencies**:
- Components receive loading states from hooks
- Error boundaries handle query failures
- Suspense boundaries for loading states (optional)

**State Synchronization**:
- Local component state for UI-only data
- React Query for server state
- Zustand for global client state

## Testing Contracts

### Hook Testing Interface
```typescript
interface HookTestContract {
  hookName: string
  inputs: Record<string, any>
  expectedQueries: QueryKey[]
  expectedMutations?: string[]
  mockResponses: Record<string, any>
  assertBehaviors: TestAssertion[]
}
```

### Integration Testing
```typescript
interface ComponentTestContract {
  componentName: string
  requiredHooks: string[]
  userActions: UserAction[]
  expectedNetworkCalls: NetworkCall[]
  expectedUIStates: UIState[]
}
```

## Performance Optimization Entities

### CacheOptimization
```typescript
interface CacheStrategy {
  maxAge: number
  maxSize: number
  evictionPolicy: 'lru' | 'fifo' | 'manual'
  prefetchRules: PrefetchRule[]
}
```

### QueryPrefetching
```typescript
interface PrefetchRule {
  trigger: QueryKey
  prefetch: QueryKey[]
  condition?: (data: any) => boolean
  delay?: number
}
```

**Prefetch Strategies**:
- Hover prefetch for navigation items
- Route-based prefetch for page data
- User behavior prediction for likely actions
- Background prefetch for related data