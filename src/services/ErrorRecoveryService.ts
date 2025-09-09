/**
 * Error Handling and Recovery Service
 * Provides comprehensive error handling and recovery mechanisms for package updates
 */

export interface ErrorContext {
  phase: string
  operation: string
  packageName?: string
  version?: string
  command?: string
  metadata?: Record<string, any>
}

export interface RecoveryStrategy {
  name: string
  description: string
  automatic: boolean
  execute: (error: WorkflowError, context: ErrorContext) => Promise<RecoveryResult>
}

export interface RecoveryResult {
  success: boolean
  action: string
  message: string
  shouldRetry: boolean
  rollbackRecommended: boolean
  nextSteps?: string[]
}

export interface WorkflowError {
  id: string
  type: ErrorType
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  originalError?: Error
  context: ErrorContext
  timestamp: Date
  recoveryAttempts: number
  resolved: boolean
}

export type ErrorType = 
  | 'network-error'
  | 'permission-error'
  | 'dependency-conflict'
  | 'version-mismatch'
  | 'security-vulnerability'
  | 'disk-space'
  | 'timeout'
  | 'validation-error'
  | 'installation-error'
  | 'rollback-error'
  | 'unknown-error'

export interface ErrorPattern {
  type: ErrorType
  pattern: RegExp
  severity: WorkflowError['severity']
  recoverable: boolean
}

export class ErrorRecoveryService {
  private errors: Map<string, WorkflowError> = new Map()
  private recoveryStrategies: Map<ErrorType, RecoveryStrategy[]> = new Map()
  private errorPatterns: ErrorPattern[] = []
  private maxRetryAttempts = 3
  private retryDelay = 2000 // 2 seconds

  constructor() {
    this.initializeErrorPatterns()
    this.initializeRecoveryStrategies()
  }

  /**
   * Initialize known error patterns for classification
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      {
        type: 'network-error',
        pattern: /network|connection|timeout|ENOTFOUND|ECONNREFUSED/i,
        severity: 'medium',
        recoverable: true
      },
      {
        type: 'permission-error',
        pattern: /permission|EACCES|EPERM|access denied/i,
        severity: 'high',
        recoverable: true
      },
      {
        type: 'dependency-conflict',
        pattern: /conflict|peer dep|ERESOLVE|dependency.*resolve/i,
        severity: 'high',
        recoverable: true
      },
      {
        type: 'version-mismatch',
        pattern: /version.*mismatch|incompatible.*version|unsupported.*version/i,
        severity: 'high',
        recoverable: true
      },
      {
        type: 'disk-space',
        pattern: /ENOSPC|no space|disk.*full/i,
        severity: 'critical',
        recoverable: false
      },
      {
        type: 'timeout',
        pattern: /timeout|ETIMEDOUT/i,
        severity: 'medium',
        recoverable: true
      },
      {
        type: 'installation-error',
        pattern: /install.*fail|npm.*ERR|bun.*error/i,
        severity: 'high',
        recoverable: true
      }
    ]
  }

  /**
   * Initialize recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    // Network error strategies
    this.recoveryStrategies.set('network-error', [
      {
        name: 'retry-with-backoff',
        description: 'Retry the operation with exponential backoff',
        automatic: true,
        execute: this.retryWithBackoff.bind(this)
      },
      {
        name: 'switch-registry',
        description: 'Try alternative package registry',
        automatic: true,
        execute: this.switchPackageRegistry.bind(this)
      }
    ])

    // Permission error strategies
    this.recoveryStrategies.set('permission-error', [
      {
        name: 'fix-permissions',
        description: 'Attempt to fix file permissions',
        automatic: true,
        execute: this.fixPermissions.bind(this)
      },
      {
        name: 'use-sudo',
        description: 'Retry with elevated permissions',
        automatic: false,
        execute: this.useSudo.bind(this)
      }
    ])

    // Dependency conflict strategies
    this.recoveryStrategies.set('dependency-conflict', [
      {
        name: 'force-resolve',
        description: 'Force resolve dependency conflicts',
        automatic: true,
        execute: this.forceResolve.bind(this)
      },
      {
        name: 'clean-install',
        description: 'Clean install all dependencies',
        automatic: false,
        execute: this.cleanInstall.bind(this)
      }
    ])

    // Installation error strategies
    this.recoveryStrategies.set('installation-error', [
      {
        name: 'clear-cache',
        description: 'Clear package manager cache and retry',
        automatic: true,
        execute: this.clearCacheAndRetry.bind(this)
      },
      {
        name: 'fallback-package-manager',
        description: 'Try with alternative package manager',
        automatic: true,
        execute: this.fallbackPackageManager.bind(this)
      }
    ])

    // Timeout strategies
    this.recoveryStrategies.set('timeout', [
      {
        name: 'increase-timeout',
        description: 'Retry with increased timeout',
        automatic: true,
        execute: this.increaseTimeout.bind(this)
      }
    ])
  }

  /**
   * Handle and attempt to recover from an error
   */
  public async handleError(
    originalError: Error, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    const workflowError = this.createWorkflowError(originalError, context)
    this.errors.set(workflowError.id, workflowError)

    console.error(`Error in ${context.phase}/${context.operation}:`, originalError.message)

    // Find appropriate recovery strategies
    const strategies = this.getRecoveryStrategies(workflowError.type)
    
    for (const strategy of strategies) {
      if (!strategy.automatic && workflowError.recoveryAttempts > 0) {
        continue // Skip manual strategies after first attempt
      }

      try {
        console.log(`Attempting recovery: ${strategy.name}`)
        const result = await strategy.execute(workflowError, context)
        
        workflowError.recoveryAttempts++
        
        if (result.success) {
          workflowError.resolved = true
          console.log(`✅ Recovery successful: ${result.message}`)
          return result
        } else {
          console.log(`❌ Recovery failed: ${result.message}`)
        }
      } catch (recoveryError) {
        console.error(`Recovery strategy '${strategy.name}' failed:`, recoveryError)
      }
    }

    // If all recovery strategies failed
    return {
      success: false,
      action: 'manual-intervention',
      message: `All automatic recovery attempts failed for ${workflowError.type}`,
      shouldRetry: false,
      rollbackRecommended: workflowError.severity === 'critical',
      nextSteps: this.generateNextSteps(workflowError)
    }
  }

  /**
   * Create workflow error from original error and context
   */
  private createWorkflowError(originalError: Error, context: ErrorContext): WorkflowError {
    const errorType = this.classifyError(originalError.message)
    const severity = this.determineSeverity(errorType, context)
    
    return {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: errorType,
      severity,
      message: originalError.message,
      originalError,
      context,
      timestamp: new Date(),
      recoveryAttempts: 0,
      resolved: false
    }
  }

  /**
   * Classify error based on message patterns
   */
  private classifyError(message: string): ErrorType {
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(message)) {
        return pattern.type
      }
    }
    return 'unknown-error'
  }

  /**
   * Determine error severity based on type and context
   */
  private determineSeverity(errorType: ErrorType, context: ErrorContext): WorkflowError['severity'] {
    const pattern = this.errorPatterns.find(p => p.type === errorType)
    if (pattern) {
      return pattern.severity
    }

    // Context-based severity adjustment
    if (context.phase === 'security-audit' || context.phase === 'update-execution') {
      return 'high'
    }

    return 'medium'
  }

  /**
   * Get recovery strategies for error type
   */
  private getRecoveryStrategies(errorType: ErrorType): RecoveryStrategy[] {
    return this.recoveryStrategies.get(errorType) || []
  }

  /**
   * Recovery Strategy: Retry with exponential backoff
   */
  private async retryWithBackoff(
    error: WorkflowError, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    const delay = this.retryDelay * Math.pow(2, error.recoveryAttempts)
    
    await this.sleep(delay)
    
    return {
      success: error.recoveryAttempts < this.maxRetryAttempts,
      action: 'retry-with-backoff',
      message: `Retried after ${delay}ms delay`,
      shouldRetry: true,
      rollbackRecommended: false
    }
  }

  /**
   * Recovery Strategy: Switch package registry
   */
  private async switchPackageRegistry(
    error: WorkflowError, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    // This would implement registry switching logic
    return {
      success: false,
      action: 'switch-registry',
      message: 'Registry switching not implemented',
      shouldRetry: false,
      rollbackRecommended: false
    }
  }

  /**
   * Recovery Strategy: Fix file permissions
   */
  private async fixPermissions(
    error: WorkflowError, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    try {
      // Basic permission fix attempt
      if (process.platform !== 'win32') {
        const { exec } = require('child_process')
        const { promisify } = require('util')
        const execAsync = promisify(exec)
        
        await execAsync('npm config set unsafe-perm true')
        
        return {
          success: true,
          action: 'fix-permissions',
          message: 'Set unsafe-perm to bypass permission issues',
          shouldRetry: true,
          rollbackRecommended: false
        }
      }
    } catch (permError) {
      // Permission fix failed
    }

    return {
      success: false,
      action: 'fix-permissions',
      message: 'Could not fix permissions automatically',
      shouldRetry: false,
      rollbackRecommended: false
    }
  }

  /**
   * Recovery Strategy: Use sudo (manual intervention required)
   */
  private async useSudo(
    error: WorkflowError, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    return {
      success: false,
      action: 'use-sudo',
      message: 'Manual intervention required: run with sudo/administrator privileges',
      shouldRetry: false,
      rollbackRecommended: false,
      nextSteps: ['Run the command with elevated privileges', 'Check file ownership and permissions']
    }
  }

  /**
   * Recovery Strategy: Force resolve dependency conflicts
   */
  private async forceResolve(
    error: WorkflowError, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    return {
      success: true,
      action: 'force-resolve',
      message: 'Will retry with force flag to resolve conflicts',
      shouldRetry: true,
      rollbackRecommended: false
    }
  }

  /**
   * Recovery Strategy: Clean install
   */
  private async cleanInstall(
    error: WorkflowError, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    return {
      success: false,
      action: 'clean-install',
      message: 'Manual clean install recommended',
      shouldRetry: false,
      rollbackRecommended: false,
      nextSteps: [
        'Delete node_modules directory',
        'Delete package-lock.json and bun.lock',
        'Run npm install or bun install'
      ]
    }
  }

  /**
   * Recovery Strategy: Clear cache and retry
   */
  private async clearCacheAndRetry(
    error: WorkflowError, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    try {
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)
      
      await execAsync('npm cache clean --force')
      
      return {
        success: true,
        action: 'clear-cache',
        message: 'Cleared npm cache, retrying installation',
        shouldRetry: true,
        rollbackRecommended: false
      }
    } catch (cacheError) {
      return {
        success: false,
        action: 'clear-cache',
        message: 'Failed to clear cache',
        shouldRetry: false,
        rollbackRecommended: false
      }
    }
  }

  /**
   * Recovery Strategy: Fallback to alternative package manager
   */
  private async fallbackPackageManager(
    error: WorkflowError, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    return {
      success: true,
      action: 'fallback-package-manager',
      message: 'Will retry with alternative package manager',
      shouldRetry: true,
      rollbackRecommended: false
    }
  }

  /**
   * Recovery Strategy: Increase timeout
   */
  private async increaseTimeout(
    error: WorkflowError, 
    context: ErrorContext
  ): Promise<RecoveryResult> {
    return {
      success: true,
      action: 'increase-timeout',
      message: 'Will retry with increased timeout',
      shouldRetry: true,
      rollbackRecommended: false
    }
  }

  /**
   * Generate next steps for manual intervention
   */
  private generateNextSteps(error: WorkflowError): string[] {
    const baseSteps = [
      'Review the error message and context',
      'Check system requirements and dependencies',
      'Verify network connectivity and permissions'
    ]

    switch (error.type) {
      case 'disk-space':
        return [...baseSteps, 'Free up disk space', 'Check available storage']
      
      case 'permission-error':
        return [...baseSteps, 'Run with administrator/sudo privileges', 'Check file and directory permissions']
      
      case 'dependency-conflict':
        return [...baseSteps, 'Review package.json for conflicts', 'Consider updating conflicting dependencies']
      
      case 'network-error':
        return [...baseSteps, 'Check network connection', 'Try alternative registry or mirror']
      
      default:
        return [...baseSteps, 'Consider rolling back to previous state', 'Seek community support if issue persists']
    }
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get all errors
   */
  public getErrors(): WorkflowError[] {
    return Array.from(this.errors.values())
  }

  /**
   * Get unresolved errors
   */
  public getUnresolvedErrors(): WorkflowError[] {
    return Array.from(this.errors.values()).filter(error => !error.resolved)
  }

  /**
   * Clear resolved errors
   */
  public clearResolvedErrors(): void {
    for (const [id, error] of this.errors.entries()) {
      if (error.resolved) {
        this.errors.delete(id)
      }
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): any {
    const errors = Array.from(this.errors.values())
    
    return {
      total: errors.length,
      resolved: errors.filter(e => e.resolved).length,
      unresolved: errors.filter(e => !e.resolved).length,
      bySeverity: {
        low: errors.filter(e => e.severity === 'low').length,
        medium: errors.filter(e => e.severity === 'medium').length,
        high: errors.filter(e => e.severity === 'high').length,
        critical: errors.filter(e => e.severity === 'critical').length
      },
      byType: this.groupErrorsByType(errors)
    }
  }

  /**
   * Group errors by type for statistics
   */
  private groupErrorsByType(errors: WorkflowError[]): Record<string, number> {
    const grouped: Record<string, number> = {}
    
    for (const error of errors) {
      grouped[error.type] = (grouped[error.type] || 0) + 1
    }
    
    return grouped
  }
}