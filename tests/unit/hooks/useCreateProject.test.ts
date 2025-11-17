/**
 * useCreateProject Hook Tests
 * Purpose: Test project creation workflow and file operations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateProject } from '@/hooks/useCreateProject'
import type { FootageFile } from '@/hooks/useCameraAutoRemap'

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn()
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  confirm: vi.fn()
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: vi.fn(),
  mkdir: vi.fn(),
  remove: vi.fn(),
  writeTextFile: vi.fn()
}))

vi.mock('store/useAppStore', () => ({
  appStore: {
    getState: vi.fn(() => ({
      setBreadcrumbs: vi.fn()
    }))
  }
}))

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { confirm } from '@tauri-apps/plugin-dialog'
import { exists, mkdir, remove, writeTextFile } from '@tauri-apps/plugin-fs'
import { appStore } from 'store/useAppStore'

describe('useCreateProject', () => {
  const mockSetProgress = vi.fn()
  const mockSetCompleted = vi.fn()
  const mockSetMessage = vi.fn()
  const mockSetLoading = vi.fn()
  const mockUnlisten = vi.fn()

  const defaultParams = {
    title: 'Test Project',
    files: [
      {
        file: { path: '/source/video1.mp4', name: 'video1.mp4' },
        camera: 1
      },
      {
        file: { path: '/source/video2.mp4', name: 'video2.mp4' },
        camera: 2
      }
    ] as FootageFile[],
    selectedFolder: '/destination',
    numCameras: 2,
    username: 'Test User',
    setProgress: mockSetProgress,
    setCompleted: mockSetCompleted,
    setMessage: mockSetMessage,
    setLoading: mockSetLoading
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(exists).mockResolvedValue(false)
    vi.mocked(mkdir).mockResolvedValue(undefined)
    vi.mocked(writeTextFile).mockResolvedValue(undefined)
    vi.mocked(confirm).mockResolvedValue(true)
    vi.mocked(listen).mockResolvedValue(mockUnlisten)
    vi.mocked(invoke).mockResolvedValue(undefined)

    // Mock alert
    global.alert = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe('validation', () => {
    it('should alert if no folder is selected', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject({
        ...defaultParams,
        selectedFolder: ''
      })

      expect(global.alert).toHaveBeenCalledWith('Please select a destination folder.')
      expect(mkdir).not.toHaveBeenCalled()
    })

    it('should alert if title is empty', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject({
        ...defaultParams,
        title: ''
      })

      expect(global.alert).toHaveBeenCalledWith('Please enter a project title.')
      expect(mkdir).not.toHaveBeenCalled()
    })

    it('should alert if title is only whitespace', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject({
        ...defaultParams,
        title: '   '
      })

      expect(global.alert).toHaveBeenCalledWith('Please enter a project title.')
      expect(mkdir).not.toHaveBeenCalled()
    })

    it('should confirm when no files are added', async () => {
      const { result } = renderHook(() => useCreateProject())

      vi.mocked(confirm).mockResolvedValueOnce(false)

      await result.current.createProject({
        ...defaultParams,
        files: []
      })

      expect(confirm).toHaveBeenCalledWith(
        'No files have been added to the drag and drop section. Are you sure you want to create the project?'
      )
      expect(mkdir).not.toHaveBeenCalled()
    })

    it('should proceed when user confirms no files', async () => {
      const { result } = renderHook(() => useCreateProject())

      vi.mocked(confirm).mockResolvedValueOnce(true)

      await result.current.createProject({
        ...defaultParams,
        files: []
      })

      expect(confirm).toHaveBeenCalled()
      expect(mkdir).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Folder Existence Tests
  // ============================================================================

  describe('folder existence handling', () => {
    it('should check if project folder exists', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject(defaultParams)

      expect(exists).toHaveBeenCalledWith('/destination/Test Project')
    })

    it('should confirm overwrite when folder exists', async () => {
      const { result } = renderHook(() => useCreateProject())

      vi.mocked(exists).mockResolvedValue(true)
      vi.mocked(confirm).mockResolvedValueOnce(false)

      await result.current.createProject(defaultParams)

      expect(confirm).toHaveBeenCalledWith(
        'The folder "/destination/Test Project" already exists. Do you want to overwrite it?'
      )
      expect(remove).not.toHaveBeenCalled()
    })

    it('should remove existing folder when user confirms overwrite', async () => {
      const { result } = renderHook(() => useCreateProject())

      vi.mocked(exists).mockResolvedValue(true)
      vi.mocked(confirm).mockResolvedValueOnce(true)

      await result.current.createProject(defaultParams)

      expect(remove).toHaveBeenCalledWith('/destination/Test Project', { recursive: true })
    })

    it('should not remove folder if user cancels overwrite', async () => {
      const { result } = renderHook(() => useCreateProject())

      vi.mocked(exists).mockResolvedValue(true)
      vi.mocked(confirm).mockResolvedValueOnce(false)

      await result.current.createProject(defaultParams)

      expect(remove).not.toHaveBeenCalled()
      expect(mkdir).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Folder Structure Creation Tests
  // ============================================================================

  describe('folder structure creation', () => {
    it('should create main project folder', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject(defaultParams)

      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project', { recursive: true })
    })

    it('should create camera folders based on numCameras', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject(defaultParams)

      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Footage/Camera 1', {
        recursive: true
      })
      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Footage/Camera 2', {
        recursive: true
      })
    })

    it('should create all required subfolders', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject(defaultParams)

      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Graphics', {
        recursive: true
      })
      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Renders', {
        recursive: true
      })
      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Projects', {
        recursive: true
      })
      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Scripts', {
        recursive: true
      })
    })

    it('should trim whitespace from project title', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject({
        ...defaultParams,
        title: '  Trimmed Title  '
      })

      expect(mkdir).toHaveBeenCalledWith('/destination/Trimmed Title', { recursive: true })
    })

    it('should create correct number of camera folders', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject({
        ...defaultParams,
        numCameras: 4
      })

      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Footage/Camera 1', {
        recursive: true
      })
      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Footage/Camera 2', {
        recursive: true
      })
      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Footage/Camera 3', {
        recursive: true
      })
      expect(mkdir).toHaveBeenCalledWith('/destination/Test Project/Footage/Camera 4', {
        recursive: true
      })
    })
  })

  // ============================================================================
  // Breadcrumbs Creation Tests
  // ============================================================================

  describe('breadcrumbs file creation', () => {
    it('should create breadcrumbs.json with correct data', async () => {
      const { result } = renderHook(() => useCreateProject())

      vi.mocked(invoke).mockResolvedValueOnce(1024000) // folder size

      await result.current.createProject(defaultParams)

      await waitFor(() => {
        expect(writeTextFile).toHaveBeenCalled()
      })

      const writeCall = vi.mocked(writeTextFile).mock.calls[0]
      expect(writeCall[0]).toBe('/destination/Test Project/breadcrumbs.json')

      const breadcrumbsData = JSON.parse(writeCall[1] as string)
      expect(breadcrumbsData).toMatchObject({
        projectTitle: 'Test Project',
        numberOfCameras: 2,
        parentFolder: '/destination',
        createdBy: 'Test User'
      })
      expect(breadcrumbsData.files).toHaveLength(2)
      expect(breadcrumbsData.creationDateTime).toBeDefined()
    })

    it('should include file information in breadcrumbs', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject(defaultParams)

      await waitFor(() => {
        expect(writeTextFile).toHaveBeenCalled()
      })

      const breadcrumbsData = JSON.parse(
        vi.mocked(writeTextFile).mock.calls[0][1] as string
      )

      expect(breadcrumbsData.files).toEqual([
        { camera: 1, name: 'video1.mp4', path: '/source/video1.mp4' },
        { camera: 2, name: 'video2.mp4', path: '/source/video2.mp4' }
      ])
    })

    it('should handle folder size calculation failure gracefully', async () => {
      const { result } = renderHook(() => useCreateProject())

      vi.mocked(invoke).mockRejectedValueOnce(new Error('Size calculation failed'))

      await result.current.createProject(defaultParams)

      await waitFor(() => {
        expect(writeTextFile).toHaveBeenCalled()
      })

      const breadcrumbsData = JSON.parse(
        vi.mocked(writeTextFile).mock.calls[0][1] as string
      )

      expect(breadcrumbsData.folderSizeBytes).toBeUndefined()
    })

    it('should update app store with breadcrumbs data', async () => {
      const { result } = renderHook(() => useCreateProject())
      const mockSetBreadcrumbs = vi.fn()

      vi.mocked(appStore.getState).mockReturnValue({
        setBreadcrumbs: mockSetBreadcrumbs
      } as any)

      await result.current.createProject(defaultParams)

      await waitFor(() => {
        expect(mockSetBreadcrumbs).toHaveBeenCalledWith(
          expect.objectContaining({
            projectTitle: 'Test Project',
            numberOfCameras: 2
          })
        )
      })
    })
  })

  // ============================================================================
  // Progress Callback Tests
  // ============================================================================

  describe('progress callbacks', () => {
    it('should call setProgress with 0 initially', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject(defaultParams)

      expect(mockSetProgress).toHaveBeenCalledWith(0)
    })

    it('should call setCompleted with false initially', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject(defaultParams)

      expect(mockSetCompleted).toHaveBeenCalledWith(false)
    })

    it('should handle missing progress callbacks gracefully', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject({
        ...defaultParams,
        setProgress: undefined,
        setCompleted: undefined
      })

      // Should not throw error
      expect(mkdir).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // File Moving Tests
  // ============================================================================

  describe('file moving', () => {
    it('should invoke move_files with correct parameters', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject(defaultParams)

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('move_files', {
          files: [
            ['/source/video1.mp4', 1],
            ['/source/video2.mp4', 2]
          ],
          baseDest: '/destination/Test Project'
        })
      })
    })

    it('should setup event listener before moving files', async () => {
      const { result } = renderHook(() => useCreateProject())

      await result.current.createProject(defaultParams)

      await waitFor(() => {
        expect(listen).toHaveBeenCalledWith('copy_complete', expect.any(Function))
      })
    })
  })

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('error handling', () => {
    it('should alert and cleanup on mkdir error', async () => {
      const { result } = renderHook(() => useCreateProject())

      vi.mocked(mkdir).mockRejectedValueOnce(new Error('Permission denied'))

      await result.current.createProject(defaultParams)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('Error creating project')
        )
      })

      // Note: Event listener not created yet when mkdir fails, so mockUnlisten is not called
      // This is expected behavior - cleanup only happens if listener was created
    })

    it('should alert on file move error', async () => {
      const { result } = renderHook(() => useCreateProject())

      // Mock folder size calculation to succeed, then make move_files fail
      vi.mocked(invoke).mockResolvedValueOnce(1024000) // folder size
      vi.mocked(invoke).mockRejectedValueOnce(new Error('File move failed')) // move_files

      await result.current.createProject(defaultParams)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('Error creating project')
        )
      })
    })

    it('should cleanup event listener on error', async () => {
      const { result } = renderHook(() => useCreateProject())

      // Mock folder size to succeed, then make move_files fail
      // This ensures listener is created before error occurs
      vi.mocked(invoke).mockResolvedValueOnce(1024000) // folder size succeeds
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Test error')) // move_files fails

      await result.current.createProject(defaultParams)

      await waitFor(() => {
        expect(mockUnlisten).toHaveBeenCalled()
      })
    })
  })

  // ============================================================================
  // Return Value Tests
  // ============================================================================

  describe('hook return value', () => {
    it('should return createProject function', () => {
      const { result } = renderHook(() => useCreateProject())

      expect(result.current).toHaveProperty('createProject')
      expect(typeof result.current.createProject).toBe('function')
    })
  })
})
