/**
 * Comprehensive update management hook that handles GitHub releases and Tauri updater compatibility
 */

import { useMutation } from '@tanstack/react-query'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { createNamespacedLogger } from '../utils/logger'
import { useVersionCheck } from './useVersionCheck'
import { logger } from '@/utils/logger'

const log = createNamespacedLogger('UpdateManager')

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

    // Skip updates in dev mode
    if (process.env.NODE_ENV === 'development') {
      if (onUserClick) {
        await message('Updates are disabled in development mode.', {
          title: 'Development Mode',
          kind: 'info',
          okLabel: 'OK'
        })
      }
      return
    }

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
          await performUpdate()
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
      logger.error('[UpdateManager] Update check error:', error)
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
 * Perform the actual update download and installation using Tauri's built-in updater
 */
async function performUpdate(): Promise<void> {
  try {
    log.info('Checking for updates using Tauri updater...')

    // Use Tauri's built-in check() function
    const update = await check()

    if (update) {
      log.info('Update found:', {
        version: update.version,
        date: update.date,
        body: update.body
      })

      // Show download progress
      await message('Update download started. Please wait...', {
        title: 'Downloading Update',
        kind: 'info',
        okLabel: 'OK'
      })

      // Use Tauri's built-in downloadAndInstall
      await update.downloadAndInstall(event => {
        log.debug('Update progress:', event)
        // Could add progress UI here if needed
      })

      log.info('Update installed successfully')

      // Ask user if they want to restart now or later
      const restartNow = await ask(
        'Update installed successfully! The app needs to restart to apply the changes.\n\nRestart now?',
        {
          title: 'Update Complete',
          kind: 'info',
          okLabel: 'Restart Now',
          cancelLabel: 'Restart Later'
        }
      )

      if (restartNow) {
        log.info('User chose to restart now')
        try {
          await relaunch()
        } catch (restartError) {
          logger.error('[UpdateManager] Failed to restart automatically:', restartError)
          await message(
            'Automatic restart failed. Please close and reopen the app to complete the update.',
            {
              title: 'Manual Restart Required',
              kind: 'warning',
              okLabel: 'OK'
            }
          )
        }
      } else {
        log.info('User chose to restart later')
        await message(
          'Update installed! Please restart the app when convenient to apply the changes.',
          {
            title: 'Restart When Ready',
            kind: 'info',
            okLabel: 'OK'
          }
        )
      }
    } else {
      throw new Error('No update available from Tauri updater')
    }
  } catch (error) {
    logger.error('[UpdateManager] Tauri updater error:', error)

    // Offer manual download as fallback
    const manualUpdate = await ask(
      `Automatic update failed. Would you like to download the update manually?\\n\\nError: ${error?.message || String(error)}`,
      {
        title: 'Update Failed',
        kind: 'warning',
        okLabel: 'Download Manually',
        cancelLabel: 'Cancel'
      }
    )

    if (manualUpdate) {
      await openUrl('https://github.com/twentynineteen/bucket/releases/latest')
    }
  }
}
