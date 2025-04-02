import { Button } from '@components/components/ui/button'
import { Progress } from '@components/components/ui/progress'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event' // Import event listener
import { open } from '@tauri-apps/plugin-dialog'
import { Sprout } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ExternalLink from 'src/utils/ExternalLink'
import FormattedDate from 'src/utils/FormattedDate'
import EmbedCodeInput from '../utils/EmbedCodeInput'
import { loadApiKeys } from '../utils/storage'
import FolderTreeNavigator from './FolderTreeNavigator'

type Props = {}

// Define an interface for folder data (adjust fields as needed)
export interface SproutFolder {
  id: string
  name: string
  parent_id: string | null // Null means a root folder
}

interface GetFoldersResponse {
  folders: SproutFolder[]
}

const UploadSprout = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [response, setResponse] = useState<SproutUploadResponse | null>(null)

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [rootFolders, setRootFolders] = useState<SproutFolder[]>([])
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false) // New state
  // State to force image refresh – we update this value every 60 seconds
  const [refreshTimestamp, setRefreshTimestamp] = useState<number>(Date.now())

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

  useEffect(() => {
    async function fetchRootFolders() {
      try {
        // Pass no parent_id to get the root folders.
        const result = await invoke<GetFoldersResponse>('get_folders', {
          apiKey,
          parent_id: null
        })
        setRootFolders(result.folders)
      } catch (error) {
        console.error('Error fetching root folders:', error)
      }
    }
    if (apiKey) {
      fetchRootFolders()
    }
  }, [apiKey])

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
      // Create a promise that will wait for either the upload_complete or upload_error event
      const finalResponse = await new Promise<SproutUploadResponse>((resolve, reject) => {
        // Listen for the upload_complete event and resolve with its payload
        const completeUnlisten = listen('upload_complete', event => {
          // Resolve the promise with the response from the backend
          resolve(event.payload as SproutUploadResponse)
          // Unsubscribe from this event once it's received
          completeUnlisten.then(unsub => unsub())
        })

        // Listen for the upload_error event and reject with its payload
        const errorUnlisten = listen('upload_error', event => {
          reject(event.payload)
          // Unsubscribe from this event once it's received
          errorUnlisten.then(unsub => unsub())
        })

        // Invoke the Rust backend command to start the upload.
        // Any error thrown here will be caught by the catch block below.
        invoke('upload_video', {
          filePath: selectedFile,
          apiKey: apiKey,
          folderId: selectedFolder
        }).catch(error => {
          // If invoke itself fails, reject the promise
          reject(error)
        })
      })

      // Update the state with the final response from the backend upload
      setResponse(finalResponse)
      console.log('Upload completed with response:', finalResponse)
    } catch (error) {
      // Log and display any error encountered during the upload process
      console.error('Upload error:', error)
      alert(`Upload failed: ${error}`)
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
