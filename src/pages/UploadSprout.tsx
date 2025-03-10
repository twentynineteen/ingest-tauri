import { Button } from '@components/components/ui/button'
import { Progress } from '@components/components/ui/progress'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event' // Import event listener
import { open } from '@tauri-apps/plugin-dialog'
import React, { useEffect, useState } from 'react'
import { loadApiKey } from '../utils/storage'

const UploadSprout = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [response, setResponse] = useState<string | null>(null)

  // Load API key when component mounts
  useEffect(() => {
    const fetchApiKey = async () => {
      const key = await loadApiKey()
      setApiKey(key)
    }
    fetchApiKey()
  }, [])

  // Listen for upload progress events
  useEffect(() => {
    console.log('Setting up event listeners...')

    const unlistenProgress = listen('upload_progress', event => {
      console.log('Received progress event:', event.payload) // Log event data
      setProgress(event.payload as number)
    })

    const unlistenComplete = listen('upload_complete', event => {
      console.log('Received upload complete event:', event.payload) // Log event data
      setMessage(event.payload as string)
      setUploading(false)
    })

    const unlistenError = listen('upload_error', event => {
      console.log('Received upload error event:', event.payload) // Log event data
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
    if (!selectedFile) {
      alert('Please select a video file.')
      return
    }
    if (!apiKey) {
      alert('API key is missing. Please set it in the settings.')
      return
    }

    setUploading(true)
    setProgress(0)
    setMessage(null)

    console.log('Starting upload...') // Log upload start

    try {
      const response = await invoke('upload_video', {
        filePath: selectedFile,
        apiKey: apiKey
      })
      console.log(response)

      console.log('Upload invoked!') // Log when Rust command is called
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error}`)
      setUploading(false)
    } finally {
      // setProgress(0)
      setResponse(response as string)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Upload Video</h2>

      <Button onClick={selectFile} className="w-full mb-4">
        Select Video File
      </Button>

      {selectedFile && (
        <p className="text-sm text-gray-600">Selected: {selectedFile.split('/').pop()}</p>
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
      <div className="message text-center pt-3">{message ? message : ''}</div>
      <div className="message text-center pt-3">{response ? response : ''}</div>
    </div>
  )
}

export default UploadSprout
