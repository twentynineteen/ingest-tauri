/**
 * Contract test for dependency scan endpoint
 * This test MUST FAIL until the DependencyScanner service is implemented
 */

import { describe, it, expect } from 'vitest'
import { DependencyScanner } from '../../src/services/DependencyScanner'
import type { DependencyScanResult } from '../../src/models/PackageDependency'

describe('Dependency Scan Contract', () => {
  it('should scan project dependencies and return structured result', async () => {
    // Arrange
    const scanner = new DependencyScanner()

    // Act
    const result = await scanner.scanDependencies()

    // Assert - Contract validation
    expect(result).toBeDefined()
    expect(result.totalDependencies).toBeGreaterThanOrEqual(0)
    expect(result.dependencies).toBeInstanceOf(Array)
    expect(result.timestamp).toBeInstanceOf(Date)

    // Validate each dependency in the result follows the contract
    for (const dependency of result.dependencies) {
      // Allow both scoped (@scope/package) and regular (package) names
      expect(dependency.name).toMatch(/^(@[a-z0-9][a-z0-9_\-\.]*[a-z0-9]*\/[a-z0-9][a-z0-9_\-\.]*[a-z0-9]*|[a-z0-9][a-z0-9_\-\.]*[a-z0-9]*)$/)
      expect(dependency.currentVersion).toMatch(/^\d+\.\d+\.\d+.*$/)
      expect(dependency.type).toMatch(/^(dependency|devDependency|peerDependency)$/)
      expect(typeof dependency.isUsed).toBe('boolean')
      expect(dependency.packageManager).toMatch(/^(npm|bun)$/)
      expect(Array.isArray(dependency.vulnerabilities)).toBe(true)
      expect(Array.isArray(dependency.breakingChanges)).toBe(true)
    }
  })

  it('should handle projects with no dependencies gracefully', async () => {
    // Arrange
    const scanner = new DependencyScanner()

    // Act
    const result = await scanner.scanDependencies()
    
    // Assert - Should return valid structure regardless of dependency count
    expect(result.totalDependencies).toBeGreaterThanOrEqual(0)
    expect(result.dependencies).toBeInstanceOf(Array)
    expect(result.dependencies).toHaveLength(result.totalDependencies)
    expect(result.timestamp).toBeInstanceOf(Date)
  })

  it('should differentiate between dependency types', async () => {
    // Arrange
    const scanner = new DependencyScanner()

    // Act
    const result = await scanner.scanDependencies()

    // Assert - Should have different types represented
    const hasRegularDeps = result.dependencies.some(dep => dep.type === 'dependency')
    const hasDevDeps = result.dependencies.some(dep => dep.type === 'devDependency')
    
    // At least one type should be present in a real project
    expect(hasRegularDeps || hasDevDeps).toBe(true)
  })

  it('should track package manager source for each dependency', async () => {
    // Arrange
    const scanner = new DependencyScanner()

    // Act
    const result = await scanner.scanDependencies()

    // Assert - Each dependency should have a package manager source
    for (const dependency of result.dependencies) {
      expect(['npm', 'bun']).toContain(dependency.packageManager)
    }
  })

  it('should include version information for all dependencies', async () => {
    // Arrange
    const scanner = new DependencyScanner()

    // Act
    const result = await scanner.scanDependencies()

    // Assert - All dependencies should have version info
    for (const dependency of result.dependencies) {
      expect(dependency.currentVersion).toBeTruthy()
      expect(dependency.currentVersion).toMatch(/^\d+\.\d+\.\d+/)
    }
  })
})