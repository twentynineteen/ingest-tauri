# Quickstart Guide - useEffect to React Query Migration

## Overview
This guide demonstrates the successful migration of legacy useEffect patterns to TanStack React Query hooks through practical examples and validation steps.

## Prerequisites
- TanStack React Query 5.86.0 installed and configured
- Jest testing environment set up
- Basic understanding of React Query concepts

## Migration Validation Steps

### 1. Environment Setup
```bash
# Verify React Query is properly configured
npm run test -- --testNamePattern="React Query setup"

# Check that Query Client is available in components
npm run test -- --testNamePattern="QueryClient provider"
```

### 2. Basic Hook Migration Test

**Test Scenario**: Verify useBreadcrumb migration preserves functionality

```typescript
// Test file: tests/integration/useBreadcrumb.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBreadcrumb } from '../src/hooks/useBreadcrumb'

describe('useBreadcrumb Migration', () => {
  let queryClient: QueryClient
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })
  
  it('should load breadcrumb data for project', async () => {
    const { result } = renderHook(
      () => useBreadcrumb('test-project-id'),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      }
    )
    
    // Initial loading state
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
    
    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeDefined()
    })
    
    // Verify refetch functionality
    expect(typeof result.current.refetch).toBe('function')
  })
})
```

**Expected Result**: ✅ Test passes, proving basic migration works

### 3. Caching Behavior Validation

**Test Scenario**: Verify data is cached and reused across component mounts

```typescript
describe('Caching Behavior', () => {
  it('should cache data across multiple hook instances', async () => {
    const queryClient = new QueryClient()
    
    // First hook instance
    const { result: result1 } = renderHook(
      () => useBreadcrumb('project-123'),
      { wrapper: createWrapper(queryClient) }
    )
    
    await waitFor(() => expect(result1.current.isSuccess).toBe(true))
    
    // Second hook instance with same project ID
    const { result: result2 } = renderHook(
      () => useBreadcrumb('project-123'),
      { wrapper: createWrapper(queryClient) }
    )
    
    // Should immediately have data from cache
    expect(result2.current.data).toEqual(result1.current.data)
    expect(result2.current.isLoading).toBe(false)
  })
})
```

**Expected Result**: ✅ Second instance uses cached data without network request

### 4. Error Handling Test

**Test Scenario**: Verify error states are properly handled

```typescript
describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    // Mock network failure
    server.use(
      rest.get('/api/breadcrumbs/*', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }))
      })
    )
    
    const { result } = renderHook(
      () => useBreadcrumb('project-123'),
      { wrapper: createWrapper(queryClient) }
    )
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()
    })
    
    // Verify retry functionality
    expect(result.current.failureCount).toBeGreaterThan(0)
  })
})
```

**Expected Result**: ✅ Error states handled with appropriate retry logic

### 5. Performance Validation

**Test Scenario**: Verify migration improves performance metrics

```bash
# Run performance tests
npm run test -- --testNamePattern="Performance regression"

# Check network call reduction
npm run test:integration -- --verbose
```

**Expected Metrics**:
- 30% reduction in duplicate API calls
- Consistent loading states across components
- Background refetch working correctly

### 6. Integration with Existing Components

**Test Scenario**: Verify migrated hooks work in actual components

```typescript
// Test file: tests/integration/components/NavUser.test.tsx
describe('NavUser Component Integration', () => {
  it('should display user data using migrated hook', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NavUser />
      </QueryClientProvider>
    )
    
    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    
    // Success state
    await waitFor(() => {
      expect(screen.getByText(/user profile/i)).toBeInTheDocument()
    })
    
    // Verify no console errors
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/error/i),
      expect.anything()
    )
  })
})
```

**Expected Result**: ✅ Component renders correctly with migrated hook

### 7. Cache Invalidation Test

**Test Scenario**: Verify cache invalidation works correctly

```typescript
describe('Cache Invalidation', () => {
  it('should invalidate related queries on mutation', async () => {
    const { result: breadcrumbResult } = renderHook(
      () => useBreadcrumb('project-123'),
      { wrapper: createWrapper(queryClient) }
    )
    
    // Wait for initial data
    await waitFor(() => expect(breadcrumbResult.current.isSuccess).toBe(true))
    
    // Perform mutation that should invalidate breadcrumbs
    const { result: mutationResult } = renderHook(
      () => useUpdateProject(),
      { wrapper: createWrapper(queryClient) }
    )
    
    await act(async () => {
      mutationResult.current.mutate({
        projectId: 'project-123',
        name: 'Updated Project'
      })
    })
    
    // Verify breadcrumb data was refetched
    await waitFor(() => {
      expect(breadcrumbResult.current.isFetching).toBe(true)
    })
  })
})
```

**Expected Result**: ✅ Cache invalidation triggers appropriate refetches

## Validation Checklist

### Functional Requirements
- [ ] ✅ All data fetching uses React Query instead of useEffect
- [ ] ✅ Loading states are consistent across components
- [ ] ✅ Error handling provides retry mechanisms and user feedback
- [ ] ✅ Cache invalidation works for related data updates
- [ ] ✅ Background refetch maintains fresh data

### Performance Requirements  
- [ ] ✅ 30% reduction in duplicate API calls achieved
- [ ] ✅ Component re-renders minimized through proper cache usage
- [ ] ✅ Memory usage optimized with automatic cache cleanup
- [ ] ✅ Network requests deduplicated for simultaneous queries

### User Experience
- [ ] ✅ No regression in existing workflows
- [ ] ✅ Improved responsiveness from cached data
- [ ] ✅ Better error messages and recovery options
- [ ] ✅ Seamless navigation with background data loading

### Code Quality
- [ ] ✅ Complex useEffect dependencies eliminated
- [ ] ✅ Standardized query key naming convention
- [ ] ✅ Improved testability of data fetching logic
- [ ] ✅ Better separation of concerns in components

## Success Criteria Verification

### Run Complete Test Suite
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests (if available)
npm run test:e2e

# Performance tests
npm run test:performance
```

### Manual Testing Scenarios

1. **Project Navigation**:
   - Open project → Navigate away → Return
   - ✅ Data loads from cache instantly

2. **Network Failure**:
   - Disconnect network → Attempt data fetch
   - ✅ Error state displayed with retry option

3. **Real-time Updates**:
   - Start file upload → Monitor progress
   - ✅ Progress updates smoothly without interruption

4. **Cache Invalidation**:
   - Update project settings → Check related data
   - ✅ Related queries refresh automatically

### Performance Monitoring

```bash
# Check bundle size impact
npm run build
npx bundlesize

# Monitor runtime performance
npm run dev
# Use React DevTools Profiler to measure component renders
```

**Expected Improvements**:
- Reduced JavaScript bundle size (React Query tree-shaking)
- Fewer component re-renders
- Better perceived performance from caching

## Rollback Plan

If validation fails, rollback steps:

1. **Immediate Issues**:
   ```bash
   git checkout HEAD~1  # Revert to previous version
   npm run test         # Verify rollback works
   ```

2. **Gradual Rollback**:
   - Keep migrated hooks but disable React Query features
   - Re-enable useEffect fallbacks temporarily
   - Investigate and fix issues incrementally

3. **Complete Rollback**:
   - Restore original useEffect implementations
   - Remove React Query dependencies from affected components
   - Update tests to match original behavior

## Next Steps After Validation

1. **Monitoring**: Set up performance monitoring for production
2. **Documentation**: Update development guidelines for React Query usage
3. **Team Training**: Share migration patterns and best practices
4. **Incremental Improvements**: Identify additional optimization opportunities

This quickstart guide ensures the migration delivers the expected improvements while maintaining system reliability and user experience.