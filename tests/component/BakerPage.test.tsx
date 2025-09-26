/**
 * Component Test: BakerPage
 * 
 * This test verifies the BakerPage component behavior and integration.
 * It MUST FAIL initially until the component implementation is complete.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import BakerPage from '../../src/pages/Baker/Baker'
import type { ScanResult, ProjectFolder } from '../../src/types/baker'

// Mock the custom hooks
vi.mock('../../src/hooks/useBakerScan', () => ({
  useBakerScan: () => ({
    scanResult: null,
    isScanning: false,
    error: null,
    startScan: vi.fn(),
    cancelScan: vi.fn(),
    clearResults: vi.fn()
  })
}))

vi.mock('../../src/hooks/useBreadcrumbsManager', () => ({
  useBreadcrumbsManager: () => ({
    updateBreadcrumbs: vi.fn(),
    isUpdating: false,
    lastUpdateResult: null,
    error: null
  })
}))

vi.mock('../../src/hooks/useBakerPreferences', () => ({
  useBakerPreferences: () => ({
    preferences: {
      autoUpdate: false,
      createMissing: true,
      backupOriginals: true,
      maxDepth: 10,
      includeHidden: false,
      confirmBulkOperations: true
    },
    updatePreferences: vi.fn(),
    resetToDefaults: vi.fn()
  })
}))

// Mock the breadcrumb hook
vi.mock('hooks/useBreadcrumb', () => ({
  useBreadcrumb: vi.fn()
}))

// Mock child components
vi.mock('../../src/components/baker/ScanProgress', () => ({
  default: ({ isScanning }: { isScanning: boolean }) => (
    <div data-testid="scan-progress">
      {isScanning ? 'Scanning...' : 'Idle'}
    </div>
  )
}))

vi.mock('../../src/components/baker/ProjectResults', () => ({
  default: ({ projects, onSelectionChange }: any) => (
    <div data-testid="project-results">
      Projects: {projects.length}
      <button onClick={() => onSelectionChange(['project1'])}>
        Select Project
      </button>
    </div>
  )
}))

vi.mock('../../src/components/baker/BatchActions', () => ({
  default: ({ selectedProjects, onApplyChanges }: any) => (
    <div data-testid="batch-actions">
      Selected: {selectedProjects.length}
      <button onClick={onApplyChanges}>Apply Changes</button>
    </div>
  )
}))

// Mock existing FolderSelector component
vi.mock('./FolderSelector', () => ({
  default: ({ selectedFolder, onSelect }: any) => (
    <div data-testid="folder-selector">
      <input 
        value={selectedFolder}
        onChange={(e) => onSelect(e.target.value)}
        placeholder="Select folder"
      />
    </div>
  )
}))

describe('BakerPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render page title and main elements', () => {
    render(<BakerPage />)

    expect(screen.getByText('Baker')).toBeInTheDocument()
    expect(screen.getByTestId('folder-selector')).toBeInTheDocument()
    expect(screen.getByTestId('scan-progress')).toBeInTheDocument()
    expect(screen.getByTestId('project-results')).toBeInTheDocument()
    expect(screen.getByTestId('batch-actions')).toBeInTheDocument()
  })

  test('should set breadcrumbs correctly', () => {
    const { useBreadcrumb } = require('hooks/useBreadcrumb')
    
    render(<BakerPage />)

    expect(useBreadcrumb).toHaveBeenCalledWith([
      { label: 'Ingest footage', href: '/ingest/build' },
      { label: 'Baker' }
    ])
  })

  test('should handle folder selection', () => {
    render(<BakerPage />)
    
    const folderInput = screen.getByPlaceholderText('Select folder')
    fireEvent.change(folderInput, { target: { value: '/test/folder' } })

    expect(folderInput.value).toBe('/test/folder')
  })

  test('should start scan when scan button is clicked', async () => {
    const mockStartScan = vi.fn()
    
    vi.doMock('../../src/hooks/useBakerScan', () => ({
      useBakerScan: () => ({
        scanResult: null,
        isScanning: false,
        error: null,
        startScan: mockStartScan,
        cancelScan: vi.fn(),
        clearResults: vi.fn()
      })
    }))

    render(<BakerPage />)
    
    // Set folder first
    const folderInput = screen.getByPlaceholderText('Select folder')
    fireEvent.change(folderInput, { target: { value: '/test/folder' } })

    // Find and click scan button
    const scanButton = screen.getByRole('button', { name: /start scan/i })
    fireEvent.click(scanButton)

    await waitFor(() => {
      expect(mockStartScan).toHaveBeenCalledWith('/test/folder', expect.any(Object))
    })
  })

  test('should disable scan button when scanning is in progress', () => {
    vi.doMock('../../src/hooks/useBakerScan', () => ({
      useBakerScan: () => ({
        scanResult: null,
        isScanning: true,
        error: null,
        startScan: vi.fn(),
        cancelScan: vi.fn(),
        clearResults: vi.fn()
      })
    }))

    render(<BakerPage />)
    
    const scanButton = screen.getByRole('button', { name: /start scan/i })
    expect(scanButton).toBeDisabled()
  })

  test('should show error message when scan fails', () => {
    vi.doMock('../../src/hooks/useBakerScan', () => ({
      useBakerScan: () => ({
        scanResult: null,
        isScanning: false,
        error: 'Scan failed: permission denied',
        startScan: vi.fn(),
        cancelScan: vi.fn(),
        clearResults: vi.fn()
      })
    }))

    render(<BakerPage />)
    
    expect(screen.getByText(/scan failed: permission denied/i)).toBeInTheDocument()
  })

  test('should display scan results when available', () => {
    const mockScanResult: ScanResult = {
      startTime: '2025-01-01T00:00:00Z',
      endTime: '2025-01-01T00:05:00Z',
      rootPath: '/test/folder',
      totalFolders: 100,
      validProjects: 5,
      updatedBreadcrumbs: 3,
      createdBreadcrumbs: 2,
      errors: [],
      projects: []
    }

    vi.doMock('../../src/hooks/useBakerScan', () => ({
      useBakerScan: () => ({
        scanResult: mockScanResult,
        isScanning: false,
        error: null,
        startScan: vi.fn(),
        cancelScan: vi.fn(),
        clearResults: vi.fn()
      })
    }))

    render(<BakerPage />)
    
    // Should show scan statistics
    expect(screen.getByText(/100.*folders/i)).toBeInTheDocument()
    expect(screen.getByText(/5.*projects/i)).toBeInTheDocument()
  })

  test('should handle project selection', () => {
    render(<BakerPage />)
    
    const selectButton = screen.getByText('Select Project')
    fireEvent.click(selectButton)

    // Should update selected projects state
    expect(screen.getByText('Selected: 1')).toBeInTheDocument()
  })

  test('should handle batch operations', async () => {
    const mockUpdateBreadcrumbs = vi.fn()
    
    vi.doMock('../../src/hooks/useBreadcrumbsManager', () => ({
      useBreadcrumbsManager: () => ({
        updateBreadcrumbs: mockUpdateBreadcrumbs,
        isUpdating: false,
        lastUpdateResult: null,
        error: null
      })
    }))

    render(<BakerPage />)
    
    // Select a project first
    const selectButton = screen.getByText('Select Project')
    fireEvent.click(selectButton)

    // Apply changes
    const applyButton = screen.getByText('Apply Changes')
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(mockUpdateBreadcrumbs).toHaveBeenCalledWith(
        ['project1'],
        expect.objectContaining({
          createMissing: true,
          backupOriginals: true
        })
      )
    })
  })

  test('should show preferences dialog when settings button is clicked', () => {
    render(<BakerPage />)
    
    const settingsButton = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(settingsButton)

    expect(screen.getByText(/preferences/i)).toBeInTheDocument()
  })

  test('should handle cancel scan operation', () => {
    const mockCancelScan = vi.fn()
    
    vi.doMock('../../src/hooks/useBakerScan', () => ({
      useBakerScan: () => ({
        scanResult: null,
        isScanning: true,
        error: null,
        startScan: vi.fn(),
        cancelScan: mockCancelScan,
        clearResults: vi.fn()
      })
    }))

    render(<BakerPage />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockCancelScan).toHaveBeenCalled()
  })

  test('should validate folder path before starting scan', () => {
    const mockStartScan = vi.fn()
    
    vi.doMock('../../src/hooks/useBakerScan', () => ({
      useBakerScan: () => ({
        scanResult: null,
        isScanning: false,
        error: null,
        startScan: mockStartScan,
        cancelScan: vi.fn(),
        clearResults: vi.fn()
      })
    }))

    render(<BakerPage />)
    
    // Try to scan without selecting folder
    const scanButton = screen.getByRole('button', { name: /start scan/i })
    fireEvent.click(scanButton)

    // Should show validation error, not call startScan
    expect(mockStartScan).not.toHaveBeenCalled()
    expect(screen.getByText(/select.*folder/i)).toBeInTheDocument()
  })
})