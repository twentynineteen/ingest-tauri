// hooks/useCreateProject.ts

import { logger } from '@/utils/logger'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { confirm } from '@tauri-apps/plugin-dialog'
import { exists, mkdir, remove, writeTextFile } from '@tauri-apps/plugin-fs'
import { appStore } from 'store/useAppStore'
import { Breadcrumb } from 'utils/types'
import { FootageFile } from './useCameraAutoRemap'

interface CreateProjectParams {
  title: string
  files: FootageFile[]
  selectedFolder: string
  numCameras: number
  username: string
  setProgress?: (value: number) => void
  setCompleted?: (value: boolean) => void
  setMessage: (value: string) => void
  setLoading: (value: boolean) => void
}

export function useCreateProject() {
  const createProject = async ({
    title,
    files,
    selectedFolder,
    numCameras,
    username,
    setProgress,
    setCompleted,
    setMessage,
    setLoading
  }: CreateProjectParams) => {
    if (!selectedFolder) {
      alert('Please select a destination folder.')
      return
    }

    if (!title.trim()) {
      alert('Please enter a project title.')
      return
    }

    if (files.length === 0) {
      const confirmNoFiles = await confirm(
        'No files have been added to the drag and drop section. Are you sure you want to create the project?'
      )
      if (!confirmNoFiles) return
    }

    const projectFolder = `${selectedFolder}/${title.trim()}`

    if (await exists(projectFolder)) {
      const overwrite = await confirm(
        `The folder "${projectFolder}" already exists. Do you want to overwrite it?`
      )
      if (!overwrite) return
      await remove(projectFolder, { recursive: true })
    }

    let unlistenComplete: (() => void) | null = null

    try {
      // Create folder structure with proper error handling
      try {
        await mkdir(projectFolder, { recursive: true })

        for (let cam = 1; cam <= numCameras; cam++) {
          await mkdir(`${projectFolder}/Footage/Camera ${cam}`, { recursive: true })
        }

        await Promise.all([
          mkdir(`${projectFolder}/Graphics`, { recursive: true }),
          mkdir(`${projectFolder}/Renders`, { recursive: true }),
          mkdir(`${projectFolder}/Projects`, { recursive: true }),
          mkdir(`${projectFolder}/Scripts`, { recursive: true })
        ])
      } catch (mkdirError) {
        logger.error('Error creating folders:', mkdirError)
        alert('Error creating project: ' + mkdirError)
        // Clean up listener if it was created
        if (unlistenComplete) unlistenComplete()
        return
      }

      setProgress?.(0)
      setCompleted?.(false)

      const filesToMove: [string, number][] = files.map(({ file, camera }) => [
        file.path,
        camera
      ])

      const now = new Date()
      const formattedDateTime = now.toISOString()

      // Calculate folder size after files are moved
      let folderSizeBytes: number | undefined
      try {
        folderSizeBytes = await invoke<number>('get_folder_size', {
          folderPath: projectFolder
        })
      } catch (error) {
        logger.warn('Failed to calculate folder size:', error)
        folderSizeBytes = undefined
      }

      const projectData: Breadcrumb = {
        projectTitle: title.trim(),
        numberOfCameras: numCameras,
        files: files.map(f => ({
          camera: f.camera,
          name: f.file.name,
          path: f.file.path
        })),
        parentFolder: selectedFolder,
        createdBy: username || 'Unknown User',
        creationDateTime: formattedDateTime,
        folderSizeBytes
      }

      appStore.getState().setBreadcrumbs(projectData)

      await writeTextFile(
        `${projectFolder}/breadcrumbs.json`,
        JSON.stringify(projectData, null, 2)
      )

      async function createTemplatePremiereProject() {
        setLoading(true)
        setMessage('')

        try {
          const filePath = `${projectData.parentFolder}/${projectData.projectTitle}/Projects/`

          const result = await invoke('copy_premiere_project', {
            destinationFolder: filePath,
            newTitle: projectData.projectTitle
          })

          setMessage('Success: ' + result)
        } catch (error) {
          logger.error('Error:', error)
          setMessage('Error: ' + error)
        } finally {
          setLoading(false)
        }
      }

      async function showDialogAndOpenFolder() {
        try {
          await invoke('show_confirmation_dialog', {
            message: 'Do you want to open the project folder now?',
            title: 'Transfer complete!',
            destination: `${projectData.parentFolder}/${projectData.projectTitle}`
          })
        } catch (error) {
          logger.error('Error:', error)
        }
      }

      // Set up event listener BEFORE calling move_files
      unlistenComplete = await listen<string[]>('copy_complete', async () => {
        try {
          setCompleted?.(true)
          await createTemplatePremiereProject()
          await showDialogAndOpenFolder()
        } catch (error) {
          logger.error('Error in copy_complete handler:', error)
          alert('Error completing project: ' + error)
        } finally {
          // Clean up the event listener after handling the event
          if (unlistenComplete) unlistenComplete()
        }
      })

      // Move files with proper error handling
      try {
        await invoke('move_files', {
          files: filesToMove,
          baseDest: projectFolder
        })
      } catch (moveError) {
        logger.error('Error moving files:', moveError)
        alert('Error creating project: ' + moveError)
        // Clean up listener
        if (unlistenComplete) unlistenComplete()
        return
      }
    } catch (error) {
      logger.error('Error creating project:', error)
      alert('Error creating project: ' + error)
      // Clean up listener if we error before move_files completes
      if (unlistenComplete) unlistenComplete()
    }
  }

  return { createProject }
}
