/**
 * Package Update Workflow Service
 * Orchestrates the complete package update process integrating all services
 */

import { DependencyScanner } from './DependencyScanner'
import { SecurityAuditor } from './SecurityAuditor'
import { UnusedPackageDetector } from './UnusedPackageDetector'
import { PackageUpdater } from './PackageUpdater'
import { BreakingChangeDetector } from './BreakingChangeDetector'
import { UpdateRollbackService } from './UpdateRollbackService'
import { LockFileSynchronizer } from './LockFileSynchronizer'
import { TauriCompatibilityValidator } from './TauriCompatibilityValidator'

export interface WorkflowOptions {
  skipSecurityAudit?: boolean
  skipBreakingChangeDetection?: boolean
  skipUnusedPackageDetection?: boolean
  autoResolveVulnerabilities?: boolean
  createRollbackPoint?: boolean
  validateCompatibility?: boolean
  updateStrategy?: 'conservative' | 'moderate' | 'aggressive'
  progressCallback?: (step: WorkflowStep) => void
  errorCallback?: (error: WorkflowError) => void
}

export interface WorkflowStep {
  phase: WorkflowPhase
  step: string
  progress: number
  totalSteps: number
  message: string
  timestamp: Date
  data?: any
}

export interface WorkflowError {
  phase: WorkflowPhase
  step: string
  error: Error
  severity: 'warning' | 'error' | 'critical'
  recoverable: boolean
  timestamp: Date
}

export type WorkflowPhase = 
  | 'initialization'
  | 'dependency-scanning'
  | 'security-audit'
  | 'unused-detection'
  | 'breaking-change-analysis'
  | 'compatibility-validation'
  | 'update-execution'
  | 'verification'
  | 'cleanup'

export interface WorkflowResult {
  success: boolean
  phase: WorkflowPhase
  steps: WorkflowStep[]
  errors: WorkflowError[]
  rollbackId?: string
  summary: WorkflowSummary
  timestamp: Date
  duration: number
}

export interface WorkflowSummary {
  dependenciesScanned: number
  vulnerabilitiesFound: number
  vulnerabilitiesResolved: number
  packagesUpdated: number
  unusedPackagesRemoved: number
  breakingChangesDetected: number
  compatibilityIssues: number
  rollbackAvailable: boolean
}

export class PackageUpdateWorkflow {
  private projectRoot: string
  private dependencyScanner: DependencyScanner
  private securityAuditor: SecurityAuditor
  private unusedPackageDetector: UnusedPackageDetector
  private packageUpdater: PackageUpdater
  private breakingChangeDetector: BreakingChangeDetector
  private rollbackService: UpdateRollbackService
  private lockFileSynchronizer: LockFileSynchronizer
  private tauriValidator: TauriCompatibilityValidator

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.dependencyScanner = new DependencyScanner(projectRoot)
    this.securityAuditor = new SecurityAuditor(projectRoot)
    this.unusedPackageDetector = new UnusedPackageDetector(projectRoot)
    this.packageUpdater = new PackageUpdater(projectRoot)
    this.breakingChangeDetector = new BreakingChangeDetector(projectRoot)
    this.rollbackService = new UpdateRollbackService(projectRoot)
    this.lockFileSynchronizer = new LockFileSynchronizer(projectRoot)
    this.tauriValidator = new TauriCompatibilityValidator(projectRoot)
  }

  /**
   * Execute the complete package update workflow
   */
  public async executeWorkflow(options: WorkflowOptions = {}): Promise<WorkflowResult> {
    const startTime = Date.now()
    const steps: WorkflowStep[] = []
    const errors: WorkflowError[] = []
    let rollbackId: string | undefined
    let currentPhase: WorkflowPhase = 'initialization'

    const addStep = (step: string, progress: number, totalSteps: number, message: string, data?: any) => {
      const workflowStep: WorkflowStep = {
        phase: currentPhase,
        step,
        progress,
        totalSteps,
        message,
        timestamp: new Date(),
        data
      }
      steps.push(workflowStep)
      options.progressCallback?.(workflowStep)
    }

    const addError = (step: string, error: Error, severity: WorkflowError['severity'], recoverable: boolean) => {
      const workflowError: WorkflowError = {
        phase: currentPhase,
        step,
        error,
        severity,
        recoverable,
        timestamp: new Date()
      }
      errors.push(workflowError)
      options.errorCallback?.(workflowError)
    }

    try {
      // Phase 1: Initialization
      currentPhase = 'initialization'
      addStep('initialize', 1, 20, 'Initializing workflow services')
      
      // Create rollback point if requested
      if (options.createRollbackPoint !== false) {
        addStep('create-rollback', 2, 20, 'Creating rollback point')
        try {
          rollbackId = await this.rollbackService.createRollbackPoint(
            'Pre-update rollback point',
            [] // Will be populated during updates
          )
        } catch (error) {
          addError('create-rollback', error as Error, 'warning', true)
        }
      }

      // Phase 2: Dependency Scanning
      currentPhase = 'dependency-scanning'
      addStep('scan-dependencies', 3, 20, 'Scanning project dependencies')
      
      const dependencies = await this.dependencyScanner.scanDependencies()
      addStep('scan-complete', 4, 20, `Found ${dependencies.length} dependencies`, { dependencies })

      // Phase 3: Security Audit
      let vulnerabilities: any[] = []
      if (!options.skipSecurityAudit) {
        currentPhase = 'security-audit'
        addStep('security-audit', 5, 20, 'Performing security audit')
        
        const auditResult = await this.securityAuditor.auditDependencies()
        vulnerabilities = auditResult.vulnerabilities
        addStep('security-complete', 6, 20, `Found ${vulnerabilities.length} vulnerabilities`, { auditResult })

        // Auto-resolve vulnerabilities if requested
        if (options.autoResolveVulnerabilities && vulnerabilities.length > 0) {
          addStep('resolve-vulnerabilities', 7, 20, 'Resolving security vulnerabilities')
          try {
            const resolutionResult = await this.securityAuditor.resolveVulnerabilities(vulnerabilities)
            addStep('vulnerabilities-resolved', 8, 20, `Resolved ${resolutionResult.resolvedCount} vulnerabilities`, { resolutionResult })
          } catch (error) {
            addError('resolve-vulnerabilities', error as Error, 'error', true)
          }
        }
      }

      // Phase 4: Unused Package Detection
      let unusedPackages: any[] = []
      if (!options.skipUnusedPackageDetection) {
        currentPhase = 'unused-detection'
        addStep('detect-unused', 9, 20, 'Detecting unused packages')
        
        const unusedResult = await this.unusedPackageDetector.detectUnusedDependencies()
        unusedPackages = unusedResult.unusedDependencies
        addStep('unused-complete', 10, 20, `Found ${unusedPackages.length} unused packages`, { unusedResult })
      }

      // Phase 5: Breaking Change Analysis
      let breakingChanges: any[] = []
      if (!options.skipBreakingChangeDetection) {
        currentPhase = 'breaking-change-analysis'
        addStep('analyze-breaking-changes', 11, 20, 'Analyzing potential breaking changes')
        
        const breakingChangeReports = await this.breakingChangeDetector.generateFullBreakingChangeReport()
        breakingChanges = breakingChangeReports.flatMap(report => report.breakingChanges)
        addStep('breaking-analysis-complete', 12, 20, `Detected ${breakingChanges.length} potential breaking changes`, { breakingChangeReports })
      }

      // Phase 6: Compatibility Validation
      let compatibilityIssues = 0
      if (options.validateCompatibility !== false) {
        currentPhase = 'compatibility-validation'
        addStep('validate-compatibility', 13, 20, 'Validating Tauri compatibility')
        
        const compatibilityResult = await this.tauriValidator.validateCompatibility()
        compatibilityIssues = compatibilityResult.issues.filter(i => i.severity === 'error').length
        addStep('compatibility-complete', 14, 20, `Found ${compatibilityIssues} compatibility issues`, { compatibilityResult })
      }

      // Phase 7: Update Execution
      let updatedPackages = 0
      currentPhase = 'update-execution'
      addStep('execute-updates', 15, 20, 'Executing package updates')
      
      const updateStrategy = options.updateStrategy || 'moderate'
      const updateReport = await this.packageUpdater.updateDependencies({
        includeDevDependencies: true,
        strategy: updateStrategy,
        skipPeerDependencies: false
      })
      updatedPackages = updateReport.successfulUpdates.length
      addStep('updates-complete', 16, 20, `Updated ${updatedPackages} packages`, { updateReport })

      // Phase 8: Lock File Synchronization
      addStep('sync-lockfiles', 17, 20, 'Synchronizing lock files')
      try {
        const syncResult = await this.lockFileSynchronizer.synchronizeLockFiles()
        addStep('sync-complete', 18, 20, 'Lock files synchronized', { syncResult })
      } catch (error) {
        addError('sync-lockfiles', error as Error, 'warning', true)
      }

      // Phase 9: Verification
      currentPhase = 'verification'
      addStep('verify-installation', 19, 20, 'Verifying installation integrity')
      
      const verificationResult = await this.verifyInstallation()
      addStep('verification-complete', 20, 20, 'Installation verified', { verificationResult })

      const summary: WorkflowSummary = {
        dependenciesScanned: dependencies.length,
        vulnerabilitiesFound: vulnerabilities.length,
        vulnerabilitiesResolved: 0, // Would be calculated from resolution results
        packagesUpdated: updatedPackages,
        unusedPackagesRemoved: 0, // Would be calculated if removal was implemented
        breakingChangesDetected: breakingChanges.length,
        compatibilityIssues,
        rollbackAvailable: rollbackId !== undefined
      }

      return {
        success: errors.filter(e => e.severity === 'critical' || e.severity === 'error').length === 0,
        phase: 'cleanup',
        steps,
        errors,
        rollbackId,
        summary,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }

    } catch (error) {
      addError('workflow', error as Error, 'critical', false)
      
      return {
        success: false,
        phase: currentPhase,
        steps,
        errors,
        rollbackId,
        summary: {
          dependenciesScanned: 0,
          vulnerabilitiesFound: 0,
          vulnerabilitiesResolved: 0,
          packagesUpdated: 0,
          unusedPackagesRemoved: 0,
          breakingChangesDetected: 0,
          compatibilityIssues: 0,
          rollbackAvailable: rollbackId !== undefined
        },
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Verify installation integrity after updates
   */
  private async verifyInstallation(): Promise<any> {
    try {
      // Basic verification - could be expanded
      const dependencies = await this.dependencyScanner.scanDependencies()
      const auditResult = await this.securityAuditor.auditDependencies()
      
      return {
        dependenciesInstalled: dependencies.length,
        vulnerabilitiesRemaining: auditResult.vulnerabilities.length,
        timestamp: new Date()
      }
    } catch (error) {
      throw new Error(`Installation verification failed: ${error}`)
    }
  }

  /**
   * Execute rollback if workflow fails
   */
  public async executeRollback(rollbackId: string): Promise<boolean> {
    try {
      const rollbackResult = await this.rollbackService.rollback(rollbackId)
      return rollbackResult.success
    } catch (error) {
      console.error('Rollback failed:', error)
      return false
    }
  }

  /**
   * Get workflow status for a running workflow
   */
  public async getWorkflowStatus(): Promise<any> {
    // This would track running workflow status
    // For now, return basic project status
    const dependencies = await this.dependencyScanner.scanDependencies()
    const auditResult = await this.securityAuditor.auditDependencies()
    
    return {
      dependencies: dependencies.length,
      vulnerabilities: auditResult.vulnerabilities.length,
      lastUpdate: new Date()
    }
  }

  /**
   * Clean up workflow resources
   */
  public async cleanup(): Promise<void> {
    try {
      // Clean up old rollback points (keep last 5)
      await this.rollbackService.cleanupOldRollbackPoints(7)
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }
}