/**
 * Unit Test: useBreadcrumbsManager React Hook
 * 
 * This test verifies the useBreadcrumbsManager custom hook behavior.
 * It MUST FAIL initially until the hook implementation is complete.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { useBreadcrumbsManager } from '../../src/hooks/useBreadcrumbsManager'
import type { BatchUpdateResult } from '../../src/types/baker'

// Mock Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}))

describe('useBreadcrumbsManager Hook', () => {
  const mockBatchResult: BatchUpdateResult = {
    successful: ['/path/to/project1', '/path/to/project2'],
    failed: [{
      path: '/path/to/failed',
      error: 'Permission denied'
    }],
    created: ['/path/to/project2'],
    updated: ['/path/to/project1']
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should initialize with correct default state', () => {
    const { result } = renderHook(() => useBreadcrumbsManager())

    expect(result.current.isUpdating).toBe(false)
    expect(result.current.lastUpdateResult).toBeNull()
    expect(result.current.error).toBeNull()
    expect(typeof result.current.updateBreadcrumbs).toBe('function')
  })

  test('should update breadcrumbs successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockResolvedValue(mockBatchResult)

    const { result } = renderHook(() => useBreadcrumbsManager())
    
    const projectPaths = ['/path/to/project1', '/path/to/project2']
    const options = { createMissing: true, backupOriginals: true }

    let updateResult: BatchUpdateResult | undefined
    await act(async () => {
      updateResult = await result.current.updateBreadcrumbs(projectPaths, options)
    })

    expect(result.current.isUpdating).toBe(false)
    expect(result.current.lastUpdateResult).toEqual(mockBatchResult)
    expect(result.current.error).toBeNull()
    expect(updateResult).toEqual(mockBatchResult)
    
    expect(invoke).toHaveBeenCalledWith('baker_update_breadcrumbs', {
      projectPaths,
      createMissing: true,
      backupOriginals: true
    })
  })

  test('should handle update errors correctly', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    const errorMessage = 'Update failed'
    vi.mocked(invoke).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useBreadcrumbsManager())

    await act(async () => {
      try {
        await result.current.updateBreadcrumbs(['/path/to/project'], {
          createMissing: false,
          backupOriginals: false
        })
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.isUpdating).toBe(false)
    expect(result.current.error).toBe(errorMessage)
    expect(result.current.lastUpdateResult).toBeNull()
  })

  test('should set isUpdating state during operation', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    
    // Create a promise that we can control
    let resolveUpdate: (value: BatchUpdateResult) => void
    const updatePromise = new Promise<BatchUpdateResult>((resolve) => {
      resolveUpdate = resolve
    })
    
    vi.mocked(invoke).mockReturnValue(updatePromise)

    const { result } = renderHook(() => useBreadcrumbsManager())

    // Start the update
    const updateCall = act(async () => {
      await result.current.updateBreadcrumbs(['/path/to/project'], {
        createMissing: true,
        backupOriginals: false
      })
    })

    // Should be updating now
    expect(result.current.isUpdating).toBe(true)

    // Complete the update
    act(() => {
      resolveUpdate!(mockBatchResult)
    })
    
    await updateCall

    // Should no longer be updating
    expect(result.current.isUpdating).toBe(false)
  })

  test('should validate input parameters', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockResolvedValue(mockBatchResult)

    const { result } = renderHook(() => useBreadcrumbsManager())

    // Empty project paths should throw error
    await act(async () => {
      try {
        await result.current.updateBreadcrumbs([], {
          createMissing: true,
          backupOriginals: true
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('empty')
      }
    })

    expect(result.current.error).not.toBeNull()
  })

  test('should handle partial success results correctly', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    const partialSuccessResult: BatchUpdateResult = {
      successful: ['/path/to/project1'],
      failed: [{ path: '/path/to/project2', error: 'File not found' }],
      created: [],
      updated: ['/path/to/project1']
    }
    
    vi.mocked(invoke).mockResolvedValue(partialSuccessResult)

    const { result } = renderHook(() => useBreadcrumbsManager())

    await act(async () => {
      await result.current.updateBreadcrumbs([
        '/path/to/project1',
        '/path/to/project2'
      ], {
        createMissing: false,
        backupOriginals: true
      })
    })

    expect(result.current.lastUpdateResult).toEqual(partialSuccessResult)
    expect(result.current.lastUpdateResult!.successful.length).toBe(1)
    expect(result.current.lastUpdateResult!.failed.length).toBe(1)
  })

  test('should prevent concurrent updates', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    
    let resolveFirstUpdate: (value: BatchUpdateResult) => void
    const firstUpdatePromise = new Promise<BatchUpdateResult>((resolve) => {
      resolveFirstUpdate = resolve
    })
    
    vi.mocked(invoke).mockReturnValueOnce(firstUpdatePromise)
    vi.mocked(invoke).mockResolvedValue(mockBatchResult)

    const { result } = renderHook(() => useBreadcrumbsManager())

    // Start first update
    const firstUpdate = act(async () => {
      await result.current.updateBreadcrumbs(['/path/1'], {
        createMissing: true,
        backupOriginals: false
      })
    })

    // Try to start second update while first is pending
    await act(async () => {
      try {
        await result.current.updateBreadcrumbs(['/path/2'], {
          createMissing: true,
          backupOriginals: false
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('already')
      }
    })

    // Complete first update
    act(() => {
      resolveFirstUpdate!(mockBatchResult)
    })
    
    await firstUpdate

    // Should have only called invoke once (first update)
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  test('should clear error state on successful update', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    
    // First call fails
    vi.mocked(invoke).mockRejectedValueOnce(new Error('First error'))
    // Second call succeeds  
    vi.mocked(invoke).mockResolvedValueOnce(mockBatchResult)

    const { result } = renderHook(() => useBreadcrumbsManager())

    // First update fails
    await act(async () => {
      try {
        await result.current.updateBreadcrumbs(['/path'], {
          createMissing: true,
          backupOriginals: false
        })
      } catch (error) {
        // Expected
      }
    })

    expect(result.current.error).toBe('First error')

    // Second update succeeds
    await act(async () => {
      await result.current.updateBreadcrumbs(['/path'], {
        createMissing: true,
        backupOriginals: false
      })
    })

    expect(result.current.error).toBeNull()
    expect(result.current.lastUpdateResult).toEqual(mockBatchResult)
  })
})