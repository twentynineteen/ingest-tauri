# Phase 0: Research - useEffect to React Query Migration

## Current State Analysis

### useEffect Patterns Found
Based on codebase analysis, identified 15+ files with useEffect patterns that need migration:

**Hook Files with useEffect**:
- `useBreadcrumb.ts` - Data fetching and state updates
- `useTrelloBoard.ts` - API polling and state management  
- `useUploadEvents.ts` - Event listener management
- `useImageRefresh.ts` - Periodic image refresh
- `useCameraAutoRemap.ts` - Data synchronization
- `useCopyProgress.ts` - Progress tracking
- `useAutoFileSelection.ts` - File system monitoring
- `useZoomPan.ts` - UI state management
- `usePosterframeAutoRedraw.ts` - Canvas redraw logic

**Component Files with useEffect**:
- `nav-user.tsx` - User data loading
- `FolderTree.tsx` - File system data
- `TrelloIntegrationModal.tsx` - API data fetching
- `Settings.tsx` - Configuration loading
- `FolderTreeNavigator.tsx` - Navigation state

### Existing React Query Usage
The project already has TanStack React Query 5.86.0 configured and in use:
- Query client configured in `App.tsx`
- Multiple hooks already using React Query: `useTrelloBoard.ts`, `useFileSelection.ts`, `useVersionCheck.ts`, etc.
- Established patterns for mutations and cache management

## Migration Strategy Research

### Decision: Incremental Migration Approach
**Rationale**: 
- Preserve existing functionality during transition
- Allow for testing each migration independently  
- Minimize risk to production workflows
- Enable parallel development on different hook files

**Alternatives considered**:
- Big bang migration: Rejected due to high risk and testing complexity
- Keep both patterns: Rejected due to maintenance burden and inconsistency

### Decision: Query Key Naming Convention
**Rationale**: Consistent, hierarchical query keys for effective cache management
**Pattern**: `[domain, action, ...identifiers]`
**Examples**:
- `['projects', 'list']` for project listing
- `['trello', 'boards', boardId]` for specific Trello board
- `['files', 'selection', projectId]` for file selection state

**Alternatives considered**:
- String-based keys: Rejected due to cache invalidation complexity
- Flat key structure: Rejected due to poor cache organization

### Decision: Error Handling Strategy  
**Rationale**: Consistent error boundaries with user-friendly messaging
**Approach**: 
- React Query error handling with retry logic
- Toast notifications for user feedback
- Graceful degradation for non-critical failures

**Alternatives considered**:
- Component-level error handling: Rejected due to inconsistency
- Silent failures: Rejected due to poor user experience

### Decision: Cache Management Strategy
**Rationale**: Balance between performance and data freshness
**Approach**:
- 5-minute staleTime for relatively static data (user preferences)
- 1-minute staleTime for dynamic data (project status)  
- 30-second staleTime for real-time data (upload progress)
- Manual invalidation for mutations

**Alternatives considered**:
- No caching: Rejected due to performance impact
- Long cache times: Rejected due to data staleness concerns

### Decision: Testing Strategy
**Rationale**: Ensure migration doesn't break existing functionality
**Approach**:
- Contract tests for each migrated hook
- Integration tests for component behavior
- Performance tests for cache effectiveness
- Mock Service Worker for API testing

**Alternatives considered**:
- Unit tests only: Rejected due to integration complexity
- Manual testing only: Rejected due to regression risk

## Technical Dependencies

### React Query Configuration
- Query client with optimized defaults
- Dev tools integration for debugging
- Error boundaries for graceful failure handling

### Testing Infrastructure  
- MSW for API mocking
- Testing utilities for React Query
- Performance monitoring tools

### Migration Utilities
- Hook migration helpers
- Query key factory functions
- Cache invalidation utilities

## Risk Assessment

### Low Risk Migrations
- `useImageRefresh.ts` - Simple periodic refresh
- `useZoomPan.ts` - UI-only state management
- `useAutoFileSelection.ts` - File system monitoring

### Medium Risk Migrations  
- `useTrelloBoard.ts` - Already partially using React Query
- `useBreadcrumb.ts` - Core navigation functionality
- `nav-user.tsx` - User authentication data

### High Risk Migrations
- `useUploadEvents.ts` - Complex event handling
- `TrelloIntegrationModal.tsx` - External API integration
- `usePosterframeAutoRedraw.ts` - Canvas manipulation with timing

## Performance Considerations

### Expected Improvements
- Reduced API calls through intelligent caching
- Automatic request deduplication
- Background refetching for fresh data
- Optimistic updates for better UX

### Monitoring Requirements
- Request frequency tracking
- Cache hit/miss ratios
- Component render performance
- Memory usage patterns

## Implementation Phases

### Phase 1: Core Infrastructure
- Query key factory functions
- Error handling utilities  
- Testing setup improvements

### Phase 2: Low-Risk Migrations
- Simple useEffect → useQuery conversions
- UI state management hooks
- Non-critical data fetching

### Phase 3: Medium-Risk Migrations
- Navigation and user data
- Trello integration improvements
- File system operations

### Phase 4: High-Risk Migrations
- Complex event handling
- Canvas operations
- External service integrations

## Success Criteria

### Functional Requirements Met
- All data fetching uses React Query
- Consistent loading states across app
- Improved error handling and retry logic
- Reduced redundant API calls

### Performance Metrics
- 30% reduction in API calls through caching
- Improved perceived performance on navigation
- Consistent loading states across components
- Better memory usage through cache management

### Code Quality Improvements
- Elimination of complex useEffect dependencies
- Standardized data fetching patterns
- Improved testability of data-related logic
- Better separation of concerns in components