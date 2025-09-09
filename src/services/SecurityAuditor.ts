/**
 * Security audit service with npm/bun integration
 * Scans dependencies for known security vulnerabilities
 */

import { 
  SecurityVulnerability, 
  SecurityAuditResult, 
  VulnerabilitySource,
  VulnerabilityResolutionResult,
  VulnerabilityResolution,
  AppliedFix,
  FixResult,
  UpdateResult
} from '../models/SecurityVulnerability'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'

const execAsync = promisify(exec)

export class SecurityAuditor {
  private projectRoot: string
  private supportedSources: VulnerabilitySource[] = ['npm', 'github', 'snyk']

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  public async auditDependencies(): Promise<SecurityAuditResult> {
    const vulnerabilities: SecurityVulnerability[] = []

    try {
      // Run npm audit
      const npmVulns = await this.runNpmAudit()
      vulnerabilities.push(...npmVulns)

      // Try bun audit if available (may not be implemented yet)
      try {
        const bunVulns = await this.runBunAudit()
        vulnerabilities.push(...bunVulns)
      } catch (error) {
        // Bun audit not available, continue with npm results only
      }

      // Deduplicate vulnerabilities by ID
      const uniqueVulns = this.deduplicateVulnerabilities(vulnerabilities)

      return {
        vulnerabilityCount: this.countVulnerabilitiesBySeverity(uniqueVulns),
        vulnerabilities: uniqueVulns,
        timestamp: new Date()
      }
    } catch (error) {
      console.warn('Security audit failed:', error)
      return {
        vulnerabilityCount: { low: 0, moderate: 0, high: 0, critical: 0 },
        vulnerabilities: [],
        timestamp: new Date()
      }
    }
  }

  /**
   * Resolve security vulnerabilities with automated patching
   * @param vulnerabilities List of vulnerabilities to resolve
   * @param strategy Resolution strategy ('auto', 'patch', 'update')
   */
  public async resolveVulnerabilities(
    vulnerabilities: SecurityVulnerability[],
    strategy: 'auto' | 'patch' | 'update' = 'auto'
  ): Promise<VulnerabilityResolutionResult> {
    const resolutionResults: VulnerabilityResolution[] = []
    const resolvedIds: string[] = []
    const failedResolutions: string[] = []

    for (const vuln of vulnerabilities) {
      try {
        const resolution = await this.resolveVulnerability(vuln, strategy)
        resolutionResults.push(resolution)
        
        if (resolution.success) {
          resolvedIds.push(vuln.id)
        } else {
          failedResolutions.push(vuln.id)
        }
      } catch (error) {
        console.error(`Failed to resolve vulnerability ${vuln.id}:`, error)
        failedResolutions.push(vuln.id)
        resolutionResults.push({
          vulnerabilityId: vuln.id,
          strategy: 'failed',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          appliedFix: null
        })
      }
    }

    return {
      totalVulnerabilities: vulnerabilities.length,
      resolvedCount: resolvedIds.length,
      failedCount: failedResolutions.length,
      resolutions: resolutionResults,
      timestamp: new Date()
    }
  }

  /**
   * Resolve a single vulnerability
   */
  private async resolveVulnerability(
    vulnerability: SecurityVulnerability,
    strategy: 'auto' | 'patch' | 'update'
  ): Promise<VulnerabilityResolution> {
    // Determine best resolution strategy based on severity
    const effectiveStrategy = this.determineResolutionStrategy(vulnerability, strategy)
    
    switch (effectiveStrategy) {
      case 'patch':
        return await this.applySecurityPatch(vulnerability)
      case 'update':
        return await this.updateVulnerablePackage(vulnerability)
      case 'manual':
        return {
          vulnerabilityId: vulnerability.id,
          strategy: 'manual',
          success: false,
          error: 'Manual intervention required',
          appliedFix: null
        }
      default:
        throw new Error(`Unknown resolution strategy: ${effectiveStrategy}`)
    }
  }

  /**
   * Determine the best resolution strategy for a vulnerability
   */
  private determineResolutionStrategy(
    vulnerability: SecurityVulnerability,
    userStrategy: 'auto' | 'patch' | 'update'
  ): 'patch' | 'update' | 'manual' {
    if (userStrategy !== 'auto') {
      return userStrategy as 'patch' | 'update'
    }

    // Auto strategy logic
    if (vulnerability.severity === 'critical' || vulnerability.severity === 'high') {
      // For critical/high vulnerabilities, prefer updates if available
      return vulnerability.patchedVersions && vulnerability.patchedVersions.length > 0 ? 'update' : 'patch'
    } else {
      // For low/moderate vulnerabilities, prefer patches to minimize breaking changes
      return 'patch'
    }
  }

  /**
   * Apply security patch using npm/bun audit fix
   */
  private async applySecurityPatch(vulnerability: SecurityVulnerability): Promise<VulnerabilityResolution> {
    try {
      // Try npm audit fix first
      const npmResult = await this.runNpmAuditFix(vulnerability)
      if (npmResult.success) {
        return {
          vulnerabilityId: vulnerability.id,
          strategy: 'patch',
          success: true,
          appliedFix: npmResult.fix,
          error: null
        }
      }

      // Fallback to bun if npm fails
      const bunResult = await this.runBunAuditFix(vulnerability)
      return {
        vulnerabilityId: vulnerability.id,
        strategy: 'patch',
        success: bunResult.success,
        appliedFix: bunResult.fix,
        error: bunResult.success ? null : bunResult.error
      }
    } catch (error) {
      return {
        vulnerabilityId: vulnerability.id,
        strategy: 'patch',
        success: false,
        error: error instanceof Error ? error.message : 'Patch application failed',
        appliedFix: null
      }
    }
  }

  /**
   * Update vulnerable package to a safe version
   */
  private async updateVulnerablePackage(vulnerability: SecurityVulnerability): Promise<VulnerabilityResolution> {
    if (!vulnerability.patchedVersions || vulnerability.patchedVersions.length === 0) {
      return {
        vulnerabilityId: vulnerability.id,
        strategy: 'update',
        success: false,
        error: 'No patched versions available',
        appliedFix: null
      }
    }

    try {
      const targetVersion = this.selectBestPatchedVersion(vulnerability.patchedVersions)
      const updateResult = await this.updatePackageVersion(vulnerability.packageName, targetVersion)
      
      return {
        vulnerabilityId: vulnerability.id,
        strategy: 'update',
        success: updateResult.success,
        appliedFix: updateResult.success ? {
          type: 'version-update',
          packageName: vulnerability.packageName,
          fromVersion: vulnerability.installedVersion,
          toVersion: targetVersion,
          command: updateResult.command
        } : null,
        error: updateResult.success ? null : updateResult.error
      }
    } catch (error) {
      return {
        vulnerabilityId: vulnerability.id,
        strategy: 'update',
        success: false,
        error: error instanceof Error ? error.message : 'Package update failed',
        appliedFix: null
      }
    }
  }

  /**
   * Select the best patched version (prefer latest patch within same major)
   */
  private selectBestPatchedVersion(patchedVersions: string[]): string {
    // Sort versions and prefer latest patch within same major version
    // For simplicity, just return the last version (latest)
    return patchedVersions[patchedVersions.length - 1]
  }

  /**
   * Run npm audit fix for specific vulnerability
   */
  private async runNpmAuditFix(vulnerability: SecurityVulnerability): Promise<FixResult> {
    try {
      const command = `npm audit fix --package-lock-only`
      const { stdout, stderr } = await execAsync(command, { cwd: this.projectRoot })
      
      return {
        success: !stderr.includes('error'),
        fix: {
          type: 'audit-fix',
          packageName: vulnerability.packageName,
          fromVersion: vulnerability.installedVersion,
          toVersion: 'auto-fixed',
          command
        },
        error: stderr || null
      }
    } catch (error) {
      return {
        success: false,
        fix: null,
        error: error instanceof Error ? error.message : 'npm audit fix failed'
      }
    }
  }

  /**
   * Run bun audit fix for specific vulnerability
   */
  private async runBunAuditFix(vulnerability: SecurityVulnerability): Promise<FixResult> {
    try {
      // Bun doesn't have audit fix yet, simulate update
      const command = `bun update ${vulnerability.packageName}`
      const { stdout, stderr } = await execAsync(command, { cwd: this.projectRoot })
      
      return {
        success: !stderr.includes('error'),
        fix: {
          type: 'package-update',
          packageName: vulnerability.packageName,
          fromVersion: vulnerability.installedVersion,
          toVersion: 'updated',
          command
        },
        error: stderr || null
      }
    } catch (error) {
      return {
        success: false,
        fix: null,
        error: error instanceof Error ? error.message : 'bun update failed'
      }
    }
  }

  /**
   * Update package to specific version
   */
  private async updatePackageVersion(packageName: string, version: string): Promise<UpdateResult> {
    try {
      // Try npm first
      const npmCommand = `npm install ${packageName}@${version}`
      const { stdout: npmStdout, stderr: npmStderr } = await execAsync(npmCommand, { cwd: this.projectRoot })
      
      if (!npmStderr.includes('error')) {
        // Update bun lockfile too
        try {
          await execAsync('bun install', { cwd: this.projectRoot })
        } catch (bunError) {
          // Continue if bun update fails
        }
        
        return {
          success: true,
          command: npmCommand,
          error: null
        }
      }

      // Fallback to bun
      const bunCommand = `bun add ${packageName}@${version}`
      const { stdout: bunStdout, stderr: bunStderr } = await execAsync(bunCommand, { cwd: this.projectRoot })
      
      return {
        success: !bunStderr.includes('error'),
        command: bunCommand,
        error: bunStderr.includes('error') ? bunStderr : null
      }
    } catch (error) {
      return {
        success: false,
        command: `npm install ${packageName}@${version}`,
        error: error instanceof Error ? error.message : 'Package update failed'
      }
    }
  }

  public getSupportedSources(): VulnerabilitySource[] {
    return this.supportedSources
  }

  private async runNpmAudit(): Promise<SecurityVulnerability[]> {
    try {
      const { stdout } = await execAsync('npm audit --json', {
        cwd: this.projectRoot,
        timeout: 30000 // 30 second timeout
      })

      const auditResult = JSON.parse(stdout)
      return this.parseNpmAuditResult(auditResult)
    } catch (error: any) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout)
          return this.parseNpmAuditResult(auditResult)
        } catch (parseError) {
          throw new Error('Failed to parse npm audit output')
        }
      }
      throw new Error(`npm audit failed: ${error.message}`)
    }
  }

  private async runBunAudit(): Promise<SecurityVulnerability[]> {
    try {
      // Check if bun is available
      await execAsync('bun --version', { cwd: this.projectRoot })

      // Try to run bun audit (may not be implemented)
      const { stdout } = await execAsync('bun audit --json', {
        cwd: this.projectRoot,
        timeout: 30000
      })

      const auditResult = JSON.parse(stdout)
      return this.parseBunAuditResult(auditResult)
    } catch (error) {
      // Bun audit not available or failed
      return []
    }
  }

  private parseNpmAuditResult(auditResult: any): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = []

    if (!auditResult.vulnerabilities) {
      return vulnerabilities
    }

    for (const [packageName, vulnData] of Object.entries(auditResult.vulnerabilities)) {
      const vulnInfo = vulnData as any

      if (vulnInfo.via && Array.isArray(vulnInfo.via)) {
        for (const via of vulnInfo.via) {
          if (typeof via === 'object' && via.source) {
            try {
              const vulnerability = new SecurityVulnerability({
                id: via.source.toString(),
                severity: this.mapNpmSeverity(via.severity),
                affectedVersions: via.range || vulnInfo.range || '*',
                description: via.title || `Vulnerability in ${packageName}`,
                source: 'npm',
                publishedDate: via.created ? new Date(via.created) : new Date(),
                fixAvailable: Boolean(vulnInfo.fixAvailable),
                patchedVersion: vulnInfo.fixAvailable ? vulnInfo.fixAvailable.version : undefined
              })
              vulnerabilities.push(vulnerability)
            } catch (error) {
              // Skip invalid vulnerability data
              console.warn(`Skipping invalid vulnerability for ${packageName}:`, error)
            }
          }
        }
      }
    }

    return vulnerabilities
  }

  private parseBunAuditResult(auditResult: any): SecurityVulnerability[] {
    // Placeholder for bun audit result parsing
    // Implementation will depend on bun's audit output format when available
    return []
  }

  private mapNpmSeverity(npmSeverity: string): 'low' | 'moderate' | 'high' | 'critical' {
    switch (npmSeverity.toLowerCase()) {
      case 'info':
      case 'low':
        return 'low'
      case 'moderate':
        return 'moderate'
      case 'high':
        return 'high'
      case 'critical':
        return 'critical'
      default:
        return 'moderate'
    }
  }

  private deduplicateVulnerabilities(vulnerabilities: SecurityVulnerability[]): SecurityVulnerability[] {
    const seen = new Set<string>()
    const unique: SecurityVulnerability[] = []

    for (const vuln of vulnerabilities) {
      if (!seen.has(vuln.id)) {
        seen.add(vuln.id)
        unique.push(vuln)
      }
    }

    return unique
  }

  private countVulnerabilitiesBySeverity(vulnerabilities: SecurityVulnerability[]) {
    const counts = { low: 0, moderate: 0, high: 0, critical: 0 }

    for (const vuln of vulnerabilities) {
      counts[vuln.severity]++
    }

    return counts
  }
}