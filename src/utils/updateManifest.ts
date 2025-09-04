/**
 * Utilities for converting GitHub release data to Tauri updater manifest format
 */

interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  prerelease: boolean
  draft: boolean
  assets: GitHubAsset[]
}

interface GitHubAsset {
  name: string
  browser_download_url: string
  content_type: string
  size: number
}

interface TauriUpdateManifest {
  version: string
  notes?: string
  pub_date?: string
  platforms: {
    [key: string]: {
      url: string
      signature: string
    }
  }
}

interface TauriUpdateResponse {
  version: string
  notes?: string
  pub_date?: string
  url: string
  signature: string
}

/**
 * Convert GitHub release to Tauri update manifest format
 */
export function convertGitHubReleaseToTauriManifest(
  release: GitHubRelease,
  currentPlatform: string
): TauriUpdateManifest | null {
  if (!release || release.draft || release.prerelease) {
    return null
  }

  // Find platform-specific assets
  const platforms: { [key: string]: { url: string; signature: string } } = {}

  // Look for signature files and their corresponding binaries
  const signatureFiles = release.assets.filter(asset => asset.name.endsWith('.sig'))
  const updateFiles = release.assets.filter(asset => 
    asset.name.includes('.tar.gz') || 
    asset.name.includes('.zip') || 
    asset.name.includes('.msi') ||
    asset.name.includes('.dmg') ||
    asset.name.includes('.AppImage')
  )

  // Map platform identifiers
  const platformMap: { [key: string]: string[] } = {
    'darwin-x86_64': ['macos', 'darwin', 'osx', '.dmg'],
    'darwin-aarch64': ['macos-arm', 'darwin-arm', 'osx-arm', 'aarch64.dmg'],
    'linux-x86_64': ['linux', '.AppImage', 'linux-x86_64'],
    'windows-x86_64': ['windows', '.msi', '.exe', 'win']
  }

  for (const [platform, identifiers] of Object.entries(platformMap)) {
    // Find matching update file for this platform
    const updateFile = updateFiles.find(asset => 
      identifiers.some(identifier => 
        asset.name.toLowerCase().includes(identifier.toLowerCase())
      )
    )

    if (updateFile) {
      // Find corresponding signature file
      const baseName = updateFile.name.replace(/\.(tar\.gz|zip|msi|dmg|AppImage)$/, '')
      const signatureFile = signatureFiles.find(sig => 
        sig.name.includes(baseName) || sig.name.includes(updateFile.name)
      )

      if (signatureFile) {
        platforms[platform] = {
          url: updateFile.browser_download_url,
          signature: signatureFile.browser_download_url // This should be the signature content, not URL
        }
      }
    }
  }

  // Return null if no platforms found
  if (Object.keys(platforms).length === 0) {
    return null
  }

  return {
    version: release.tag_name.replace(/^v/, ''), // Remove leading 'v'
    notes: release.body || 'No release notes available',
    pub_date: release.published_at,
    platforms
  }
}

/**
 * Convert GitHub release to Tauri single-platform update response
 */
export function convertGitHubReleaseToTauriResponse(
  release: GitHubRelease,
  platformKey: string
): TauriUpdateResponse | null {
  const manifest = convertGitHubReleaseToTauriManifest(release, platformKey)
  
  if (!manifest || !manifest.platforms[platformKey]) {
    return null
  }

  const platform = manifest.platforms[platformKey]
  
  return {
    version: manifest.version,
    notes: manifest.notes,
    pub_date: manifest.pub_date,
    url: platform.url,
    signature: platform.signature
  }
}

/**
 * Get current platform key for Tauri updater
 */
export function getCurrentPlatformKey(): string {
  const platform = window.__TAURI_INTERNALS__?.metadata?.target
  
  if (platform) {
    return platform
  }

  // Fallback detection
  const userAgent = navigator.userAgent.toLowerCase()
  const arch = navigator.userAgent.includes('x86_64') || navigator.userAgent.includes('WOW64') ? 'x86_64' : 'aarch64'
  
  if (userAgent.includes('mac')) {
    return `darwin-${arch}`
  } else if (userAgent.includes('linux')) {
    return `linux-${arch}`
  } else if (userAgent.includes('win')) {
    return `windows-${arch}`
  }
  
  return 'unknown'
}

/**
 * Fetch signature content from URL (signature should be content, not URL)
 */
export async function fetchSignatureContent(signatureUrl: string): Promise<string> {
  const response = await fetch(signatureUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch signature: ${response.statusText}`)
  }
  return response.text()
}