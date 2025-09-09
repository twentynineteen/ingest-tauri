/**
 * User Feedback Service
 * Provides interactive user feedback and notifications during updates
 */

import { ProgressTracker, ProgressUpdate } from './ProgressTracker'

export interface FeedbackOptions {
  enableConsoleOutput?: boolean
  enableNotifications?: boolean
  verboseMode?: boolean
  quietMode?: boolean
  logFile?: string
}

export interface UserPrompt {
  id: string
  message: string
  type: 'confirmation' | 'choice' | 'input' | 'warning'
  choices?: string[]
  defaultValue?: string
  timeout?: number
}

export interface NotificationConfig {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
}

export class UserFeedbackService {
  private progressTracker: ProgressTracker
  private options: FeedbackOptions
  private logEntries: string[] = []

  constructor(progressTracker: ProgressTracker, options: FeedbackOptions = {}) {
    this.progressTracker = progressTracker
    this.options = {
      enableConsoleOutput: true,
      enableNotifications: false,
      verboseMode: false,
      quietMode: false,
      ...options
    }

    this.setupProgressTracking()
  }

  /**
   * Setup progress tracking subscription
   */
  private setupProgressTracking(): void {
    this.progressTracker.subscribe((update: ProgressUpdate) => {
      this.handleProgressUpdate(update)
    })
  }

  /**
   * Handle progress updates and provide appropriate feedback
   */
  private handleProgressUpdate(update: ProgressUpdate): void {
    const logMessage = `[${update.timestamp.toISOString()}] ${update.phase}: ${update.message}`
    this.logEntries.push(logMessage)

    if (this.options.quietMode) {
      return
    }

    if (this.options.enableConsoleOutput) {
      if (this.options.verboseMode) {
        console.log(this.progressTracker.formatProgressForConsole(update))
        if (update.details) {
          console.log(`  Details: ${update.details}`)
        }
      } else {
        // Only show major progress updates in non-verbose mode
        if (this.isMajorUpdate(update)) {
          console.log(this.progressTracker.formatProgressForConsole(update))
        }
      }
    }

    // Handle notifications for important updates
    if (this.options.enableNotifications && this.shouldNotify(update)) {
      this.showNotification({
        title: `Package Update - ${update.phase}`,
        message: update.message,
        type: this.getNotificationType(update)
      })
    }
  }

  /**
   * Check if this is a major update worth showing in non-verbose mode
   */
  private isMajorUpdate(update: ProgressUpdate): boolean {
    const majorSteps = [
      'initialize',
      'scan-dependencies',
      'security-audit',
      'execute-updates',
      'verification-complete'
    ]
    
    return majorSteps.includes(update.step) || 
           update.message.toLowerCase().includes('complete') ||
           update.message.toLowerCase().includes('error') ||
           update.message.toLowerCase().includes('failed')
  }

  /**
   * Determine if we should send a notification for this update
   */
  private shouldNotify(update: ProgressUpdate): boolean {
    return update.step.includes('complete') ||
           update.message.toLowerCase().includes('error') ||
           update.message.toLowerCase().includes('failed') ||
           update.phase === 'cleanup'
  }

  /**
   * Get notification type based on update content
   */
  private getNotificationType(update: ProgressUpdate): NotificationConfig['type'] {
    if (update.message.toLowerCase().includes('error') || 
        update.message.toLowerCase().includes('failed')) {
      return 'error'
    }
    
    if (update.message.toLowerCase().includes('warning')) {
      return 'warning'
    }
    
    if (update.message.toLowerCase().includes('complete')) {
      return 'success'
    }
    
    return 'info'
  }

  /**
   * Show notification to user
   */
  private showNotification(config: NotificationConfig): void {
    // In a real implementation, this would integrate with system notifications
    // For now, we'll just log it
    const icon = this.getNotificationIcon(config.type)
    console.log(`${icon} ${config.title}: ${config.message}`)
  }

  /**
   * Get notification icon based on type
   */
  private getNotificationIcon(type: NotificationConfig['type']): string {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': default: return 'ℹ️'
    }
  }

  /**
   * Prompt user for input with timeout
   */
  public async promptUser(prompt: UserPrompt): Promise<string | null> {
    return new Promise((resolve) => {
      const timeoutMs = prompt.timeout || 30000 // 30 second default timeout
      
      console.log(`\n${prompt.message}`)
      
      if (prompt.type === 'choice' && prompt.choices) {
        prompt.choices.forEach((choice, index) => {
          console.log(`  ${index + 1}. ${choice}`)
        })
      }
      
      if (prompt.defaultValue) {
        console.log(`(Default: ${prompt.defaultValue})`)
      }
      
      // Set timeout
      const timeout = setTimeout(() => {
        console.log(`\nTimeout reached. Using default value: ${prompt.defaultValue || 'none'}`)
        resolve(prompt.defaultValue || null)
      }, timeoutMs)

      // In a real implementation, this would capture actual user input
      // For now, we'll use the default value
      clearTimeout(timeout)
      resolve(prompt.defaultValue || null)
    })
  }

  /**
   * Show confirmation dialog
   */
  public async confirmAction(
    message: string, 
    defaultYes: boolean = false,
    timeout: number = 30000
  ): Promise<boolean> {
    const prompt: UserPrompt = {
      id: `confirm-${Date.now()}`,
      message: `${message} (y/n)`,
      type: 'confirmation',
      defaultValue: defaultYes ? 'y' : 'n',
      timeout
    }
    
    const response = await this.promptUser(prompt)
    return response?.toLowerCase().startsWith('y') ?? defaultYes
  }

  /**
   * Show progress summary
   */
  public showProgressSummary(): void {
    const summary = this.progressTracker.getProgressSummary()
    
    console.log('\n' + '='.repeat(50))
    console.log('PACKAGE UPDATE PROGRESS SUMMARY')
    console.log('='.repeat(50))
    console.log(`Phase: ${summary.currentPhase}/${summary.totalPhases}`)
    console.log(`Overall Progress: ${summary.overallProgress.toFixed(1)}%`)
    console.log(`Current: ${summary.currentMessage}`)
    console.log(`Time Elapsed: ${this.formatDuration(summary.timeElapsed)}`)
    
    if (summary.estimatedTimeRemaining) {
      console.log(`Time Remaining: ${this.formatDuration(summary.estimatedTimeRemaining)}`)
    }
    
    if (summary.errors > 0) {
      console.log(`❌ Errors: ${summary.errors}`)
    }
    
    if (summary.warnings > 0) {
      console.log(`⚠️ Warnings: ${summary.warnings}`)
    }
    
    console.log('='.repeat(50) + '\n')
  }

  /**
   * Format duration for display
   */
  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Export logs for debugging
   */
  public exportLogs(): string[] {
    return [...this.logEntries]
  }

  /**
   * Clear logs
   */
  public clearLogs(): void {
    this.logEntries = []
  }

  /**
   * Show workflow completion summary
   */
  public showCompletionSummary(workflowResult: any): void {
    console.log('\n' + '='.repeat(60))
    console.log('PACKAGE UPDATE WORKFLOW COMPLETED')
    console.log('='.repeat(60))
    
    const icon = workflowResult.success ? '✅' : '❌'
    console.log(`${icon} Status: ${workflowResult.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`Duration: ${this.formatDuration(workflowResult.duration)}`)
    
    const summary = workflowResult.summary
    console.log(`\nSummary:`)
    console.log(`  Dependencies Scanned: ${summary.dependenciesScanned}`)
    console.log(`  Packages Updated: ${summary.packagesUpdated}`)
    console.log(`  Vulnerabilities Found: ${summary.vulnerabilitiesFound}`)
    console.log(`  Breaking Changes Detected: ${summary.breakingChangesDetected}`)
    console.log(`  Compatibility Issues: ${summary.compatibilityIssues}`)
    
    if (summary.rollbackAvailable) {
      console.log(`  🔄 Rollback Available: ${workflowResult.rollbackId}`)
    }
    
    if (workflowResult.errors.length > 0) {
      console.log(`\nErrors (${workflowResult.errors.length}):`)
      workflowResult.errors.forEach((error: any, index: number) => {
        console.log(`  ${index + 1}. ${error.phase}: ${error.error.message}`)
      })
    }
    
    console.log('='.repeat(60) + '\n')
  }

  /**
   * Update feedback options
   */
  public updateOptions(newOptions: Partial<FeedbackOptions>): void {
    this.options = { ...this.options, ...newOptions }
  }
}