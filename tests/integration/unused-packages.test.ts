/**
 * Contract test for unused package detection
 * This test MUST FAIL until the UnusedPackageDetector service is implemented
 */

import { describe, it, expect } from 'vitest'
import { UnusedPackageDetector } from '../../src/services/UnusedPackageDetector'
import type { UnusedDependencyResult } from '../../src/models/PackageDependency'

describe('Unused Package Detection Contract', () => {
  it('should detect unused dependencies and return structured result', async () => {
    // Arrange
    const detector = new UnusedPackageDetector()

    // Act
    const result = await detector.detectUnusedDependencies()

    // Assert - Contract validation
    expect(result).toBeDefined()
    expect(result.unusedPackages).toBeInstanceOf(Array)
    expect(result.timestamp).toBeInstanceOf(Date)

    // All unused packages should be valid package names
    for (const packageName of result.unusedPackages) {
      expect(typeof packageName).toBe('string')
      expect(packageName.length).toBeGreaterThan(0)
      // Should follow npm package naming conventions (supports scoped packages)
      expect(packageName).toMatch(/^(@[a-z0-9][a-z0-9_\-\.]*[a-z0-9]*\/[a-z0-9][a-z0-9_\-\.]*[a-z0-9]*|[a-z0-9][a-z0-9_\-\.]*[a-z0-9]*)$/)
    }
  })

  it('should handle projects with no unused dependencies', async () => {
    // Arrange
    const detector = new UnusedPackageDetector()

    // Act
    const result = await detector.detectUnusedDependencies()

    // Assert - Should return valid structure even with no unused packages
    expect(result.unusedPackages).toEqual([])
    expect(result.timestamp).toBeInstanceOf(Date)
  })

  it('should differentiate between dependency types when detecting unused packages', async () => {
    // Arrange
    const detector = new UnusedPackageDetector()

    // Act
    const result = await detector.getUnusedByType()

    // Assert - Should categorize unused packages by type
    expect(result).toHaveProperty('dependencies')
    expect(result).toHaveProperty('devDependencies')
    expect(Array.isArray(result.dependencies)).toBe(true)
    expect(Array.isArray(result.devDependencies)).toBe(true)
  })

  it('should exclude Tauri-specific packages from unused detection', async () => {
    // Arrange
    const detector = new UnusedPackageDetector()

    // Act
    const result = await detector.detectUnusedDependencies()

    // Assert - Tauri packages should not be marked as unused even if not directly imported
    const tauriPackages = [
      '@tauri-apps/api',
      '@tauri-apps/cli',
      '@tauri-apps/plugin-fs',
      '@tauri-apps/plugin-dialog',
      '@tauri-apps/plugin-shell'
    ]

    for (const tauriPackage of tauriPackages) {
      expect(result.unusedPackages).not.toContain(tauriPackage)
    }
  })

  it('should provide detailed analysis for each unused package', async () => {
    // Arrange
    const detector = new UnusedPackageDetector()

    // Act
    const detailedResult = await detector.getDetailedUnusedAnalysis()

    // Assert - Should provide context for why packages are marked as unused
    expect(detailedResult).toBeInstanceOf(Array)

    for (const analysis of detailedResult) {
      expect(analysis).toHaveProperty('packageName')
      expect(analysis).toHaveProperty('type')
      expect(analysis).toHaveProperty('reason')
      expect(analysis).toHaveProperty('lastUsageCheck')
      
      expect(typeof analysis.packageName).toBe('string')
      expect(['dependency', 'devDependency']).toContain(analysis.type)
      expect(typeof analysis.reason).toBe('string')
      expect(analysis.lastUsageCheck).toBeInstanceOf(Date)
    }
  })

  it('should handle TypeScript path aliases correctly', async () => {
    // Arrange
    const detector = new UnusedPackageDetector()

    // Act
    const result = await detector.detectUnusedDependencies()

    // Assert - Packages used via TypeScript path aliases should not be marked as unused
    // This is important for packages imported via @components/*, @utils/*, etc.
    const hasPathAliasSupport = await detector.supportsPathAliases()
    expect(hasPathAliasSupport).toBe(true)
  })

  it('should exclude build-time dependencies from unused detection', async () => {
    // Arrange
    const detector = new UnusedPackageDetector()

    // Act
    const result = await detector.detectUnusedDependencies()

    // Assert - Build tools should not be marked as unused
    const buildTools = [
      'vite',
      'typescript',
      'eslint',
      'prettier',
      '@vitejs/plugin-react'
    ]

    for (const buildTool of buildTools) {
      expect(result.unusedPackages).not.toContain(buildTool)
    }
  })

  it('should provide safe removal recommendations', async () => {
    // Arrange
    const detector = new UnusedPackageDetector()

    // Act
    const recommendations = await detector.getSafeRemovalRecommendations()

    // Assert - Should provide actionable removal guidance
    expect(recommendations).toHaveProperty('safeToRemove')
    expect(recommendations).toHaveProperty('requiresReview')
    expect(Array.isArray(recommendations.safeToRemove)).toBe(true)
    expect(Array.isArray(recommendations.requiresReview)).toBe(true)

    // Packages requiring review should have explanations
    for (const reviewItem of recommendations.requiresReview) {
      expect(reviewItem).toHaveProperty('packageName')
      expect(reviewItem).toHaveProperty('reason')
      expect(typeof reviewItem.reason).toBe('string')
      expect(reviewItem.reason.length).toBeGreaterThan(0)
    }
  })
})