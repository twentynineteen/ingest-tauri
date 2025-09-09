/**
 * Unit test for PackageDependency model validation
 * This test MUST FAIL until the PackageDependency model is implemented
 */

import { describe, it, expect } from 'vitest'
import { PackageDependency } from '../../src/models/PackageDependency'

describe('PackageDependency Model Validation', () => {
  it('should create valid PackageDependency with required fields', () => {
    // Arrange
    const dependencyData = {
      name: 'react',
      currentVersion: '19.1.1',
      type: 'dependency' as const,
      isUsed: true,
      packageManager: 'npm' as const
    }

    // Act
    const dependency = new PackageDependency(dependencyData)

    // Assert
    expect(dependency.name).toBe('react')
    expect(dependency.currentVersion).toBe('19.1.1')
    expect(dependency.type).toBe('dependency')
    expect(dependency.isUsed).toBe(true)
    expect(dependency.packageManager).toBe('npm')
    expect(Array.isArray(dependency.vulnerabilities)).toBe(true)
    expect(Array.isArray(dependency.breakingChanges)).toBe(true)
  })

  it('should validate package name against npm naming conventions', () => {
    // Valid package names
    const validNames = [
      'react',
      '@tauri-apps/api',
      'lodash-es',
      'my.package',
      'a',
      '@scope/name-with-dashes'
    ]

    for (const name of validNames) {
      expect(() => {
        new PackageDependency({
          name,
          currentVersion: '1.0.0',
          type: 'dependency',
          isUsed: true,
          packageManager: 'npm'
        })
      }).not.toThrow()
    }

    // Invalid package names
    const invalidNames = [
      '',
      'UPPERCASE',
      'name with spaces',
      'name/with/slashes',
      '.invalid-start',
      'invalid-end.',
      '@scope/',
      '@/name'
    ]

    for (const name of invalidNames) {
      expect(() => {
        new PackageDependency({
          name,
          currentVersion: '1.0.0',
          type: 'dependency',
          isUsed: true,
          packageManager: 'npm'
        })
      }).toThrow()
    }
  })

  it('should validate version follows semver format', () => {
    // Valid versions
    const validVersions = [
      '1.0.0',
      '1.0.0-alpha.1',
      '2.1.3-beta.2',
      '0.0.1',
      '10.20.30',
      '1.0.0+build.123'
    ]

    for (const version of validVersions) {
      expect(() => {
        new PackageDependency({
          name: 'test-package',
          currentVersion: version,
          type: 'dependency',
          isUsed: true,
          packageManager: 'npm'
        })
      }).not.toThrow()
    }

    // Invalid versions
    const invalidVersions = [
      '',
      'v1.0.0',
      '1.0',
      '1',
      'latest',
      'invalid',
      '1.0.0.0'
    ]

    for (const version of invalidVersions) {
      expect(() => {
        new PackageDependency({
          name: 'test-package',
          currentVersion: version,
          type: 'dependency',
          isUsed: true,
          packageManager: 'npm'
        })
      }).toThrow()
    }
  })

  it('should validate dependency type enum', () => {
    // Valid types
    const validTypes = ['dependency', 'devDependency', 'peerDependency'] as const

    for (const type of validTypes) {
      expect(() => {
        new PackageDependency({
          name: 'test-package',
          currentVersion: '1.0.0',
          type,
          isUsed: true,
          packageManager: 'npm'
        })
      }).not.toThrow()
    }

    // Invalid type
    expect(() => {
      new PackageDependency({
        name: 'test-package',
        currentVersion: '1.0.0',
        type: 'invalidType' as any,
        isUsed: true,
        packageManager: 'npm'
      })
    }).toThrow()
  })

  it('should validate package manager enum', () => {
    // Valid package managers
    const validManagers = ['npm', 'bun'] as const

    for (const manager of validManagers) {
      expect(() => {
        new PackageDependency({
          name: 'test-package',
          currentVersion: '1.0.0',
          type: 'dependency',
          isUsed: true,
          packageManager: manager
        })
      }).not.toThrow()
    }

    // Invalid package manager
    expect(() => {
      new PackageDependency({
        name: 'test-package',
        currentVersion: '1.0.0',
        type: 'dependency',
        isUsed: true,
        packageManager: 'yarn' as any
      })
    }).toThrow()
  })

  it('should handle optional fields correctly', () => {
    // Create with minimal required fields
    const dependency = new PackageDependency({
      name: 'test-package',
      currentVersion: '1.0.0',
      type: 'dependency',
      isUsed: true,
      packageManager: 'npm'
    })

    // Optional fields should have default values
    expect(dependency.latestVersion).toBeUndefined()
    expect(dependency.vulnerabilities).toEqual([])
    expect(dependency.breakingChanges).toEqual([])

    // Should be able to set optional fields
    dependency.latestVersion = '1.0.1'
    expect(dependency.latestVersion).toBe('1.0.1')
  })

  it('should support state transitions', () => {
    // Create dependency
    const dependency = new PackageDependency({
      name: 'test-package',
      currentVersion: '1.0.0',
      type: 'dependency',
      isUsed: true,
      packageManager: 'npm'
    })

    // Test state transitions
    expect(dependency.getState()).toBe('installed')

    // Mark as outdated
    dependency.latestVersion = '1.1.0'
    expect(dependency.isOutdated()).toBe(true)
    expect(dependency.getState()).toBe('outdated')

    // Mark as vulnerable
    dependency.vulnerabilities = [{
      id: 'CVE-2023-1234',
      severity: 'high',
      affectedVersions: '1.0.0',
      description: 'Test vulnerability',
      source: 'npm',
      publishedDate: new Date(),
      fixAvailable: true
    }]
    expect(dependency.isVulnerable()).toBe(true)
    expect(dependency.getState()).toBe('vulnerable')

    // Mark as unused
    dependency.isUsed = false
    expect(dependency.getState()).toBe('unused')
  })

  it('should provide comparison methods', () => {
    const dependency1 = new PackageDependency({
      name: 'package-a',
      currentVersion: '1.0.0',
      type: 'dependency',
      isUsed: true,
      packageManager: 'npm'
    })

    const dependency2 = new PackageDependency({
      name: 'package-b',
      currentVersion: '2.0.0',
      type: 'devDependency',
      isUsed: false,
      packageManager: 'bun'
    })

    // Should be able to compare dependencies
    expect(dependency1.equals(dependency2)).toBe(false)
    expect(dependency1.equals(dependency1)).toBe(true)

    // Should be able to sort dependencies
    const dependencies = [dependency2, dependency1]
    dependencies.sort((a, b) => a.name.localeCompare(b.name))
    expect(dependencies[0].name).toBe('package-a')
    expect(dependencies[1].name).toBe('package-b')
  })

  it('should serialize to JSON correctly', () => {
    const dependency = new PackageDependency({
      name: '@tauri-apps/api',
      currentVersion: '2.8.0',
      type: 'dependency',
      isUsed: true,
      packageManager: 'bun',
      latestVersion: '2.8.1',
      breakingChanges: ['Breaking change in API']
    })

    const json = dependency.toJSON()
    
    expect(json.name).toBe('@tauri-apps/api')
    expect(json.currentVersion).toBe('2.8.0')
    expect(json.latestVersion).toBe('2.8.1')
    expect(json.type).toBe('dependency')
    expect(json.isUsed).toBe(true)
    expect(json.packageManager).toBe('bun')
    expect(json.breakingChanges).toEqual(['Breaking change in API'])
  })

  it('should create from JSON correctly', () => {
    const jsonData = {
      name: 'react',
      currentVersion: '19.1.1',
      latestVersion: '19.1.2',
      type: 'dependency',
      isUsed: true,
      packageManager: 'npm',
      vulnerabilities: [],
      breakingChanges: []
    }

    const dependency = PackageDependency.fromJSON(jsonData)
    
    expect(dependency.name).toBe('react')
    expect(dependency.currentVersion).toBe('19.1.1')
    expect(dependency.latestVersion).toBe('19.1.2')
    expect(dependency.type).toBe('dependency')
    expect(dependency.isUsed).toBe(true)
    expect(dependency.packageManager).toBe('npm')
  })
})