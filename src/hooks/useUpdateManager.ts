/**
 * Comprehensive update management hook that handles GitHub releases and Tauri updater compatibility
 */

import { useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
import { 
  convertGitHubReleaseToTauriResponse, 
  getCurrentPlatformKey,
  fetchSignatureContent 
} from '../utils/updateManifest'
import { useVersionCheck } from './useVersionCheck'

interface UpdateManagerOptions {
  onUserClick: boolean
}

/**
 * Hook for managing application updates with GitHub releases integration
 */
export function useUpdateManager() {
  const { refetch: checkVersion } = useVersionCheck()

  const mutationFn = async (options: UpdateManagerOptions): Promise<void> => {
    const { onUserClick } = options

    try {
      // Check for updates using GitHub API
      const versionResult = await checkVersion()

      if (versionResult.isError) {
        await message(
          'Failed to check for updates. Please check your internet connection and try again.',
          {
            title: 'Update Check Failed',
            kind: 'error',
            okLabel: 'OK'
          }
        )
        return
      }

      const versionData = versionResult.data

      if (versionData?.updateAvailable) {
        // Show update confirmation dialog
        const userConfirmed = await ask(
          `Update from ${versionData.currentVersion} to ${versionData.latestVersion} is available!\\n\\nRelease notes: ${versionData.releaseNotes}`,
          {
            title: 'Update Available',
            kind: 'info',
            okLabel: 'Update',
            cancelLabel: 'Cancel'
          }
        )

        if (userConfirmed) {
          await performUpdate(versionData.latestVersion)
        }
      } else if (onUserClick) {
        // Show current version info when no update is available
        await message(`You are on the latest version ${versionData?.currentVersion}.`, {
          title: 'No Update Available',
          kind: 'info',
          okLabel: 'OK'
        })
      }
    } catch (error) {
      console.error('Update check error:', error)
      await message(
        error.message || 'An unexpected error occurred during update check.',
        {
          title: 'Error',
          kind: 'error',
          okLabel: 'OK'
        }
      )
    }
  }

  return useMutation<void, Error, UpdateManagerOptions>({
    mutationFn
  })
}

/**
 * Perform the actual update download and installation
 */
async function performUpdate(targetVersion: string): Promise<void> {
  try {
    // Fetch the GitHub release data
    const response = await fetch(
      'https://api.github.com/repos/twentynineteen/ingest-tauri/releases/latest'
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch release data: ${response.statusText}`)
    }

    const releaseData = await response.json()
    const platformKey = getCurrentPlatformKey()
    
    // Convert GitHub release to Tauri format
    const tauriUpdate = convertGitHubReleaseToTauriResponse(releaseData, platformKey)
    
    if (!tauriUpdate) {
      throw new Error(`No compatible update found for platform: ${platformKey}`)
    }

    // Fetch signature content if it's a URL
    if (tauriUpdate.signature.startsWith('http')) {
      tauriUpdate.signature = await fetchSignatureContent(tauriUpdate.signature)
    }

    // Create a custom update object that mimics Tauri's Update interface
    const customUpdate = {
      version: tauriUpdate.version,
      notes: tauriUpdate.notes,
      pub_date: tauriUpdate.pub_date,
      downloadAndInstall: async () => {
        // Show download progress
        await message('Update download started. Please wait...', {
          title: 'Downloading Update',
          kind: 'info',
          okLabel: 'OK'
        })

        // Use Tauri's built-in download functionality if available
        // Otherwise, redirect to manual download
        try {
          // Attempt to use invoke for custom download command
          await invoke('download_and_install_update', {
            url: tauriUpdate.url,
            signature: tauriUpdate.signature,
            version: tauriUpdate.version
          })
        } catch (invokeError) {
          // Fallback to manual download
          throw new Error('Automatic installation not available')
        }
      }
    }

    // Attempt installation
    try {
      await customUpdate.downloadAndInstall()
      await invoke('graceful_restart')
    } catch (installError) {
      // Offer manual download as fallback
      const manualUpdate = await ask(
        `Automatic installation failed. Would you like to download the update manually?\\n\\nError: ${installError.message}`,
        {
          title: 'Installation Failed',
          kind: 'warning',
          okLabel: 'Download Manually',
          cancelLabel: 'Cancel'
        }
      )

      if (manualUpdate) {
        await openUrl('https://github.com/twentynineteen/ingest-tauri/releases/latest')
      }
    }

  } catch (error) {
    console.error('Update performance error:', error)
    
    // Final fallback - manual download
    const fallbackDownload = await ask(
      `Update preparation failed. Would you like to download manually?\\n\\nError: ${error.message}`,
      {
        title: 'Update Failed',
        kind: 'error',
        okLabel: 'Download Manually',
        cancelLabel: 'Cancel'
      }
    )

    if (fallbackDownload) {
      await openUrl('https://github.com/twentynineteen/ingest-tauri/releases/latest')
    }
  }
}