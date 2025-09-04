# UploadSprout Refactoring Tasks

## Overview
The UploadSprout.tsx component has become complicated with multiple useEffect hooks and mixed concerns. This document outlines tasks to refactor it using React Query and separate custom hooks for better separation of concerns.

## Tasks

### 1. Migrate useEffect hooks to React Query
- [ ] Replace API key loading useEffect (lines 49-55) with React Query
- [ ] Convert upload event listeners (lines 77-102) to custom hook
- [ ] Handle image refresh timer (lines 35-46) with dedicated hook

### 2. Create separate custom hook files

#### `useApiKeys.ts`
- [ ] Handle loading API keys from storage
- [ ] Use React Query for caching and error handling
- [ ] Export hook that returns API keys and loading state

#### `useUploadEvents.ts`
- [ ] Manage Tauri event listeners for upload progress, completion, and errors
- [ ] Handle event cleanup properly
- [ ] Return event state (progress, uploading, message)

#### `useImageRefresh.ts`
- [ ] Handle thumbnail refresh logic with 30-second timer
- [ ] Manage refreshTimestamp and thumbnailLoaded state
- [ ] Trigger refresh when upload response changes

#### `useFileUpload.ts`
- [ ] Main upload logic and state management
- [ ] File selection handling
- [ ] Upload process with timeout and error handling
- [ ] Integration with other hooks

### 3. Update UploadSprout component
- [ ] Remove complex useEffect logic from component
- [ ] Import and use the new custom hooks
- [ ] Maintain existing functionality
- [ ] Ensure component focuses only on rendering logic

## Benefits
- Better separation of concerns
- Improved testability of individual hooks
- Consistent with project preference for React Query over useEffect
- Reduced component complexity
- Better error handling and caching with React Query

## Implementation Notes
- Follow existing project patterns in `/hooks` directory
- Use TanStack React Query as specified in CLAUDE.md
- Maintain all existing functionality during refactor
- Ensure proper cleanup of event listeners and timers