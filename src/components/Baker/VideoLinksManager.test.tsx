/**
 * VideoLinksManager Component Tests
 * Feature: 004-embed-multiple-video
 * Tests T002-T008: Component behavior for video upload toggle enhancement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { VideoLinksManager } from './VideoLinksManager'
import * as useBreadcrumbsVideoLinksModule from '../../hooks/useBreadcrumbsVideoLinks'
import * as useSproutVideoApiModule from '../../hooks/useSproutVideoApi'
import * as useApiKeysModule from '../../hooks/useApiKeys'
import * as useFileUploadModule from '../../hooks/useFileUpload'
import * as useUploadEventsModule from '../../hooks/useUploadEvents'
import * as useSproutVideoProcessorModule from '../../hooks/useSproutVideoProcessor'

// Mock hooks
vi.mock('../../hooks/useBreadcrumbsVideoLinks')
vi.mock('../../hooks/useSproutVideoApi')
vi.mock('../../hooks/useApiKeys')
vi.mock('../../hooks/useFileUpload')
vi.mock('../../hooks/useUploadEvents')
vi.mock('../../hooks/useSproutVideoProcessor')

describe('VideoLinksManager - Upload Toggle Enhancement', () => {
  const mockProjectPath = '/test/project'

  // Default mock implementations
  const mockAddVideoLink = vi.fn()
  const mockRemoveVideoLink = vi.fn()
  const mockReorderVideoLinks = vi.fn()
  const mockSelectFile = vi.fn()
  const mockUploadFile = vi.fn()
  const mockResetUploadState = vi.fn()
  const mockVideoProcessorReset = vi.fn()

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock useBreadcrumbsVideoLinks
    vi.mocked(useBreadcrumbsVideoLinksModule.useBreadcrumbsVideoLinks).mockReturnValue({
      videoLinks: [],
      isLoading: false,
      error: null,
      addVideoLink: mockAddVideoLink,
      removeVideoLink: mockRemoveVideoLink,
      reorderVideoLinks: mockReorderVideoLinks,
      isUpdating: false,
      addError: null
    })

    // Mock useSproutVideoApi
    vi.mocked(useSproutVideoApiModule.useSproutVideoApi).mockReturnValue({
      fetchVideoDetailsAsync: vi.fn(),
      isFetching: false,
      error: null
    })

    // Mock useSproutVideoApiKey
    vi.mocked(useApiKeysModule.useSproutVideoApiKey).mockReturnValue({
      apiKey: 'test-api-key',
      isLoading: false,
      updateApiKey: vi.fn()
    })

    // Mock useFileUpload
    vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
      selectedFile: null,
      uploading: false,
      response: null,
      selectFile: mockSelectFile,
      uploadFile: mockUploadFile,
      resetUploadState: mockResetUploadState
    })

    // Mock useUploadEvents
    vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
      progress: 0,
      message: null
    })

    // Mock useSproutVideoProcessor - implement callback behavior
    vi.mocked(useSproutVideoProcessorModule.useSproutVideoProcessor).mockImplementation((options) => {
      // Simulate auto-processing when enabled and valid response provided
      if (options.enabled && options.response && !options.uploading && options.selectedFile) {
        const response = options.response

        // Check if upload failed
        if (response.state === 'failed') {
          options.onError('Upload failed: Sprout Video could not process the video. Please check the file format and try again.')
        }
        // Check if we have a valid embedded_url (video is ready)
        else if (response.embedded_url) {
          const filename = options.selectedFile.split('/').pop()?.split('.')[0] || 'Untitled'
          const sourceFilename = options.selectedFile.split('/').pop() || ''

          const videoLink = {
            url: response.embedded_url,
            sproutVideoId: response.id,
            title: response.title || filename,
            thumbnailUrl: response.assets?.poster_frames?.[0] || undefined,
            uploadDate: response.created_at,
            sourceRenderFile: sourceFilename
          }

          // Trigger callback on next tick to simulate async processing
          setTimeout(() => options.onVideoReady(videoLink), 0)
        }
      }

      return {
        isProcessing: false,
        error: null,
        reset: mockVideoProcessorReset
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================
  // T002: Tab switching behavior
  // ==========================================
  describe('T002: Tab switching behavior', () => {
    it('should open dialog with "Enter URL" tab active by default', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      // Dialog should open
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      // "Enter URL" tab should be active by default
      const urlTab = within(dialog).getByRole('tab', { name: /enter url/i })
      expect(urlTab).toHaveAttribute('data-state', 'active')
    })

    it('should switch to "Upload File" tab when clicked', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const dialog = screen.getByRole('dialog')
      const uploadTab = within(dialog).getByRole('tab', { name: /upload file/i })

      await userEvent.click(uploadTab)

      // Upload tab should now be active
      expect(uploadTab).toHaveAttribute('data-state', 'active')

      // URL tab should be inactive
      const urlTab = within(dialog).getByRole('tab', { name: /enter url/i })
      expect(urlTab).toHaveAttribute('data-state', 'inactive')
    })

    it('should clear validation errors when switching tabs', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      // Try to add video without filling required fields to trigger validation error
      const addVideoButton = screen.getByRole('button', { name: /^add video$/i })
      await userEvent.click(addVideoButton)

      // Validation error should appear
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Switch to upload tab
      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Validation errors should be cleared
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('should reset upload state when switching tabs', async () => {
      // Mock a selected file
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      // Switch to upload tab
      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Switch back to URL tab
      const urlTab = screen.getByRole('tab', { name: /enter url/i })
      await userEvent.click(urlTab)

      // resetUploadState should have been called
      expect(mockResetUploadState).toHaveBeenCalled()
    })
  })

  // ==========================================
  // T003: File selection workflow
  // ==========================================
  describe('T003: File selection workflow', () => {
    it('should show "Select Video File" button in upload tab', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      // Switch to upload tab
      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // "Select Video File" button should be visible
      const selectFileButton = screen.getByRole('button', { name: /select video file/i })
      expect(selectFileButton).toBeInTheDocument()
    })

    it('should call selectFile when "Select Video File" button is clicked', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      const selectFileButton = screen.getByRole('button', { name: /select video file/i })
      await userEvent.click(selectFileButton)

      // selectFile hook function should be called
      expect(mockSelectFile).toHaveBeenCalled()
    })

    it('should display selected filename after file selection', async () => {
      // Mock a selected file
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/path/to/test-video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Filename should be displayed (without path)
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      })
    })

    it('should disable "Upload and Add" button when no file is selected', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      const uploadButton = screen.getByRole('button', { name: /upload and add/i })
      expect(uploadButton).toBeDisabled()
    })

    it('should enable "Upload and Add" button after file selection', async () => {
      // Mock a selected file
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      const uploadButton = screen.getByRole('button', { name: /upload and add/i })
      expect(uploadButton).toBeEnabled()
    })
  })

  // ==========================================
  // T004: Upload button disabled states
  // ==========================================
  describe('T004: Upload button disabled states', () => {
    it('should disable "Upload and Add" when no file selected', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      const uploadButton = screen.getByRole('button', { name: /upload and add/i })
      expect(uploadButton).toBeDisabled()
    })

    it('should disable "Upload and Add" when API key is missing', async () => {
      // Mock missing API key
      vi.mocked(useApiKeysModule.useSproutVideoApiKey).mockReturnValue({
        apiKey: null,
        isLoading: false,
        updateApiKey: vi.fn()
      })

      // Mock selected file
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      const uploadButton = screen.getByRole('button', { name: /upload and add/i })
      expect(uploadButton).toBeDisabled()

      // Should show API key warning
      expect(screen.getByText(/sprout video api key not configured/i)).toBeInTheDocument()
    })

    it('should disable "Upload and Add" during upload (uploading = true)', async () => {
      // Mock uploading state
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: true,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      const uploadButton = screen.getByRole('button', { name: /uploading/i })
      expect(uploadButton).toBeDisabled()
    })

    it('should show "Uploading... X%" during upload', async () => {
      // Mock uploading state with progress
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: true,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 45,
        message: null
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Button should show progress
      expect(screen.getByRole('button', { name: /uploading.*45%/i })).toBeInTheDocument()
    })

    it('should re-enable button after upload completes', async () => {
      // Start with uploading state
      const { rerender } = render(<VideoLinksManager projectPath={mockProjectPath} />)

      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: true,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Button should be disabled during upload
      expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled()

      // Mock upload completion
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      rerender(<VideoLinksManager projectPath={mockProjectPath} />)

      // Button should be re-enabled
      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /upload and add/i })
        expect(uploadButton).toBeEnabled()
      })
    })
  })

  // ==========================================
  // T005: Progress bar updates
  // ==========================================
  describe('T005: Progress bar updates', () => {
    it('should hide progress bar when not uploading', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Progress bar should not be visible
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    it('should show progress bar when upload starts', async () => {
      // Mock uploading state
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: true,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 25,
        message: null
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Progress bar should be visible
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })
    })

    it('should update progress bar with percentage (0-100%)', async () => {
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: true,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 67,
        message: null
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Progress percentage should be displayed
      await waitFor(() => {
        expect(screen.getByText(/uploading:.*67%/i)).toBeInTheDocument()
      })
    })

    it('should show smooth progress updates (mocked progress events)', async () => {
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: true,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      // Initial progress
      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 10,
        message: null
      })

      const { rerender } = render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      await waitFor(() => {
        expect(screen.getByText('Uploading: 10%')).toBeInTheDocument()
      })

      // Update progress to 50%
      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 50,
        message: null
      })

      rerender(<VideoLinksManager projectPath={mockProjectPath} />)

      await waitFor(() => {
        expect(screen.getByText('Uploading: 50%')).toBeInTheDocument()
      })

      // Update progress to 90%
      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 90,
        message: null
      })

      rerender(<VideoLinksManager projectPath={mockProjectPath} />)

      await waitFor(() => {
        expect(screen.getByText('Uploading: 90%')).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // T006: Successful upload auto-adds VideoLink
  // ==========================================
  describe('T006: Successful upload auto-adds VideoLink', () => {
    const mockUploadResponse = {
      id: 'abc123xyz',
      embedded_url: 'https://sproutvideo.com/videos/abc123xyz',
      title: 'Test Video Title',
      assets: {
        poster_frames: ['https://example.com/thumbnail.jpg']
      },
      created_at: '2025-01-15T10:30:00Z'
    }

    it('should call addVideoLink with correct VideoLink after successful upload', async () => {
      // Mock successful upload response
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/renders/test-video.mp4',
        uploading: false,
        response: mockUploadResponse,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Wait for upload response to trigger useEffect
      await waitFor(() => {
        expect(mockAddVideoLink).toHaveBeenCalledWith(
          expect.objectContaining({
            url: mockUploadResponse.embedded_url,
            sproutVideoId: mockUploadResponse.id,
            title: mockUploadResponse.title,
            thumbnailUrl: mockUploadResponse.assets.poster_frames[0],
            uploadDate: mockUploadResponse.created_at,
            sourceRenderFile: 'test-video.mp4'
          })
        )
      })
    })

    it('should use filename fallback when response.title is missing', async () => {
      const responseWithoutTitle = {
        ...mockUploadResponse,
        title: ''
      }

      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/renders/my-awesome-video.mp4',
        uploading: false,
        response: responseWithoutTitle,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      await waitFor(() => {
        expect(mockAddVideoLink).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'my-awesome-video', // Filename without extension
            sourceRenderFile: 'my-awesome-video.mp4'
          })
        )
      })
    })

    it('should close dialog after successful add', async () => {
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: mockUploadResponse,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Dialog should close after successful add
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should reset upload state after successful add', async () => {
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: mockUploadResponse,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      await waitFor(() => {
        expect(mockResetUploadState).toHaveBeenCalled()
      })
    })

    it('should extract only filename for sourceRenderFile (no path)', async () => {
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/deep/nested/path/to/renders/final-cut.mp4',
        uploading: false,
        response: mockUploadResponse,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      await waitFor(() => {
        expect(mockAddVideoLink).toHaveBeenCalledWith(
          expect.objectContaining({
            sourceRenderFile: 'final-cut.mp4' // Only filename, no path
          })
        )
      })
    })
  })

  // ==========================================
  // T007: Error states and retry
  // ==========================================
  describe('T007: Error states and retry', () => {
    it('should show error alert when upload fails (network error)', async () => {
      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 0,
        message: 'Upload failed: Network error'
      })

      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      await waitFor(() => {
        expect(screen.getByText(/upload failed: network error/i)).toBeInTheDocument()
      })
    })

    it('should show error alert when upload times out', async () => {
      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 0,
        message: 'Upload failed: Request timeout'
      })

      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument()
      })
    })

    it('should show error alert when API key is missing', async () => {
      vi.mocked(useApiKeysModule.useSproutVideoApiKey).mockReturnValue({
        apiKey: null,
        isLoading: false,
        updateApiKey: vi.fn()
      })

      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      expect(screen.getByText(/sprout video api key not configured/i)).toBeInTheDocument()
    })

    it('should keep file selected after error (for retry)', async () => {
      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 0,
        message: 'Upload failed: Network error'
      })

      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // File should still be selected for retry
      await waitFor(() => {
        expect(screen.getByText('video.mp4')).toBeInTheDocument()
      })
    })

    it('should re-enable "Upload and Add" button after error', async () => {
      vi.mocked(useUploadEventsModule.useUploadEvents).mockReturnValue({
        progress: 0,
        message: 'Upload failed'
      })

      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      const uploadButton = screen.getByRole('button', { name: /upload and add/i })
      expect(uploadButton).toBeEnabled()
    })
  })

  // ==========================================
  // T008: Dialog cleanup
  // ==========================================
  describe('T008: Dialog cleanup', () => {
    it('should reset upload state when closing dialog', async () => {
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await userEvent.click(cancelButton)

      await waitFor(() => {
        expect(mockResetUploadState).toHaveBeenCalled()
      })
    })

    it('should reset form data when closing dialog', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      // Fill in URL form
      const urlInput = screen.getByLabelText(/video url/i)
      await userEvent.type(urlInput, 'https://sproutvideo.com/videos/test')

      const titleInput = screen.getByLabelText(/^title/i)
      await userEvent.type(titleInput, 'Test Title')

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await userEvent.click(cancelButton)

      // Reopen dialog
      await userEvent.click(addButton)

      // Form should be reset
      const urlInputAfter = screen.getByLabelText(/video url/i)
      const titleInputAfter = screen.getByLabelText(/^title/i)

      expect(urlInputAfter).toHaveValue('')
      expect(titleInputAfter).toHaveValue('')
    })

    it('should reset validation errors when closing dialog', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      // Trigger validation error
      const addVideoButton = screen.getByRole('button', { name: /^add video$/i })
      await userEvent.click(addVideoButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await userEvent.click(cancelButton)

      // Reopen dialog
      await userEvent.click(addButton)

      // Validation errors should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should reset addMode to "url" when closing dialog', async () => {
      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      // Switch to upload tab
      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      expect(uploadTab).toHaveAttribute('data-state', 'active')

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await userEvent.click(cancelButton)

      // Reopen dialog
      await userEvent.click(addButton)

      // Should default back to URL tab
      const urlTab = screen.getByRole('tab', { name: /enter url/i })
      expect(urlTab).toHaveAttribute('data-state', 'active')
    })

    it('should show clean state when opening dialog again', async () => {
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: '/test/video.mp4',
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      render(<VideoLinksManager projectPath={mockProjectPath} />)

      const addButton = screen.getByRole('button', { name: /add video/i })
      await userEvent.click(addButton)

      // Fill form and switch tabs
      const urlInput = screen.getByLabelText(/video url/i)
      await userEvent.type(urlInput, 'https://sproutvideo.com/videos/test')

      const uploadTab = screen.getByRole('tab', { name: /upload file/i })
      await userEvent.click(uploadTab)

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await userEvent.click(cancelButton)

      // Mock reset state (no file selected)
      vi.mocked(useFileUploadModule.useFileUpload).mockReturnValue({
        selectedFile: null,
        uploading: false,
        response: null,
        selectFile: mockSelectFile,
        uploadFile: mockUploadFile,
        resetUploadState: mockResetUploadState
      })

      // Reopen dialog
      await userEvent.click(addButton)

      // Should be clean state: URL tab active, no form data, no selected file
      const urlTab = screen.getByRole('tab', { name: /enter url/i })
      expect(urlTab).toHaveAttribute('data-state', 'active')

      const urlInputAfter = screen.getByLabelText(/video url/i)
      expect(urlInputAfter).toHaveValue('')

      expect(screen.queryByText(/selected:/i)).not.toBeInTheDocument()
    })
  })
})
