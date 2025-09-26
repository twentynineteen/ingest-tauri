import { useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
import { check } from '@tauri-apps/plugin-updater'
import { useVersionCheck } from './useVersionCheck'

/**
 * Custom hook that returns a mutation for checking and applying updates.
 * The mutation function accepts an object with a boolean property `onUserClick`
 * to indicate if the update check was initiated by the user.
 */
export function useUpdateMutation() {
  const { refetch: checkVersion } = useVersionCheck()

  // Define the mutation function with an explicit parameter type.
  const mutationFn = async (variables: { onUserClick: boolean }): Promise<void> => {
    // Destructure the onUserClick flag from the variables.
    const { onUserClick } = variables
    try {
      // First, check version using our custom hook
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
        // Show detailed version information
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
          try {
            // Use Tauri's updater to download and install
            const update = await check()
            if (update) {
              await update.downloadAndInstall()
              await invoke('graceful_restart')
            } else {
              await message('No update manifest found. Please try again later.', {
                title: 'Update Failed',
                kind: 'error',
                okLabel: 'OK'
              })
            }
          } catch (updateError) {
            console.error('Tauri updater error:', updateError)
            // Fallback: provide manual download link
            const manualUpdate = await ask(
              `Automatic update failed. Would you like to download the update manually?\\n\\nError: ${updateError.message || 'Unknown error'}`,
              {
                title: 'Update Error',
                kind: 'warning',
                okLabel: 'Download Manually',
                cancelLabel: 'Cancel'
              }
            )

            if (manualUpdate) {
              await openUrl(
                'https://github.com/twentynineteen/ingest-tauri/releases/latest'
              )
            }
          }
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

  // Return the mutation using the new options object format.
  return useMutation<void, Error, { onUserClick: boolean }>({
    mutationFn: mutationFn
  })
}
