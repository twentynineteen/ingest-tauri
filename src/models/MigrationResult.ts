/**
 * Migration Result types for Jest to Vitest migration
 */

export interface MigrationResult {
  migratedFiles: string[]
  configurationUpdated: boolean
  testsStatus: 'passing' | 'failing' | 'unknown'
  removedPackages: string[]
}

export interface ConfigurationResult {
  originalConfig: any
  vitestConfig: any
  conversionSuccess: boolean
}

export interface CompatibilityReport {
  totalTests: number
  compatibleTests: number
  incompatibleTests: IncompatibleTest[]
  warnings: string[]
}

export interface IncompatibleTest {
  file: string
  reason: string
  suggestion: string
}

export interface RollbackPlan {
  backupLocation: string
  filesToRestore: string[]
  packagesToRestore: string[]
}

export interface TypeScriptConfigUpdate {
  updated: boolean
  changes: string[]
}

export interface CoverageConfiguration {
  migrated: boolean
  provider: 'v8' | 'istanbul' | 'c8'
  thresholds: any
  reportFormats: string[]
}

export interface ValidationResult {
  jestResults: TestResults
  vitestResults: TestResults
  migrationValid: boolean
}

export interface TestResults {
  status: 'passing' | 'failing' | 'unknown'
  testCount?: number
  passCount?: number
  failCount?: number
}