/**
 * Dependency scanning service
 * Scans project dependencies from package.json and lock files
 */

import { PackageDependency, DependencyScanResult, DependencyType, PackageManager } from '../models/PackageDependency'
import * as fs from 'fs'
import * as path from 'path'

export class DependencyScanner {
  private projectRoot: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  public async scanDependencies(): Promise<DependencyScanResult> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json')
    
    if (!fs.existsSync(packageJsonPath)) {
      return {
        totalDependencies: 0,
        dependencies: [],
        timestamp: new Date()
      }
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const dependencies: PackageDependency[] = []

    // Process regular dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        const dependency = await this.createDependency(
          name, 
          version as string, 
          'dependency'
        )
        dependencies.push(dependency)
      }
    }

    // Process dev dependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        const dependency = await this.createDependency(
          name, 
          version as string, 
          'devDependency'
        )
        dependencies.push(dependency)
      }
    }

    // Process peer dependencies
    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        const dependency = await this.createDependency(
          name, 
          version as string, 
          'peerDependency'
        )
        dependencies.push(dependency)
      }
    }

    return {
      totalDependencies: dependencies.length,
      dependencies,
      timestamp: new Date()
    }
  }

  private async createDependency(
    name: string, 
    version: string, 
    type: DependencyType
  ): Promise<PackageDependency> {
    // Clean version (remove ^ ~ >= etc.)
    const cleanVersion = this.cleanVersion(version)
    
    // Determine package manager (check which lock file was used)
    const packageManager = this.determinePackageManager()
    
    // Check if package is used in codebase
    const isUsed = await this.checkPackageUsage(name)

    return new PackageDependency({
      name,
      currentVersion: cleanVersion,
      type,
      isUsed,
      packageManager,
      vulnerabilities: [], // Will be populated by SecurityAuditor
      breakingChanges: [] // Will be populated during update analysis
    })
  }

  private cleanVersion(version: string): string {
    // Remove version prefixes like ^, ~, >=, etc.
    return version.replace(/^[\^~>=<]*/, '').split(' ')[0]
  }

  private determinePackageManager(): PackageManager {
    // Check which lock files exist to determine primary package manager
    const bunLockExists = fs.existsSync(path.join(this.projectRoot, 'bun.lock'))
    const npmLockExists = fs.existsSync(path.join(this.projectRoot, 'package-lock.json'))
    
    if (bunLockExists && !npmLockExists) {
      return 'bun'
    } else if (!bunLockExists && npmLockExists) {
      return 'npm'
    } else {
      // Both exist or neither exist, default to bun based on project preference
      return 'bun'
    }
  }

  private async checkPackageUsage(packageName: string): boolean {
    try {
      // Simple usage check - look for import statements in common directories
      const searchDirs = ['src', 'pages', 'components', 'hooks', 'utils', 'lib']
      const extensions = ['.ts', '.tsx', '.js', '.jsx']
      
      for (const dir of searchDirs) {
        const dirPath = path.join(this.projectRoot, dir)
        if (fs.existsSync(dirPath)) {
          const found = await this.searchInDirectory(dirPath, packageName, extensions)
          if (found) return true
        }
      }

      // Check for Tauri-specific packages (these are used even if not directly imported)
      if (packageName.startsWith('@tauri-apps/')) {
        return true
      }

      // Check for build tools (always considered "used")
      const buildTools = [
        'vite', 'typescript', 'eslint', 'prettier', 'tailwindcss',
        '@vitejs/plugin-react', 'postcss', 'autoprefixer'
      ]
      if (buildTools.includes(packageName)) {
        return true
      }

      return false
    } catch (error) {
      // If we can't determine usage, assume it's used to be safe
      return true
    }
  }

  private async searchInDirectory(
    dirPath: string, 
    packageName: string, 
    extensions: string[]
  ): Promise<boolean> {
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true })
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name)
        
        if (file.isDirectory()) {
          // Recursively search subdirectories
          const found = await this.searchInDirectory(fullPath, packageName, extensions)
          if (found) return true
        } else if (extensions.some(ext => file.name.endsWith(ext))) {
          // Search file content for package usage
          const content = fs.readFileSync(fullPath, 'utf-8')
          
          // Look for import/require statements
          const importPatterns = [
            new RegExp(`import.*['"]${packageName}['"]`, 'i'),
            new RegExp(`import.*['"]${packageName}/`, 'i'),
            new RegExp(`require\\(['"]${packageName}['"]\\)`, 'i'),
            new RegExp(`from ['"]${packageName}['"]`, 'i'),
            new RegExp(`from ['"]${packageName}/`, 'i')
          ]
          
          if (importPatterns.some(pattern => pattern.test(content))) {
            return true
          }
        }
      }
      
      return false
    } catch (error) {
      // If we can't read the directory, assume package is used
      return true
    }
  }
}