/**
 * Package Manager Synchronization types
 * Support for dual Bun + npm package manager setup
 */

export interface SyncStatus {
  isSynchronized: boolean
  bunLockExists: boolean
  npmLockExists: boolean
  conflicts: string[]
  lastChecked: Date
  packageCount?: {
    bun: number
    npm: number
  }
  versionMismatches?: VersionMismatch[]
}

export interface VersionMismatch {
  packageName: string
  bunVersion: string
  npmVersion: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface SyncResult {
  synchronized: boolean
  actions: SyncAction[]
  timestamp: Date
  backupCreated?: boolean
  backupLocation?: string
}

export interface ForceSyncResult {
  success: boolean
  operations: SyncAction[]
  timestamp: Date
  backupCreated?: boolean
  backupLocation?: string
}

export interface SyncAction {
  type: 'created' | 'updated' | 'verified' | 'error'
  description: string
  timestamp?: Date
}

export interface PackageConsistencyValidation {
  isConsistent: boolean
  inconsistencies: Inconsistency[]
}

export interface Inconsistency {
  packageName: string
  issue: string
  suggestion: string
}

export interface ForceSyncOptions {
  primarySource: 'bun' | 'npm'
  backupExisting: boolean
  resolveConflicts: 'prefer-primary' | 'prefer-secondary' | 'manual'
}

export interface RollbackInfo {
  availableBackups: BackupInfo[]
  lastSyncTimestamp?: Date
}

export interface BackupInfo {
  id: string
  timestamp: Date
  files: string[]
  description: string
}

export interface MonitoringStatus {
  monitoring: boolean
  watchedFiles: string[]
  lastUpdate?: Date
}

export interface SyncReport {
  summary: {
    syncStatus: boolean
    totalPackages: number
    conflictCount: number
  }
  details: any
  recommendations: Recommendation[]
  timestamp: Date
}

export interface Recommendation {
  action: string
  priority: 'high' | 'medium' | 'low'
  description: string
}

export interface ErrorResilience {
  canHandleNetworkErrors: boolean
  hasRetryMechanism: boolean
  hasOfflineMode: boolean
  fallbackStrategies: string[]
}

export interface IntegrityCheck {
  bunLockValid: boolean
  npmLockValid: boolean
  issues: IntegrityIssue[]
}

export interface IntegrityIssue {
  file: 'bun.lock' | 'package-lock.json'
  type: 'corruption' | 'format' | 'version' | 'consistency'
  severity: 'error' | 'warning' | 'info'
  message: string
}