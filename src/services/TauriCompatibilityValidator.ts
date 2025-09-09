/**
 * Tauri Compatibility Validator
 * Validates Tauri plugin compatibility and manages updates
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

export interface TauriCompatibility {
  coreVersion: string
  pluginCompatibility: PluginCompatibility[]
  rustVersion?: string
  nodeVersion: string
  overallCompatible: boolean
  issues: CompatibilityIssue[]
}

export interface PluginCompatibility {
  name: string
  currentVersion: string
  compatibleVersions: string[]
  status: 'compatible' | 'outdated' | 'incompatible'
  recommendedVersion?: string
  issues: string[]
}

export interface CompatibilityIssue {
  severity: 'warning' | 'error' | 'info'
  component: string
  message: string
  resolution?: string
}

export interface TauriUpdateResult {
  success: boolean
  updatedPlugins: string[]
  errors: string[]
  compatibilityReport: TauriCompatibility
}

export class TauriCompatibilityValidator {
  private projectRoot: string
  private tauriConfigPath: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.tauriConfigPath = path.join(projectRoot, 'src-tauri', 'tauri.conf.json')
  }

  /**
   * Validate current Tauri setup compatibility
   */
  public async validateCompatibility(): Promise<TauriCompatibility> {
    const issues: CompatibilityIssue[] = []
    
    try {
      // Get Tauri core version
      const coreVersion = await this.getTauriCoreVersion()
      
      // Get current plugin versions from package.json
      const pluginCompatibility = await this.validatePluginCompatibility(coreVersion)
      
      // Check Rust version compatibility
      const rustVersion = await this.getRustVersion()
      if (rustVersion) {
        await this.validateRustCompatibility(rustVersion, coreVersion, issues)
      }
      
      // Check Node.js version
      const nodeVersion = process.version
      await this.validateNodeCompatibility(nodeVersion, issues)
      
      // Check Tauri config compatibility
      await this.validateTauriConfig(coreVersion, issues)
      
      const overallCompatible = !issues.some(issue => issue.severity === 'error')
      
      return {
        coreVersion,
        pluginCompatibility,
        rustVersion,
        nodeVersion,
        overallCompatible,
        issues
      }
    } catch (error) {
      issues.push({
        severity: 'error',
        component: 'Tauri Validator',
        message: `Failed to validate compatibility: ${error}`,
        resolution: 'Check Tauri installation and project setup'
      })
      
      return {
        coreVersion: 'unknown',
        pluginCompatibility: [],
        nodeVersion: process.version,
        overallCompatible: false,
        issues
      }
    }
  }

  /**
   * Get Tauri core version
   */
  private async getTauriCoreVersion(): Promise<string> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      
      // Check dependencies first, then devDependencies
      const tauriCli = packageJson.dependencies?.['@tauri-apps/cli'] || 
                      packageJson.devDependencies?.['@tauri-apps/cli']
      
      if (tauriCli) {
        return tauriCli.replace(/^[\^~]/, '') // Remove semver prefix
      }
      
      // Fallback to CLI check
      const { stdout } = await execAsync('npx @tauri-apps/cli --version', { cwd: this.projectRoot })
      const match = stdout.match(/(\d+\.\d+\.\d+)/)
      return match ? match[1] : 'unknown'
    } catch (error) {
      throw new Error(`Could not determine Tauri core version: ${error}`)
    }
  }

  /**
   * Validate plugin compatibility with core version
   */
  private async validatePluginCompatibility(coreVersion: string): Promise<PluginCompatibility[]> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    
    const tauriPlugins: PluginCompatibility[] = []
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    for (const [name, version] of Object.entries(allDeps)) {
      if (name.startsWith('@tauri-apps/plugin-') || name.startsWith('tauri-plugin-')) {
        const currentVersion = (version as string).replace(/^[\^~]/, '')
        const compatibility = await this.checkPluginCompatibility(name, currentVersion, coreVersion)
        tauriPlugins.push(compatibility)
      }
    }
    
    return tauriPlugins
  }

  /**
   * Check specific plugin compatibility
   */
  private async checkPluginCompatibility(
    pluginName: string, 
    currentVersion: string, 
    coreVersion: string
  ): Promise<PluginCompatibility> {
    try {
      // Get plugin info from npm
      const { stdout } = await execAsync(`npm info ${pluginName} --json`)
      const pluginInfo = JSON.parse(stdout)
      
      const compatibility: PluginCompatibility = {
        name: pluginName,
        currentVersion,
        compatibleVersions: [currentVersion],
        status: 'compatible',
        issues: []
      }
      
      // Check if plugin has peer dependencies on Tauri core
      if (pluginInfo.peerDependencies) {
        const tauriCoreDep = pluginInfo.peerDependencies['@tauri-apps/api'] || 
                            pluginInfo.peerDependencies['@tauri-apps/cli']
        
        if (tauriCoreDep && !this.isVersionCompatible(coreVersion, tauriCoreDep)) {
          compatibility.status = 'incompatible'
          compatibility.issues.push(
            `Plugin requires Tauri ${tauriCoreDep}, but ${coreVersion} is installed`
          )
        }
      }
      
      // Check for recommended version
      const latestVersion = pluginInfo['dist-tags']?.latest
      if (latestVersion && latestVersion !== currentVersion) {
        compatibility.recommendedVersion = latestVersion
        if (this.isNewerVersion(latestVersion, currentVersion)) {
          compatibility.status = 'outdated'
          compatibility.issues.push(`Newer version available: ${latestVersion}`)
        }
      }
      
      return compatibility
    } catch (error) {
      return {
        name: pluginName,
        currentVersion,
        compatibleVersions: [],
        status: 'incompatible',
        issues: [`Failed to check compatibility: ${error}`]
      }
    }
  }

  /**
   * Check if versions are compatible (simplified semver check)
   */
  private isVersionCompatible(currentVersion: string, requiredRange: string): boolean {
    // Simplified compatibility check - in production, use a proper semver library
    const cleanRequired = requiredRange.replace(/^[\^~>=<]/, '')
    const currentParts = currentVersion.split('.').map(Number)
    const requiredParts = cleanRequired.split('.').map(Number)
    
    // Major version must match for Tauri plugins
    return currentParts[0] === requiredParts[0]
  }

  /**
   * Check if one version is newer than another
   */
  private isNewerVersion(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part > v2Part) return true
      if (v1Part < v2Part) return false
    }
    
    return false
  }

  /**
   * Get Rust version
   */
  private async getRustVersion(): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('rustc --version')
      const match = stdout.match(/rustc (\d+\.\d+\.\d+)/)
      return match ? match[1] : undefined
    } catch (error) {
      return undefined
    }
  }

  /**
   * Validate Rust compatibility
   */
  private async validateRustCompatibility(
    rustVersion: string, 
    tauriVersion: string, 
    issues: CompatibilityIssue[]
  ): Promise<void> {
    // Tauri 2.x requires Rust 1.70+
    const rustParts = rustVersion.split('.').map(Number)
    const tauriParts = tauriVersion.split('.').map(Number)
    
    if (tauriParts[0] >= 2) {
      if (rustParts[0] < 1 || (rustParts[0] === 1 && rustParts[1] < 70)) {
        issues.push({
          severity: 'error',
          component: 'Rust',
          message: `Tauri ${tauriVersion} requires Rust 1.70+, but ${rustVersion} is installed`,
          resolution: 'Update Rust: rustup update stable'
        })
      }
    }
  }

  /**
   * Validate Node.js compatibility
   */
  private async validateNodeCompatibility(nodeVersion: string, issues: CompatibilityIssue[]): Promise<void> {
    const nodeParts = nodeVersion.replace('v', '').split('.').map(Number)
    
    // Tauri requires Node.js 16+
    if (nodeParts[0] < 16) {
      issues.push({
        severity: 'error',
        component: 'Node.js',
        message: `Tauri requires Node.js 16+, but ${nodeVersion} is installed`,
        resolution: 'Update Node.js to version 16 or higher'
      })
    } else if (nodeParts[0] < 18) {
      issues.push({
        severity: 'warning',
        component: 'Node.js',
        message: `Node.js ${nodeVersion} is supported but consider upgrading to 18+ for better performance`,
        resolution: 'Consider updating to Node.js 18+'
      })
    }
  }

  /**
   * Validate Tauri configuration
   */
  private async validateTauriConfig(tauriVersion: string, issues: CompatibilityIssue[]): Promise<void> {
    try {
      if (!fs.existsSync(this.tauriConfigPath)) {
        issues.push({
          severity: 'error',
          component: 'Tauri Config',
          message: 'tauri.conf.json not found',
          resolution: 'Ensure project is properly initialized with Tauri'
        })
        return
      }
      
      const config = JSON.parse(fs.readFileSync(this.tauriConfigPath, 'utf-8'))
      
      // Check for deprecated configuration options based on version
      const tauriMajor = parseInt(tauriVersion.split('.')[0])
      
      if (tauriMajor >= 2) {
        // Check for Tauri 2.x specific configurations
        if (config.tauri?.windows && config.tauri.windows.length === 0) {
          issues.push({
            severity: 'warning',
            component: 'Tauri Config',
            message: 'Empty windows array may cause issues in Tauri 2.x',
            resolution: 'Review window configuration in tauri.conf.json'
          })
        }
      }
    } catch (error) {
      issues.push({
        severity: 'warning',
        component: 'Tauri Config',
        message: `Could not validate tauri.conf.json: ${error}`,
        resolution: 'Check tauri.conf.json syntax and structure'
      })
    }
  }

  /**
   * Update Tauri plugins with compatibility validation
   */
  public async updateTauriPlugins(): Promise<TauriUpdateResult> {
    const result: TauriUpdateResult = {
      success: false,
      updatedPlugins: [],
      errors: [],
      compatibilityReport: await this.validateCompatibility()
    }
    
    try {
      // Get plugins that can be safely updated
      const outdatedPlugins = result.compatibilityReport.pluginCompatibility
        .filter(plugin => plugin.status === 'outdated' && plugin.recommendedVersion)
      
      if (outdatedPlugins.length === 0) {
        result.success = true
        return result
      }
      
      // Update each plugin
      for (const plugin of outdatedPlugins) {
        try {
          const updateCommand = `npm install ${plugin.name}@${plugin.recommendedVersion}`
          await execAsync(updateCommand, { cwd: this.projectRoot })
          result.updatedPlugins.push(`${plugin.name}@${plugin.recommendedVersion}`)
        } catch (error) {
          result.errors.push(`Failed to update ${plugin.name}: ${error}`)
        }
      }
      
      // Update bun lockfile if needed
      try {
        await execAsync('bun install', { cwd: this.projectRoot })
      } catch (error) {
        // Continue if bun is not available
      }
      
      // Re-validate compatibility after updates
      result.compatibilityReport = await this.validateCompatibility()
      result.success = result.errors.length === 0
      
    } catch (error) {
      result.errors.push(`Update process failed: ${error}`)
    }
    
    return result
  }
}