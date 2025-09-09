/**
 * Unit test for UpdateReport model validation
 * This test MUST FAIL until the UpdateReport model is implemented
 */

import { describe, it, expect } from 'vitest'
import { UpdateReport, PackageChange, BreakingChange } from '../../src/models/UpdateReport'

describe('UpdateReport Model Validation', () => {
  it('should create valid UpdateReport with required fields', () => {
    // Arrange
    const reportData = {
      timestamp: new Date('2024-01-15T10:30:00Z'),
      packagesUpdated: [],
      packagesRemoved: [],
      testsStatus: 'passing' as const,
      duration: 120.5
    }

    // Act
    const report = new UpdateReport(reportData)

    // Assert
    expect(report.timestamp).toEqual(new Date('2024-01-15T10:30:00Z'))
    expect(report.packagesUpdated).toEqual([])
    expect(report.packagesRemoved).toEqual([])
    expect(report.testsStatus).toBe('passing')
    expect(report.duration).toBe(120.5)
    expect(Array.isArray(report.vulnerabilitiesFixed)).toBe(true)
    expect(Array.isArray(report.breakingChanges)).toBe(true)
  })

  it('should validate tests status enum', () => {
    // Valid test statuses
    const validStatuses = ['passing', 'failing', 'unknown'] as const

    for (const testsStatus of validStatuses) {
      expect(() => {
        new UpdateReport({
          timestamp: new Date(),
          packagesUpdated: [],
          packagesRemoved: [],
          testsStatus,
          duration: 100
        })
      }).not.toThrow()
    }

    // Invalid test status
    expect(() => {
      new UpdateReport({
        timestamp: new Date(),
        packagesUpdated: [],
        packagesRemoved: [],
        testsStatus: 'invalid' as any,
        duration: 100
      })
    }).toThrow()
  })

  it('should validate build status enum', () => {
    // Valid build statuses
    const validStatuses = ['success', 'failure', 'unknown'] as const

    for (const buildStatus of validStatuses) {
      expect(() => {
        new UpdateReport({
          timestamp: new Date(),
          packagesUpdated: [],
          packagesRemoved: [],
          testsStatus: 'passing',
          duration: 100,
          buildStatus
        })
      }).not.toThrow()
    }

    // Invalid build status
    expect(() => {
      new UpdateReport({
        timestamp: new Date(),
        packagesUpdated: [],
        packagesRemoved: [],
        testsStatus: 'passing',
        duration: 100,
        buildStatus: 'invalid' as any
      })
    }).toThrow()
  })

  it('should validate duration is non-negative', () => {
    // Valid durations
    const validDurations = [0, 1.5, 100, 3600.75]

    for (const duration of validDurations) {
      expect(() => {
        new UpdateReport({
          timestamp: new Date(),
          packagesUpdated: [],
          packagesRemoved: [],
          testsStatus: 'passing',
          duration
        })
      }).not.toThrow()
    }

    // Invalid durations
    const invalidDurations = [-1, -0.1, -100]

    for (const duration of invalidDurations) {
      expect(() => {
        new UpdateReport({
          timestamp: new Date(),
          packagesUpdated: [],
          packagesRemoved: [],
          testsStatus: 'passing',
          duration
        })
      }).toThrow()
    }
  })

  it('should validate PackageChange structure', () => {
    const validChange = new PackageChange({
      packageName: 'react',
      fromVersion: '18.2.0',
      toVersion: '19.1.1',
      changeType: 'updated',
      reason: 'Security patch and feature updates',
      hasBreakingChanges: true
    })

    const report = new UpdateReport({
      timestamp: new Date(),
      packagesUpdated: [validChange],
      packagesRemoved: [],
      testsStatus: 'passing',
      duration: 100
    })

    expect(report.packagesUpdated[0]).toEqual(validChange)
    expect(report.packagesUpdated[0].packageName).toBe('react')
    expect(report.packagesUpdated[0].changeType).toBe('updated')
  })

  it('should validate BreakingChange structure', () => {
    const breakingChange = new BreakingChange({
      packageName: '@tauri-apps/api',
      fromVersion: '2.7.0',
      toVersion: '2.8.0',
      changeDescription: 'Dialog API method signatures changed',
      affectedFiles: ['src/components/FileDialog.tsx', 'src/hooks/useDialog.ts'],
      migrationSteps: [
        'Update dialog.open() calls to use new options format',
        'Replace dialog.save() with dialog.saveFile()'
      ],
      resolutionStatus: 'pending'
    })

    const report = new UpdateReport({
      timestamp: new Date(),
      packagesUpdated: [],
      packagesRemoved: [],
      testsStatus: 'failing',
      duration: 200,
      breakingChanges: [breakingChange]
    })

    expect(report.breakingChanges[0]).toEqual(breakingChange)
    expect(report.breakingChanges[0].resolutionStatus).toBe('pending')
  })

  it('should provide summary statistics', () => {
    const changes = [
      new PackageChange({
        packageName: 'react',
        changeType: 'updated',
        fromVersion: '18.0.0',
        toVersion: '18.1.0',
        reason: 'Minor update',
        hasBreakingChanges: false
      }),
      new PackageChange({
        packageName: 'typescript',
        changeType: 'updated',
        fromVersion: '5.0.0',
        toVersion: '6.0.0',
        reason: 'Major update',
        hasBreakingChanges: true
      }),
      new PackageChange({
        packageName: 'unused-package',
        changeType: 'removed',
        reason: 'Unused dependency',
        hasBreakingChanges: false
      })
    ]

    const report = new UpdateReport({
      timestamp: new Date(),
      packagesUpdated: changes,
      packagesRemoved: ['old-package'],
      testsStatus: 'passing',
      duration: 300
    })

    const summary = report.getSummary()
    
    expect(summary.totalPackagesUpdated).toBe(3)
    expect(summary.totalPackagesRemoved).toBe(1)
    expect(summary.packagesWithBreakingChanges).toBe(1)
    expect(summary.securityUpdatesCount).toBe(0)
    expect(summary.updateDurationMinutes).toBeCloseTo(5, 1) // 300 seconds = 5 minutes
  })

  it('should categorize updates by type', () => {
    const changes = [
      new PackageChange({
        packageName: 'vulnerable-package',
        changeType: 'patched',
        reason: 'Security vulnerability fix',
        hasBreakingChanges: false
      }),
      new PackageChange({
        packageName: 'feature-package',
        changeType: 'updated',
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        reason: 'New features and improvements',
        hasBreakingChanges: true
      }),
      new PackageChange({
        packageName: 'dependency-package',
        changeType: 'added',
        reason: 'New dependency required',
        hasBreakingChanges: false
      })
    ]

    const report = new UpdateReport({
      timestamp: new Date(),
      packagesUpdated: changes,
      packagesRemoved: [],
      testsStatus: 'passing',
      duration: 150
    })

    const categorized = report.categorizeUpdates()
    
    expect(categorized.security).toHaveLength(1)
    expect(categorized.feature).toHaveLength(1)
    expect(categorized.dependency).toHaveLength(1)
    expect(categorized.security[0].packageName).toBe('vulnerable-package')
  })

  it('should identify successful vs failed update', () => {
    // Successful update
    const successfulReport = new UpdateReport({
      timestamp: new Date(),
      packagesUpdated: [
        new PackageChange({
          packageName: 'react',
          changeType: 'updated',
          fromVersion: '18.0.0',
          toVersion: '18.1.0',
          reason: 'Minor update',
          hasBreakingChanges: false
        })
      ],
      packagesRemoved: [],
      testsStatus: 'passing',
      buildStatus: 'success',
      duration: 100
    })

    expect(successfulReport.isSuccessful()).toBe(true)
    expect(successfulReport.hasIssues()).toBe(false)

    // Failed update
    const failedReport = new UpdateReport({
      timestamp: new Date(),
      packagesUpdated: [],
      packagesRemoved: [],
      testsStatus: 'failing',
      buildStatus: 'failure',
      duration: 50
    })

    expect(failedReport.isSuccessful()).toBe(false)
    expect(failedReport.hasIssues()).toBe(true)
  })

  it('should serialize to JSON correctly', () => {
    const change = new PackageChange({
      packageName: 'test-package',
      fromVersion: '1.0.0',
      toVersion: '1.1.0',
      changeType: 'updated',
      reason: 'Bug fixes',
      hasBreakingChanges: false
    })

    const report = new UpdateReport({
      timestamp: new Date('2024-01-15T10:30:00Z'),
      packagesUpdated: [change],
      packagesRemoved: ['old-package'],
      testsStatus: 'passing',
      buildStatus: 'success',
      duration: 250.5
    })

    const json = report.toJSON()
    
    expect(json.timestamp).toBe('2024-01-15T10:30:00.000Z')
    expect(json.packagesUpdated).toHaveLength(1)
    expect(json.packagesRemoved).toEqual(['old-package'])
    expect(json.testsStatus).toBe('passing')
    expect(json.buildStatus).toBe('success')
    expect(json.duration).toBe(250.5)
  })

  it('should create from JSON correctly', () => {
    const jsonData = {
      timestamp: '2024-01-15T10:30:00Z',
      packagesUpdated: [
        {
          packageName: 'react',
          fromVersion: '18.0.0',
          toVersion: '19.0.0',
          changeType: 'updated',
          reason: 'Major version update',
          hasBreakingChanges: true
        }
      ],
      packagesRemoved: [],
      vulnerabilitiesFixed: [],
      breakingChanges: [],
      testsStatus: 'failing',
      buildStatus: 'failure',
      duration: 180
    }

    const report = UpdateReport.fromJSON(jsonData)
    
    expect(report.timestamp).toEqual(new Date('2024-01-15T10:30:00Z'))
    expect(report.packagesUpdated).toHaveLength(1)
    expect(report.packagesUpdated[0].packageName).toBe('react')
    expect(report.testsStatus).toBe('failing')
    expect(report.buildStatus).toBe('failure')
    expect(report.duration).toBe(180)
  })

  it('should support adding changes after creation', () => {
    const report = new UpdateReport({
      timestamp: new Date(),
      packagesUpdated: [],
      packagesRemoved: [],
      testsStatus: 'unknown',
      duration: 0
    })

    const change = new PackageChange({
      packageName: 'new-package',
      changeType: 'added',
      reason: 'Added during update process',
      hasBreakingChanges: false
    })

    report.addPackageChange(change)
    report.addRemovedPackage('removed-package')
    report.updateTestsStatus('passing')
    report.updateDuration(150)

    expect(report.packagesUpdated).toHaveLength(1)
    expect(report.packagesRemoved).toContain('removed-package')
    expect(report.testsStatus).toBe('passing')
    expect(report.duration).toBe(150)
  })
})