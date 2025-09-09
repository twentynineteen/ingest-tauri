/**
 * Update Rollback Service
 * Provides rollback mechanism for failed package updates
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

export interface RollbackPoint {
  id: string
  timestamp: Date
  description: string
  packageChanges: PackageChange[]
  lockFiles: LockFileBackup[]
  gitCommitHash?: string
}

export interface PackageChange {
  name: string
  action: 'install' | 'update' | 'remove'
  fromVersion?: string
  toVersion: string
  isDev: boolean
}

export interface LockFileBackup {
  filePath: string
  content: string
  hash: string
}

export interface RollbackResult {
  success: boolean
  rolledBackChanges: PackageChange[]
  errors: string[]
  restoredFiles: string[]
  timestamp: Date
}

export interface RollbackValidation {
  isValid: boolean
  issues: string[]
  canProceed: boolean
}

export class UpdateRollbackService {
  private projectRoot: string
  private backupDir: string
  private rollbackPoints: Map<string, RollbackPoint> = new Map()

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.backupDir = path.join(projectRoot, '.update-rollback')
    this.initializeRollbackDirectory()
    this.loadExistingRollbackPoints()
  }

  /**
   * Initialize rollback directory structure
   */
  private async initializeRollbackDirectory(): Promise<void> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true })
      }
      
      // Create subdirectories
      const subdirs = ['lock-files', 'package-json', 'metadata']
      for (const subdir of subdirs) {
        const dirPath = path.join(this.backupDir, subdir)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
        }
      }
    } catch (error) {
      console.error('Failed to initialize rollback directory:', error)
    }
  }

  /**
   * Load existing rollback points from disk
   */
  private async loadExistingRollbackPoints(): Promise<void> {
    try {
      const metadataDir = path.join(this.backupDir, 'metadata')
      if (fs.existsSync(metadataDir)) {
        const files = fs.readdirSync(metadataDir)
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(metadataDir, file)
            const content = fs.readFileSync(filePath, 'utf-8')
            const rollbackPoint: RollbackPoint = JSON.parse(content)
            this.rollbackPoints.set(rollbackPoint.id, rollbackPoint)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load existing rollback points:', error)
    }
  }

  /**
   * Create a rollback point before making changes
   */
  public async createRollbackPoint(
    description: string, 
    packageChanges: PackageChange[]
  ): Promise<string> {
    const rollbackId = this.generateRollbackId()
    const timestamp = new Date()
    
    try {
      // Backup lock files
      const lockFiles = await this.backupLockFiles(rollbackId)
      
      // Get git commit hash if in a git repo
      const gitCommitHash = await this.getCurrentGitCommit()
      
      const rollbackPoint: RollbackPoint = {
        id: rollbackId,
        timestamp,
        description,
        packageChanges,
        lockFiles,
        gitCommitHash
      }
      
      // Save rollback point metadata
      await this.saveRollbackPointMetadata(rollbackPoint)
      
      // Store in memory
      this.rollbackPoints.set(rollbackId, rollbackPoint)
      
      console.log(`Created rollback point: ${rollbackId}`)
      return rollbackId
    } catch (error) {
      throw new Error(`Failed to create rollback point: ${error}`)
    }
  }

  /**
   * Generate unique rollback ID
   */
  private generateRollbackId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 5)
    return `rollback-${timestamp}-${random}`
  }

  /**
   * Backup lock files
   */
  private async backupLockFiles(rollbackId: string): Promise<LockFileBackup[]> {
    const lockFiles: LockFileBackup[] = []
    const lockFilePaths = [
      'package-lock.json',
      'yarn.lock',
      'bun.lock',
      'pnpm-lock.yaml'
    ]
    
    for (const lockFileName of lockFilePaths) {
      const lockFilePath = path.join(this.projectRoot, lockFileName)
      
      if (fs.existsSync(lockFilePath)) {
        const content = fs.readFileSync(lockFilePath, 'utf-8')
        const hash = this.calculateHash(content)
        
        // Save backup
        const backupPath = path.join(this.backupDir, 'lock-files', `${rollbackId}-${lockFileName}`)
        fs.writeFileSync(backupPath, content)
        
        lockFiles.push({
          filePath: lockFilePath,
          content,
          hash
        })
      }
    }
    
    // Also backup package.json
    const packageJsonPath = path.join(this.projectRoot, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const content = fs.readFileSync(packageJsonPath, 'utf-8')
      const hash = this.calculateHash(content)
      
      const backupPath = path.join(this.backupDir, 'package-json', `${rollbackId}-package.json`)
      fs.writeFileSync(backupPath, content)
      
      lockFiles.push({
        filePath: packageJsonPath,
        content,
        hash
      })
    }
    
    return lockFiles
  }

  /**
   * Calculate simple hash for content
   */
  private calculateHash(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  /**
   * Get current git commit hash
   */
  private async getCurrentGitCommit(): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', { cwd: this.projectRoot })
      return stdout.trim()
    } catch (error) {
      return undefined
    }
  }

  /**
   * Save rollback point metadata to disk
   */
  private async saveRollbackPointMetadata(rollbackPoint: RollbackPoint): Promise<void> {
    const metadataPath = path.join(this.backupDir, 'metadata', `${rollbackPoint.id}.json`)
    const metadata = {
      ...rollbackPoint,
      lockFiles: rollbackPoint.lockFiles.map(lf => ({
        filePath: lf.filePath,
        hash: lf.hash
      })) // Don't store full content in metadata
    }
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
  }

  /**
   * Execute rollback to a specific point
   */
  public async rollback(rollbackId: string): Promise<RollbackResult> {
    const rollbackPoint = this.rollbackPoints.get(rollbackId)
    
    if (!rollbackPoint) {
      throw new Error(`Rollback point ${rollbackId} not found`)
    }
    
    const result: RollbackResult = {
      success: false,
      rolledBackChanges: [],
      errors: [],
      restoredFiles: [],
      timestamp: new Date()
    }
    
    try {
      // Validate rollback is safe
      const validation = await this.validateRollback(rollbackPoint)
      if (!validation.canProceed) {
        result.errors.push(`Rollback validation failed: ${validation.issues.join(', ')}`)
        return result
      }
      
      // Restore lock files
      await this.restoreLockFiles(rollbackPoint, result)
      
      // Reinstall dependencies
      await this.reinstallDependencies(result)
      
      // Validate restoration
      const postRollbackValidation = await this.validatePostRollback(rollbackPoint)
      if (!postRollbackValidation.isValid) {
        result.errors.push('Post-rollback validation failed')
        result.errors.push(...postRollbackValidation.issues)
      } else {
        result.success = true
        result.rolledBackChanges = rollbackPoint.packageChanges
      }
      
    } catch (error) {
      result.errors.push(`Rollback failed: ${error}`)
    }
    
    return result
  }

  /**
   * Validate rollback is safe to proceed
   */
  private async validateRollback(rollbackPoint: RollbackPoint): Promise<RollbackValidation> {
    const issues: string[] = []
    
    // Check if backup files exist
    for (const lockFile of rollbackPoint.lockFiles) {
      const backupFileName = path.basename(lockFile.filePath)
      const backupPath = path.join(
        this.backupDir, 
        lockFile.filePath.endsWith('package.json') ? 'package-json' : 'lock-files',
        `${rollbackPoint.id}-${backupFileName}`
      )
      
      if (!fs.existsSync(backupPath)) {
        issues.push(`Backup file not found: ${backupPath}`)
      }
    }
    
    // Check if git state allows rollback
    if (rollbackPoint.gitCommitHash) {
      try {
        const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectRoot })
        if (stdout.trim()) {
          issues.push('Git working directory has uncommitted changes')
        }
      } catch (error) {
        // Git not available or not a git repo - continue
      }
    }
    
    // Check disk space
    try {
      const stats = fs.statSync(this.projectRoot)
      // Basic check - could be more sophisticated
      if (!stats.isDirectory()) {
        issues.push('Project root is not accessible')
      }
    } catch (error) {
      issues.push('Cannot access project directory')
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      canProceed: issues.length === 0 || issues.every(issue => !issue.includes('not found'))
    }
  }

  /**
   * Restore lock files from backup
   */
  private async restoreLockFiles(rollbackPoint: RollbackPoint, result: RollbackResult): Promise<void> {
    for (const lockFile of rollbackPoint.lockFiles) {
      try {
        const backupFileName = path.basename(lockFile.filePath)
        const backupPath = path.join(
          this.backupDir,
          lockFile.filePath.endsWith('package.json') ? 'package-json' : 'lock-files',
          `${rollbackPoint.id}-${backupFileName}`
        )
        
        if (fs.existsSync(backupPath)) {
          const backupContent = fs.readFileSync(backupPath, 'utf-8')
          fs.writeFileSync(lockFile.filePath, backupContent)
          result.restoredFiles.push(lockFile.filePath)
        }
      } catch (error) {
        result.errors.push(`Failed to restore ${lockFile.filePath}: ${error}`)
      }
    }
  }

  /**
   * Reinstall dependencies after rollback
   */
  private async reinstallDependencies(result: RollbackResult): Promise<void> {
    try {
      // Clear node_modules
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules')
      if (fs.existsSync(nodeModulesPath)) {
        await execAsync('rm -rf node_modules', { cwd: this.projectRoot })
      }
      
      // Reinstall dependencies
      // Try npm first, then fall back to other package managers
      try {
        await execAsync('npm install', { cwd: this.projectRoot })
      } catch (npmError) {
        // Try bun if available
        try {
          await execAsync('bun install', { cwd: this.projectRoot })
        } catch (bunError) {
          result.errors.push(`Failed to reinstall dependencies: ${npmError}`)
        }
      }
    } catch (error) {
      result.errors.push(`Failed to reinstall dependencies: ${error}`)
    }
  }

  /**
   * Validate state after rollback
   */
  private async validatePostRollback(rollbackPoint: RollbackPoint): Promise<RollbackValidation> {
    const issues: string[] = []
    
    try {
      // Check if package.json and lock files are consistent
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const currentContent = fs.readFileSync(packageJsonPath, 'utf-8')
        const originalLockFile = rollbackPoint.lockFiles.find(lf => lf.filePath.endsWith('package.json'))
        
        if (originalLockFile && currentContent !== originalLockFile.content) {
          issues.push('package.json content does not match rollback point')
        }
      }
      
      // Try to run a basic command to verify dependencies are working
      await execAsync('npm list --depth=0', { cwd: this.projectRoot })
      
    } catch (error) {
      issues.push(`Dependency validation failed: ${error}`)
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      canProceed: true
    }
  }

  /**
   * List available rollback points
   */
  public listRollbackPoints(): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Get rollback point by ID
   */
  public getRollbackPoint(rollbackId: string): RollbackPoint | undefined {
    return this.rollbackPoints.get(rollbackId)
  }

  /**
   * Clean up old rollback points
   */
  public async cleanupOldRollbackPoints(maxAge: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - maxAge)
    
    const toDelete: string[] = []
    
    for (const [id, rollbackPoint] of this.rollbackPoints.entries()) {
      if (rollbackPoint.timestamp < cutoffDate) {
        toDelete.push(id)
      }
    }
    
    for (const id of toDelete) {
      await this.deleteRollbackPoint(id)
    }
    
    console.log(`Cleaned up ${toDelete.length} old rollback points`)
  }

  /**
   * Delete a specific rollback point
   */
  public async deleteRollbackPoint(rollbackId: string): Promise<void> {
    const rollbackPoint = this.rollbackPoints.get(rollbackId)
    
    if (!rollbackPoint) {
      return
    }
    
    try {
      // Delete backup files
      for (const lockFile of rollbackPoint.lockFiles) {
        const backupFileName = path.basename(lockFile.filePath)
        const backupPath = path.join(
          this.backupDir,
          lockFile.filePath.endsWith('package.json') ? 'package-json' : 'lock-files',
          `${rollbackId}-${backupFileName}`
        )
        
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath)
        }
      }
      
      // Delete metadata file
      const metadataPath = path.join(this.backupDir, 'metadata', `${rollbackId}.json`)
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath)
      }
      
      // Remove from memory
      this.rollbackPoints.delete(rollbackId)
      
    } catch (error) {
      console.error(`Failed to delete rollback point ${rollbackId}:`, error)
    }
  }

  /**
   * Check if rollback is available for a specific update
   */
  public canRollback(rollbackId: string): boolean {
    const rollbackPoint = this.rollbackPoints.get(rollbackId)
    return rollbackPoint !== undefined
  }
}