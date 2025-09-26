// hooks/useCreateProject.ts

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { resolveResource } from '@tauri-apps/api/path'
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

      setProgress?.(0)
      setCompleted?.(false)

      const filesToMove: [string, number][] = files.map(({ file, camera }) => [
        file.path,
        camera
      ])

      unlistenComplete = await listen<string[]>('copy_complete', async () => {
        setCompleted?.(true)
        await createTemplatePremiereProject()
        await showDialogAndOpenFolder()
      })

      await invoke('move_files', {
        files: filesToMove,
        baseDest: projectFolder
      })

      const now = new Date()
      const formattedDateTime = now.toLocaleString()

      const projectData: Breadcrumb = {
        projectTitle: title.trim(),
        numberOfCameras: numCameras,
        files: files.map(f => ({
          camera: f.camera,
          name: f.file.name
        })),
        parentFolder: selectedFolder,
        createdBy: username || 'Unknown User',
        creationDateTime: formattedDateTime
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
          const location = await resolveResource('Premiere 4K Template 2025.prproj')

          const result = await invoke('copy_premiere_project', {
            destinationFolder: filePath,
            location,
            newTitle: projectData.projectTitle
          })

          setMessage('Success: ' + result)
        } catch (error) {
          console.error('Error:', error)
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
          console.error('Error:', error)
        }
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Error creating project: ' + error)
    } finally {
      if (unlistenComplete) unlistenComplete()
    }
  }

  return { createProject }
}
