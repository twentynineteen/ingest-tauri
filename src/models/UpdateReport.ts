/**
 * UpdateReport model with change tracking
 * Represents the summary of changes made during update process
 */

import { SecurityVulnerability } from './SecurityVulnerability'

export type ChangeType = 'added' | 'updated' | 'removed' | 'patched'
export type TestStatus = 'passing' | 'failing' | 'unknown'
export type BuildStatus = 'success' | 'failure' | 'unknown'
export type ResolutionStatus = 'pending' | 'in_progress' | 'resolved'

export interface PackageChangeData {
  packageName: string
  fromVersion?: string | null
  toVersion?: string | null
  changeType: ChangeType
  reason: string
  hasBreakingChanges?: boolean
}

export interface BreakingChangeData {
  packageName: string
  fromVersion: string
  toVersion: string
  changeDescription: string
  affectedFiles?: string[]
  migrationSteps?: string[]
  resolutionStatus?: ResolutionStatus
}

export interface UpdateReportData {
  timestamp: Date
  packagesUpdated: PackageChange[]
  packagesRemoved: string[]
  testsStatus: TestStatus
  duration: number
  vulnerabilitiesFixed?: SecurityVulnerability[]
  breakingChanges?: BreakingChange[]
  buildStatus?: BuildStatus
}

export interface UpdateRequest {
  packagesToUpdate?: string[]
  updateType?: 'security' | 'minor' | 'major' | 'all'
  allowBreakingChanges?: boolean
}

export class PackageChange {
  public packageName: string
  public fromVersion: string | null
  public toVersion: string | null
  public changeType: ChangeType
  public reason: string
  public hasBreakingChanges: boolean

  constructor(data: PackageChangeData) {
    this.validatePackageName(data.packageName)
    this.validateChangeType(data.changeType)
    this.validateReason(data.reason)

    this.packageName = data.packageName
    this.fromVersion = data.fromVersion || null
    this.toVersion = data.toVersion || null
    this.changeType = data.changeType
    this.reason = data.reason
    this.hasBreakingChanges = data.hasBreakingChanges || false

    this.validateVersions()
  }

  private validatePackageName(name: string): void {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Package name is required and must be a non-empty string')
    }
  }

  private validateChangeType(type: ChangeType): void {
    const validTypes: ChangeType[] = ['added', 'updated', 'removed', 'patched']
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid change type: ${type}. Must be one of: ${validTypes.join(', ')}`)
    }
  }

  private validateReason(reason: string): void {
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new Error('Reason is required and must be a non-empty string')
    }
  }

  private validateVersions(): void {
    // Validate version logic based on change type
    if (this.changeType === 'added' && this.fromVersion !== null) {
      throw new Error('Added packages should not have a fromVersion')
    }
    
    if (this.changeType === 'removed' && this.toVersion !== null) {
      throw new Error('Removed packages should not have a toVersion')
    }
    
    if (this.changeType === 'updated' && (!this.fromVersion || !this.toVersion)) {
      throw new Error('Updated packages must have both fromVersion and toVersion')
    }
  }
}

export class BreakingChange {
  public packageName: string
  public fromVersion: string
  public toVersion: string
  public changeDescription: string
  public affectedFiles: string[]
  public migrationSteps: string[]
  public resolutionStatus: ResolutionStatus

  constructor(data: BreakingChangeData) {
    this.validateRequiredFields(data)
    this.validateResolutionStatus(data.resolutionStatus)

    this.packageName = data.packageName
    this.fromVersion = data.fromVersion
    this.toVersion = data.toVersion
    this.changeDescription = data.changeDescription
    this.affectedFiles = data.affectedFiles || []
    this.migrationSteps = data.migrationSteps || []
    this.resolutionStatus = data.resolutionStatus || 'pending'
  }

  private validateRequiredFields(data: BreakingChangeData): void {
    const required = ['packageName', 'fromVersion', 'toVersion', 'changeDescription']
    for (const field of required) {
      const value = (data as any)[field]
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${field} is required and must be a non-empty string`)
      }
    }
  }

  private validateResolutionStatus(status?: ResolutionStatus): void {
    if (status) {
      const validStatuses: ResolutionStatus[] = ['pending', 'in_progress', 'resolved']
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid resolution status: ${status}. Must be one of: ${validStatuses.join(', ')}`)
      }
    }
  }
}

export class UpdateReport {
  public timestamp: Date
  public packagesUpdated: PackageChange[]
  public packagesRemoved: string[]
  public vulnerabilitiesFixed: SecurityVulnerability[]
  public breakingChanges: BreakingChange[]
  public testsStatus: TestStatus
  public buildStatus: BuildStatus
  public duration: number

  constructor(data: UpdateReportData) {
    this.validateTimestamp(data.timestamp)
    this.validateTestsStatus(data.testsStatus)
    this.validateDuration(data.duration)
    this.validateBuildStatus(data.buildStatus)

    this.timestamp = data.timestamp
    this.packagesUpdated = data.packagesUpdated
    this.packagesRemoved = data.packagesRemoved
    this.testsStatus = data.testsStatus
    this.duration = data.duration
    this.vulnerabilitiesFixed = data.vulnerabilitiesFixed || []
    this.breakingChanges = data.breakingChanges || []
    this.buildStatus = data.buildStatus || 'unknown'
  }

  private validateTimestamp(timestamp: Date): void {
    if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      throw new Error('Timestamp must be a valid Date object')
    }
  }

  private validateTestsStatus(status: TestStatus): void {
    const validStatuses: TestStatus[] = ['passing', 'failing', 'unknown']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid tests status: ${status}. Must be one of: ${validStatuses.join(', ')}`)
    }
  }

  private validateBuildStatus(status?: BuildStatus): void {
    if (status) {
      const validStatuses: BuildStatus[] = ['success', 'failure', 'unknown']
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid build status: ${status}. Must be one of: ${validStatuses.join(', ')}`)
      }
    }
  }

  private validateDuration(duration: number): void {
    if (typeof duration !== 'number' || duration < 0) {
      throw new Error('Duration must be a non-negative number')
    }
  }

  public getSummary() {
    const packagesWithBreakingChanges = this.packagesUpdated.filter(
      pkg => pkg.hasBreakingChanges
    ).length

    const securityUpdatesCount = this.packagesUpdated.filter(
      pkg => pkg.reason.toLowerCase().includes('security') ||
             pkg.reason.toLowerCase().includes('vulnerability') ||
             pkg.changeType === 'patched'
    ).length

    return {
      totalPackagesUpdated: this.packagesUpdated.length,
      totalPackagesRemoved: this.packagesRemoved.length,
      packagesWithBreakingChanges,
      securityUpdatesCount,
      updateDurationMinutes: this.duration / 60
    }
  }

  public categorizeUpdates() {
    const security: PackageChange[] = []
    const feature: PackageChange[] = []
    const dependency: PackageChange[] = []

    for (const change of this.packagesUpdated) {
      const reason = change.reason.toLowerCase()
      if (reason.includes('security') || reason.includes('vulnerability') || change.changeType === 'patched') {
        security.push(change)
      } else if (reason.includes('feature') || reason.includes('improvement')) {
        feature.push(change)
      } else {
        dependency.push(change)
      }
    }

    return { security, feature, dependency }
  }

  public isSuccessful(): boolean {
    return this.testsStatus === 'passing' && 
           (this.buildStatus === 'success' || this.buildStatus === 'unknown')
  }

  public hasIssues(): boolean {
    return this.testsStatus === 'failing' || 
           this.buildStatus === 'failure' || 
           this.breakingChanges.length > 0
  }

  public addPackageChange(change: PackageChange): void {
    this.packagesUpdated.push(change)
  }

  public addRemovedPackage(packageName: string): void {
    this.packagesRemoved.push(packageName)
  }

  public updateTestsStatus(status: TestStatus): void {
    this.validateTestsStatus(status)
    this.testsStatus = status
  }

  public updateDuration(duration: number): void {
    this.validateDuration(duration)
    this.duration = duration
  }

  public toJSON(): any {
    return {
      timestamp: this.timestamp.toISOString(),
      packagesUpdated: this.packagesUpdated.map(pkg => ({
        packageName: pkg.packageName,
        fromVersion: pkg.fromVersion,
        toVersion: pkg.toVersion,
        changeType: pkg.changeType,
        reason: pkg.reason,
        hasBreakingChanges: pkg.hasBreakingChanges
      })),
      packagesRemoved: this.packagesRemoved,
      vulnerabilitiesFixed: this.vulnerabilitiesFixed.map(vuln => vuln.toJSON()),
      breakingChanges: this.breakingChanges,
      testsStatus: this.testsStatus,
      buildStatus: this.buildStatus,
      duration: this.duration
    }
  }

  public static fromJSON(data: any): UpdateReport {
    return new UpdateReport({
      timestamp: new Date(data.timestamp),
      packagesUpdated: data.packagesUpdated.map((pkg: any) => new PackageChange(pkg)),
      packagesRemoved: data.packagesRemoved,
      vulnerabilitiesFixed: data.vulnerabilitiesFixed?.map((vuln: any) => 
        SecurityVulnerability.fromJSON(vuln)) || [],
      breakingChanges: data.breakingChanges?.map((bc: any) => new BreakingChange(bc)) || [],
      testsStatus: data.testsStatus,
      buildStatus: data.buildStatus,
      duration: data.duration
    })
  }
}