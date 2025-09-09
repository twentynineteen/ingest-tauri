/**
 * Breaking Change Detection and Reporting Service
 * Detects potential breaking changes when updating dependencies
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import { DependencyScanner } from './DependencyScanner'
import { PackageDependency } from '../models/PackageDependency'

const execAsync = promisify(exec)

export interface BreakingChange {
  packageName: string
  currentVersion: string
  targetVersion: string
  changeType: BreakingChangeType
  severity: 'minor' | 'major' | 'critical'
  description: string
  impact: string[]
  migrationGuide?: string
  apiChanges: ApiChange[]
}

export interface ApiChange {
  type: 'removed' | 'modified' | 'deprecated' | 'added'
  element: string
  details: string
  replacement?: string
}

export type BreakingChangeType = 
  | 'major-version-bump' 
  | 'api-removal' 
  | 'api-modification' 
  | 'dependency-change' 
  | 'runtime-requirement'
  | 'configuration-change'

export interface BreakingChangeReport {
  packageName: string
  fromVersion: string
  toVersion: string
  breakingChanges: BreakingChange[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  estimatedEffort: string
  recommendedAction: 'safe-to-update' | 'requires-testing' | 'requires-migration' | 'manual-review'
  timestamp: Date
}

export interface ChangelogEntry {
  version: string
  date?: string
  breaking: boolean
  changes: string[]
  notes?: string
}

export class BreakingChangeDetector {
  private projectRoot: string
  private dependencyScanner: DependencyScanner

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.dependencyScanner = new DependencyScanner(projectRoot)
  }

  /**
   * Detect breaking changes for a package update
   */
  public async detectBreakingChanges(
    packageName: string, 
    fromVersion: string, 
    toVersion: string
  ): Promise<BreakingChangeReport> {
    try {
      const changes: BreakingChange[] = []

      // Check for major version changes
      const versionChange = this.analyzeSemverChange(fromVersion, toVersion)
      if (versionChange.breaking) {
        changes.push(versionChange)
      }

      // Fetch and analyze changelog
      const changelogChanges = await this.analyzeChangelog(packageName, fromVersion, toVersion)
      changes.push(...changelogChanges)

      // Check npm package metadata for breaking changes
      const metadataChanges = await this.analyzePackageMetadata(packageName, fromVersion, toVersion)
      changes.push(...metadataChanges)

      // Analyze peer dependency changes
      const peerDepChanges = await this.analyzePeerDependencyChanges(packageName, fromVersion, toVersion)
      changes.push(...peerDepChanges)

      const riskLevel = this.calculateRiskLevel(changes)
      const recommendedAction = this.determineRecommendedAction(changes, riskLevel)

      return {
        packageName,
        fromVersion,
        toVersion,
        breakingChanges: changes,
        riskLevel,
        estimatedEffort: this.estimateEffort(changes),
        recommendedAction,
        timestamp: new Date()
      }
    } catch (error) {
      console.error(`Failed to detect breaking changes for ${packageName}:`, error)
      return {
        packageName,
        fromVersion,
        toVersion,
        breakingChanges: [],
        riskLevel: 'medium',
        estimatedEffort: 'Unknown - analysis failed',
        recommendedAction: 'manual-review',
        timestamp: new Date()
      }
    }
  }

  /**
   * Analyze semver version change for breaking potential
   */
  private analyzeSemverChange(fromVersion: string, toVersion: string): BreakingChange {
    const fromParts = this.parseSemver(fromVersion)
    const toParts = this.parseSemver(toVersion)

    if (toParts.major > fromParts.major) {
      return {
        packageName: '',
        currentVersion: fromVersion,
        targetVersion: toVersion,
        changeType: 'major-version-bump',
        severity: 'major',
        description: `Major version change from ${fromVersion} to ${toVersion}`,
        impact: [
          'Potential breaking API changes',
          'May require code modifications',
          'Could affect dependent packages'
        ],
        apiChanges: []
      }
    }

    return {
      packageName: '',
      currentVersion: fromVersion,
      targetVersion: toVersion,
      changeType: 'dependency-change',
      severity: 'minor',
      description: `Version update from ${fromVersion} to ${toVersion}`,
      impact: ['Minor version update - should be backward compatible'],
      apiChanges: []
    }
  }

  /**
   * Parse semver version string
   */
  private parseSemver(version: string): { major: number; minor: number; patch: number } {
    const cleanVersion = version.replace(/^[^0-9]*/, '') // Remove prefixes like ^, ~, v
    const parts = cleanVersion.split('.').map(p => parseInt(p.split(/[-+]/)[0]) || 0)
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    }
  }

  /**
   * Analyze changelog for breaking changes
   */
  private async analyzeChangelog(
    packageName: string, 
    fromVersion: string, 
    toVersion: string
  ): Promise<BreakingChange[]> {
    try {
      const changelog = await this.fetchChangelog(packageName)
      const relevantEntries = this.filterChangelogEntries(changelog, fromVersion, toVersion)
      
      const breakingChanges: BreakingChange[] = []
      
      for (const entry of relevantEntries) {
        if (entry.breaking) {
          const change: BreakingChange = {
            packageName,
            currentVersion: fromVersion,
            targetVersion: entry.version,
            changeType: 'api-modification',
            severity: 'major',
            description: `Breaking changes in ${entry.version}`,
            impact: entry.changes,
            migrationGuide: entry.notes,
            apiChanges: this.extractApiChanges(entry.changes)
          }
          breakingChanges.push(change)
        }
      }
      
      return breakingChanges
    } catch (error) {
      console.warn(`Could not analyze changelog for ${packageName}:`, error)
      return []
    }
  }

  /**
   * Fetch changelog from various sources
   */
  private async fetchChangelog(packageName: string): Promise<ChangelogEntry[]> {
    // Try to fetch from npm registry
    try {
      const { stdout } = await execAsync(`npm info ${packageName} --json`)
      const packageInfo = JSON.parse(stdout)
      
      // Try to get changelog from repository if available
      if (packageInfo.repository && packageInfo.repository.url) {
        return await this.fetchChangelogFromRepository(packageInfo.repository.url)
      }
    } catch (error) {
      // Fallback methods could be added here
    }
    
    return []
  }

  /**
   * Fetch changelog from repository
   */
  private async fetchChangelogFromRepository(repoUrl: string): Promise<ChangelogEntry[]> {
    // This would implement actual changelog fetching from GitHub/GitLab APIs
    // For now, return empty array as placeholder
    return []
  }

  /**
   * Filter changelog entries between versions
   */
  private filterChangelogEntries(
    changelog: ChangelogEntry[], 
    fromVersion: string, 
    toVersion: string
  ): ChangelogEntry[] {
    // Implementation would filter changelog entries based on version ranges
    return changelog.filter(entry => {
      const entryVersion = this.parseSemver(entry.version)
      const from = this.parseSemver(fromVersion)
      const to = this.parseSemver(toVersion)
      
      return this.isVersionInRange(entryVersion, from, to)
    })
  }

  /**
   * Check if version is in range
   */
  private isVersionInRange(
    version: { major: number; minor: number; patch: number },
    from: { major: number; minor: number; patch: number },
    to: { major: number; minor: number; patch: number }
  ): boolean {
    const versionNum = version.major * 10000 + version.minor * 100 + version.patch
    const fromNum = from.major * 10000 + from.minor * 100 + from.patch
    const toNum = to.major * 10000 + to.minor * 100 + to.patch
    
    return versionNum > fromNum && versionNum <= toNum
  }

  /**
   * Extract API changes from changelog text
   */
  private extractApiChanges(changes: string[]): ApiChange[] {
    const apiChanges: ApiChange[] = []
    
    for (const change of changes) {
      if (change.toLowerCase().includes('removed')) {
        apiChanges.push({
          type: 'removed',
          element: this.extractElementName(change),
          details: change
        })
      } else if (change.toLowerCase().includes('deprecated')) {
        apiChanges.push({
          type: 'deprecated',
          element: this.extractElementName(change),
          details: change
        })
      } else if (change.toLowerCase().includes('modified') || change.toLowerCase().includes('changed')) {
        apiChanges.push({
          type: 'modified',
          element: this.extractElementName(change),
          details: change
        })
      }
    }
    
    return apiChanges
  }

  /**
   * Extract element name from change description
   */
  private extractElementName(change: string): string {
    // Simple extraction - could be improved with better parsing
    const match = change.match(/`([^`]+)`/)
    return match ? match[1] : 'Unknown'
  }

  /**
   * Analyze package metadata for breaking changes
   */
  private async analyzePackageMetadata(
    packageName: string, 
    fromVersion: string, 
    toVersion: string
  ): Promise<BreakingChange[]> {
    try {
      const changes: BreakingChange[] = []
      
      // Get package info for both versions
      const fromInfo = await this.getPackageInfo(packageName, fromVersion)
      const toInfo = await this.getPackageInfo(packageName, toVersion)
      
      // Check for runtime requirement changes
      if (fromInfo.engines !== toInfo.engines) {
        changes.push({
          packageName,
          currentVersion: fromVersion,
          targetVersion: toVersion,
          changeType: 'runtime-requirement',
          severity: 'major',
          description: 'Runtime requirements changed',
          impact: ['May require Node.js or npm version update'],
          apiChanges: []
        })
      }
      
      return changes
    } catch (error) {
      return []
    }
  }

  /**
   * Get package info from npm registry
   */
  private async getPackageInfo(packageName: string, version?: string): Promise<any> {
    const versionSpecifier = version ? `@${version}` : ''
    const { stdout } = await execAsync(`npm info ${packageName}${versionSpecifier} --json`)
    return JSON.parse(stdout)
  }

  /**
   * Analyze peer dependency changes
   */
  private async analyzePeerDependencyChanges(
    packageName: string, 
    fromVersion: string, 
    toVersion: string
  ): Promise<BreakingChange[]> {
    try {
      const fromInfo = await this.getPackageInfo(packageName, fromVersion)
      const toInfo = await this.getPackageInfo(packageName, toVersion)
      
      const changes: BreakingChange[] = []
      
      // Compare peerDependencies
      const fromPeers = fromInfo.peerDependencies || {}
      const toPeers = toInfo.peerDependencies || {}
      
      for (const [dep, toVersion] of Object.entries(toPeers)) {
        const fromVersion = fromPeers[dep as string]
        
        if (!fromVersion) {
          // New peer dependency added
          changes.push({
            packageName,
            currentVersion: fromVersion,
            targetVersion: toVersion as string,
            changeType: 'dependency-change',
            severity: 'major',
            description: `New peer dependency: ${dep}@${toVersion}`,
            impact: [`Must install ${dep}@${toVersion} as peer dependency`],
            apiChanges: []
          })
        } else if (fromVersion !== toVersion) {
          // Peer dependency version changed
          changes.push({
            packageName,
            currentVersion: fromVersion,
            targetVersion: toVersion as string,
            changeType: 'dependency-change',
            severity: 'major',
            description: `Peer dependency ${dep} version changed from ${fromVersion} to ${toVersion}`,
            impact: [`Update ${dep} to version ${toVersion}`],
            apiChanges: []
          })
        }
      }
      
      return changes
    } catch (error) {
      return []
    }
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(changes: BreakingChange[]): 'low' | 'medium' | 'high' | 'critical' {
    if (changes.length === 0) return 'low'
    
    const hasCritical = changes.some(c => c.severity === 'critical')
    const hasMajor = changes.some(c => c.severity === 'major')
    
    if (hasCritical) return 'critical'
    if (hasMajor && changes.length > 2) return 'high'
    if (hasMajor) return 'medium'
    
    return 'low'
  }

  /**
   * Determine recommended action
   */
  private determineRecommendedAction(
    changes: BreakingChange[], 
    riskLevel: string
  ): 'safe-to-update' | 'requires-testing' | 'requires-migration' | 'manual-review' {
    if (riskLevel === 'critical') return 'manual-review'
    if (riskLevel === 'high') return 'requires-migration'
    if (riskLevel === 'medium') return 'requires-testing'
    return 'safe-to-update'
  }

  /**
   * Estimate effort required for update
   */
  private estimateEffort(changes: BreakingChange[]): string {
    if (changes.length === 0) return '< 1 hour'
    
    const majorChanges = changes.filter(c => c.severity === 'major' || c.severity === 'critical').length
    
    if (majorChanges === 0) return '1-2 hours'
    if (majorChanges <= 2) return '4-8 hours'
    if (majorChanges <= 5) return '1-2 days'
    return '1+ weeks'
  }

  /**
   * Generate breaking change report for all dependencies
   */
  public async generateFullBreakingChangeReport(): Promise<BreakingChangeReport[]> {
    const dependencies = await this.dependencyScanner.scanDependencies()
    const reports: BreakingChangeReport[] = []
    
    for (const dep of dependencies) {
      if (dep.hasUpdate && dep.latestVersion) {
        const report = await this.detectBreakingChanges(
          dep.name, 
          dep.currentVersion, 
          dep.latestVersion
        )
        reports.push(report)
      }
    }
    
    return reports
  }
}