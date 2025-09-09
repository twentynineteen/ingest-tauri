/**
 * PackageDependency model with validation
 * Represents a third-party library dependency in the project
 */

export interface SecurityVulnerability {
  id: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  affectedVersions: string
  description: string
  source: 'npm' | 'github' | 'snyk' | 'nvd'
  publishedDate: Date
  fixAvailable: boolean
  patchedVersion?: string
}

export interface DependencyScanResult {
  totalDependencies: number
  dependencies: PackageDependency[]
  timestamp: Date
}

export interface UnusedDependencyResult {
  unusedPackages: string[]
  timestamp: Date
}

export interface UnusedAnalysis {
  packageName: string
  type: 'dependency' | 'devDependency'
  reason: string
  lastUsageCheck: Date
}

export interface SafeRemovalRecommendations {
  safeToRemove: string[]
  requiresReview: Array<{
    packageName: string
    reason: string
  }>
}

export type DependencyType = 'dependency' | 'devDependency' | 'peerDependency'
export type PackageManager = 'npm' | 'bun'
export type DependencyState = 'installed' | 'outdated' | 'vulnerable' | 'unused' | 'updating' | 'updated'

export interface PackageDependencyData {
  name: string
  currentVersion: string
  type: DependencyType
  isUsed: boolean
  packageManager: PackageManager
  latestVersion?: string
  vulnerabilities?: SecurityVulnerability[]
  breakingChanges?: string[]
}

export class PackageDependency {
  public name: string
  public currentVersion: string
  public latestVersion?: string
  public type: DependencyType
  public isUsed: boolean
  public vulnerabilities: SecurityVulnerability[]
  public breakingChanges: string[]
  public packageManager: PackageManager

  constructor(data: PackageDependencyData) {
    this.validateName(data.name)
    this.validateVersion(data.currentVersion)
    this.validateType(data.type)
    this.validatePackageManager(data.packageManager)

    this.name = data.name
    this.currentVersion = data.currentVersion
    this.type = data.type
    this.isUsed = data.isUsed
    this.packageManager = data.packageManager
    this.latestVersion = data.latestVersion
    this.vulnerabilities = data.vulnerabilities || []
    this.breakingChanges = data.breakingChanges || []

    if (data.latestVersion) {
      this.validateVersion(data.latestVersion)
    }
  }

  private validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Package name is required and must be a string')
    }

    // npm package naming convention - handle both scoped and unscoped packages
    if (name.startsWith('@')) {
      // Check for invalid scoped package formats first
      const parts = name.split('/')
      if (parts.length !== 2 || !parts[0] || !parts[1] || parts[0] === '@' || parts[1] === '') {
        throw new Error(`Invalid scoped package name: ${name}`)
      }
      
      // Scoped package validation: @scope/package-name
      const scopedPackagePattern = /^@[a-z0-9][a-z0-9_\-\.]*[a-z0-9]*\/[a-z0-9][a-z0-9_\-\.]*[a-z0-9]*$/
      if (!scopedPackagePattern.test(name)) {
        throw new Error(`Invalid scoped package name: ${name}. Must follow npm naming conventions`)
      }
    } else {
      // Check for invalid characters and patterns
      if (name.includes('/') || name.includes(' ') || name.startsWith('.') || name.endsWith('.')) {
        throw new Error(`Invalid package name: ${name}. Must follow npm naming conventions`)
      }
      
      // Regular package validation
      const regularPackagePattern = /^[a-z0-9][a-z0-9_\-\.]*[a-z0-9]*$/
      if (!regularPackagePattern.test(name)) {
        throw new Error(`Invalid package name: ${name}. Must follow npm naming conventions`)
      }
    }
  }

  private validateVersion(version: string): void {
    if (!version || typeof version !== 'string') {
      throw new Error('Version is required and must be a string')
    }

    // Basic semver pattern validation
    const semverPattern = /^\d+\.\d+\.\d+([+-].*)?$/
    if (!semverPattern.test(version)) {
      throw new Error(`Invalid version format: ${version}. Must follow semver format`)
    }
  }

  private validateType(type: DependencyType): void {
    const validTypes: DependencyType[] = ['dependency', 'devDependency', 'peerDependency']
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid dependency type: ${type}. Must be one of: ${validTypes.join(', ')}`)
    }
  }

  private validatePackageManager(manager: PackageManager): void {
    const validManagers: PackageManager[] = ['npm', 'bun']
    if (!validManagers.includes(manager)) {
      throw new Error(`Invalid package manager: ${manager}. Must be one of: ${validManagers.join(', ')}`)
    }
  }

  public getState(): DependencyState {
    if (!this.isUsed) {
      return 'unused'
    }
    
    if (this.vulnerabilities.length > 0) {
      return 'vulnerable'
    }
    
    if (this.isOutdated()) {
      return 'outdated'
    }
    
    return 'installed'
  }

  public isOutdated(): boolean {
    if (!this.latestVersion) return false
    
    const current = this.parseVersion(this.currentVersion)
    const latest = this.parseVersion(this.latestVersion)
    
    return current.major < latest.major || 
           current.minor < latest.minor || 
           current.patch < latest.patch
  }

  public isVulnerable(): boolean {
    return this.vulnerabilities.length > 0
  }

  private parseVersion(version: string): { major: number, minor: number, patch: number } {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
    if (!match) {
      throw new Error(`Cannot parse version: ${version}`)
    }
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10)
    }
  }

  public equals(other: PackageDependency): boolean {
    return this.name === other.name &&
           this.currentVersion === other.currentVersion &&
           this.type === other.type &&
           this.packageManager === other.packageManager
  }

  public toJSON(): any {
    return {
      name: this.name,
      currentVersion: this.currentVersion,
      latestVersion: this.latestVersion,
      type: this.type,
      isUsed: this.isUsed,
      packageManager: this.packageManager,
      vulnerabilities: this.vulnerabilities,
      breakingChanges: this.breakingChanges
    }
  }

  public static fromJSON(data: any): PackageDependency {
    return new PackageDependency({
      name: data.name,
      currentVersion: data.currentVersion,
      latestVersion: data.latestVersion,
      type: data.type,
      isUsed: data.isUsed,
      packageManager: data.packageManager,
      vulnerabilities: data.vulnerabilities || [],
      breakingChanges: data.breakingChanges || []
    })
  }
}