import { Button } from '@components/ui/button'
import { Progress } from '@components/ui/progress'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-dialog'
import { useBreadcrumb } from 'hooks/useBreadcrumb'
import { Sprout } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { appStore } from 'store/useAppStore'
import ExternalLink from 'utils/ExternalLink'
import FormattedDate from 'utils/FormattedDate'
import { SproutUploadResponse } from 'utils/types'
import EmbedCodeInput from '../utils/EmbedCodeInput'
import { loadApiKeys } from '../utils/storage'

const UploadSprout = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [response, setResponse] = useState<SproutUploadResponse | null>(null)

  const [selectedFolder] = useState<string | null>(null)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  // State to force image refresh – we update this value every 60 seconds
  const [refreshTimestamp, setRefreshTimestamp] = useState<number>(Date.now())

  // Page label - shadcn breadcrumb component
  useBreadcrumb([
    { label: 'Upload content', href: '/upload/sprout' },
    { label: 'Sprout video' }
  ])

  useEffect(() => {
    // This effect will trigger a refresh of the image every 60 seconds after an upload response is available.
    if (response) {
      const timer = setTimeout(() => {
        // Update refreshTimestamp to force re-rendering of the image.
        setRefreshTimestamp(Date.now())
        // Optionally, reset the thumbnailLoaded flag to show a loading placeholder again.
        setThumbnailLoaded(false)
      }, 30000) // 30,000ms = 30 seconds
      return () => clearTimeout(timer)
    }
  }, [response])

  // Load API key when component mounts
  useEffect(() => {
    const fetchApiKey = async () => {
      const key = await loadApiKeys()
      setApiKey(key.sproutVideo)
    }
    fetchApiKey()
  }, [])

  // Currently unused video navigator
  // useEffect(() => {
  //   async function fetchRootFolders() {
  //     try {
  //       // Pass no parent_id to get the root folders.
  //       const result = await invoke<GetFoldersResponse>('get_folders', {
  //         apiKey,
  //         parent_id: null
  //       })
  //       setRootFolders(result.folders)
  //     } catch (error) {
  //       console.error('Error fetching root folders:', error)
  //     }
  //   }
  //   if (apiKey) {
  //     fetchRootFolders()
  //   }
  // }, [apiKey])

  // Listen for upload progress events
  useEffect(() => {
    console.log('Setting up event listeners...')

    const unlistenProgress = listen('upload_progress', event => {
      // console.log('Received progress event:', event.payload) // Log event data
      setProgress(event.payload as number)
    })

    const unlistenComplete = listen('upload_complete', event => {
      // console.log('Received upload complete event:', event.payload) // Log event data
      setMessage(event.payload as string)
      setUploading(false)
    })

    const unlistenError = listen('upload_error', event => {
      // console.log('Received upload error event:', event.payload) // Log event data
      setMessage(event.payload as string)
      setUploading(false)
    })

    return () => {
      unlistenProgress.then(unsub => unsub())
      unlistenComplete.then(unsub => unsub())
      unlistenError.then(unsub => unsub())
    }
  }, [])

  // Handle file selection
  const selectFile = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'avi'] }]
    })
    if (typeof file === 'string') {
      setSelectedFile(file)
    }
  }

  // Call Rust backend to upload file
  const uploadFile = async () => {
    // Validate file selection and API key
    if (!selectedFile) {
      alert('Please select a video file.')
      return
    }
    if (!apiKey) {
      alert('API key is missing. Please set it in the settings.')
      return
    }

    // Reset state for new upload
    setUploading(true)
    setProgress(0)
    setMessage(null)
    setResponse(null)

    try {
      // Create a promise with timeout that will wait for either upload_complete or upload_error event
      const finalResponse = await new Promise<SproutUploadResponse>((resolve, reject) => {
        let completeUnlisten: Promise<() => void> | null = null
        let errorUnlisten: Promise<() => void> | null = null
        let timeoutId: NodeJS.Timeout | null = null

        const cleanup = async () => {
          if (timeoutId) clearTimeout(timeoutId)
          if (completeUnlisten) {
            try {
              const unsub = await completeUnlisten
              unsub()
            } catch (e) {
              console.warn('Failed to unsubscribe from upload_complete:', e)
            }
          }
          if (errorUnlisten) {
            try {
              const unsub = await errorUnlisten
              unsub()
            } catch (e) {
              console.warn('Failed to unsubscribe from upload_error:', e)
            }
          }
        }

        // Set up 45-minute timeout for large file uploads
        timeoutId = setTimeout(
          async () => {
            await cleanup()
            reject(
              'Upload timed out after 45 minutes. Please try again or check your network connection.'
            )
          },
          45 * 60 * 1000
        ) // 45 minutes

        // Listen for the upload_complete event and resolve with its payload
        completeUnlisten = listen('upload_complete', async event => {
          await cleanup()
          resolve(event.payload as SproutUploadResponse)
        })

        // Listen for the upload_error event and reject with its payload
        errorUnlisten = listen('upload_error', async event => {
          await cleanup()
          reject(event.payload)
        })

        // Invoke the Rust backend command to start the upload
        invoke('upload_video', {
          filePath: selectedFile,
          apiKey: apiKey,
          folderId: selectedFolder
        }).catch(async error => {
          await cleanup()
          reject(error)
        })
      })

      // Update the state with the final response from the backend upload
      setResponse(finalResponse)
      appStore.getState().setLatestSproutUpload(finalResponse)
      console.log('Upload completed with response:', finalResponse)
    } catch (error) {
      // Log and display any error encountered during the upload process
      console.error('Upload error:', error)

      // Provide more specific error messages based on error type
      let errorMessage = 'Upload failed: '
      if (typeof error === 'string') {
        if (error.includes('timed out')) {
          errorMessage +=
            'The upload timed out. This can happen with very large files or slow network connections. Please try again.'
        } else if (error.includes('network') || error.includes('connection')) {
          errorMessage +=
            'Network connection error. Please check your internet connection and try again.'
        } else {
          errorMessage += error
        }
      } else {
        errorMessage += String(error)
      }

      setMessage(errorMessage)
      alert(errorMessage)
    } finally {
      // Regardless of success or failure, mark the upload as finished
      setUploading(false)
    }
  }

  return (
    <>
      <div className="w-full pb-4 border-b mb-4">
        <h2 className="px-4 text-2xl font-semibold flex flex-row items-center gap-4">
          <Sprout />
          Upload to SproutVideo
        </h2>
        <div className="px-4 mx-4">
          <div className="flex flex-col items-center space-y-4 mt-4">
            {/* <div className="flex gap-4 mx-auto items-center">
            <h3>Select a Folder</h3>
            {rootFolders.map(folder => (
              <FolderTreeNavigator key={folder.id} apiKey={apiKey} />
            ))}
          </div> */}

            <div>
              <Button onClick={selectFile} className="w-full mb-4">
                Select Video File
              </Button>
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedFile.split('/').pop()}
                </p>
              )}

              {uploading && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Uploading: {progress}%</p>
                  <Progress value={progress} />
                </div>
              )}
              <Button
                onClick={uploadFile}
                className="w-full mt-4"
                disabled={!selectedFile || !apiKey || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </Button>

              {message && (
                <div className="mt-4 p-3 rounded-md bg-red-100 text-red-800 border border-red-200">
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full py-4 mb-4 px-4 mx-4">
        {/* Display uploaded video */}
        {response ? (
          <div className="uploaded-clip flex flex-row items-center justify-evenly gap-8">
            <div className="border drop-shadow-xl">
              <ExternalLink url={`https://sproutvideo.com/videos/${response.id}`}>
                {/* Conditionally render placeholder until the image loads */}
                {!thumbnailLoaded && (
                  <div
                    style={{
                      width: '300px',
                      height: 'auto',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Loading thumbnail...
                  </div>
                )}
                <img
                  // Append the refreshTimestamp as a query param to force re-fetching
                  src={`${response.assets.poster_frames[0]}?t=${refreshTimestamp}`}
                  alt="Video posterframe"
                  onLoad={() => setThumbnailLoaded(true)}
                  // Hide the image until it's loaded
                  style={{
                    display: thumbnailLoaded ? 'block' : 'none',
                    width: '350px'
                  }}
                />
              </ExternalLink>
            </div>
            <div>
              <p className="font-semibold text-xl">{response.title}</p>
              <FormattedDate dateString={response.created_at} />

              <p>{response.duration}</p>
              <EmbedCodeInput embedCode={response.embed_code} />
              <p>{response.embedded_url}</p>
            </div>
          </div>
        ) : (
          ''
        )}
      </div>
    </>
  )
}

export default UploadSprout
