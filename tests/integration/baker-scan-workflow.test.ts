/**
 * Integration Test: Baker Scan Workflow
 * 
 * This test verifies the complete scan workflow from start to finish.
 * It MUST FAIL initially until the full implementation is complete.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { ScanResult, ScanProgressEvent, ScanCompleteEvent } from '../../src/types/baker'
import { resolve } from 'path'

describe('Baker Scan Workflow Integration', () => {
  const testDataPath = resolve(__dirname, '../fixtures/baker-test-data')
  let eventUnlisteners: Array<() => void> = []

  beforeAll(() => {
    // Setup test environment - in real test would ensure Tauri app is running
  })

  afterAll(() => {
    // Cleanup event listeners
    eventUnlisteners.forEach(unlisten => unlisten())
  })

  test('should complete full scan workflow successfully', async () => {
    // Start scan
    const scanId = await invoke('baker_start_scan', {
      rootPath: testDataPath,
      options: {
        maxDepth: 5,
        includeHidden: false,
        createMissing: true,
        backupOriginals: true
      }
    })

    expect(scanId).toBeDefined()
    expect(typeof scanId).toBe('string')

    // Listen for progress events
    const progressEvents: ScanProgressEvent[] = []
    const progressUnlisten = await listen('baker_scan_progress', (event) => {
      progressEvents.push(event.payload as ScanProgressEvent)
    })
    eventUnlisteners.push(progressUnlisten)

    // Listen for completion
    let scanComplete = false
    let finalResult: ScanResult | null = null
    const completeUnlisten = await listen('baker_scan_complete', (event) => {
      scanComplete = true
      finalResult = (event.payload as ScanCompleteEvent).result
    })
    eventUnlisteners.push(completeUnlisten)

    // Wait for scan to complete
    let attempts = 0
    while (!scanComplete && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    expect(scanComplete).toBe(true)
    expect(finalResult).not.toBeNull()
    expect(finalResult!.validProjects).toBeGreaterThan(0)
    expect(progressEvents.length).toBeGreaterThan(0)

    // Verify final status
    const finalStatus = await invoke('baker_get_scan_status', { scanId })
    expect(finalStatus.endTime).toBeDefined()
    expect(finalStatus.projects.length).toBeGreaterThan(0)
  }, 10000) // 10 second timeout

  test('should handle scan cancellation correctly', async () => {
    const scanId = await invoke('baker_start_scan', {
      rootPath: '/large/directory/path',
      options: {
        maxDepth: 20,
        includeHidden: true,
        createMissing: false,
        backupOriginals: false
      }
    })

    // Cancel immediately
    await invoke('baker_cancel_scan', { scanId })

    const status = await invoke('baker_get_scan_status', { scanId })
    expect(status.endTime).toBeDefined()
  })

  test('should discover all test projects correctly', async () => {
    const scanId = await invoke('baker_start_scan', {
      rootPath: testDataPath,
      options: {
        maxDepth: 3,
        includeHidden: false,
        createMissing: false,
        backupOriginals: false
      }
    })

    // Wait for completion
    let result: ScanResult
    do {
      await new Promise(resolve => setTimeout(resolve, 100))
      result = await invoke('baker_get_scan_status', { scanId })
    } while (!result.endTime)

    // Should find TestProject1 and TestProject2, but not InvalidFolder
    expect(result.validProjects).toBe(2)
    
    const project1 = result.projects.find(p => p.name === 'TestProject1')
    const project2 = result.projects.find(p => p.name === 'TestProject2')
    
    expect(project1).toBeDefined()
    expect(project1!.isValid).toBe(true)
    expect(project1!.hasBreadcrumbs).toBe(true)
    expect(project1!.cameraCount).toBe(1)

    expect(project2).toBeDefined()
    expect(project2!.isValid).toBe(true)
    expect(project2!.hasBreadcrumbs).toBe(false)
    expect(project2!.cameraCount).toBe(2)
  })
})