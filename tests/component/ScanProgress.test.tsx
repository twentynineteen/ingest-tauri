/**
 * Component Test: ScanProgress
 * 
 * This test verifies the ScanProgress component behavior.
 * It MUST FAIL initially until the component implementation is complete.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import ScanProgress from '../../src/components/baker/ScanProgress'
import type { ScanResult } from '../../src/types/baker'

describe('ScanProgress Component', () => {
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

  test('should show idle state when not scanning', () => {
    render(<ScanProgress scanResult={null} isScanning={false} />)
    
    expect(screen.getByText(/ready to scan/i)).toBeInTheDocument()
  })

  test('should show progress bar when scanning', () => {
    render(<ScanProgress scanResult={mockScanResult} isScanning={true} />)
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText(/scanning/i)).toBeInTheDocument()
  })

  test('should display scan statistics', () => {
    render(<ScanProgress scanResult={mockScanResult} isScanning={false} />)
    
    expect(screen.getByText('100')).toBeInTheDocument() // totalFolders
    expect(screen.getByText('5')).toBeInTheDocument() // validProjects
  })
})