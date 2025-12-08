import { Button } from '@components/ui/button'
import { Progress } from '@components/ui/progress'
import { useSproutVideoApiKey } from 'hooks/useApiKeys'
import { useBreadcrumb } from 'hooks/useBreadcrumb'
import { useFileUpload } from 'hooks/useFileUpload'
import { useImageRefresh } from 'hooks/useImageRefresh'
import { useUploadEvents } from 'hooks/useUploadEvents'
import { Sprout } from 'lucide-react'
import React from 'react'
import ExternalLink from 'utils/ExternalLink'
import FormattedDate from 'utils/FormattedDate'
import EmbedCodeInput from '../utils/EmbedCodeInput'

const UploadSprout = () => {
  // Custom hooks
  const { apiKey, isLoading: apiKeyLoading } = useSproutVideoApiKey()
  const { progress, uploading, message, setProgress, setMessage, setUploading } =
    useUploadEvents()
  const { selectedFile, response, selectFile, uploadFile } = useFileUpload()
  const { thumbnailLoaded, refreshTimestamp, setThumbnailLoaded } =
    useImageRefresh(response)

  // Page label - shadcn breadcrumb component
  useBreadcrumb([
    { label: 'Upload content', href: '/upload/sprout' },
    { label: 'Sprout video' }
  ])

  // Handle upload with API key
  const handleUpload = () => {
    // Reset progress and message before starting upload
    setProgress(0)
    setMessage(null)
    setUploading(true)
    uploadFile(apiKey)
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
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.split('/').pop()}
                </p>
              )}

              {uploading && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Uploading: {progress}%
                  </p>
                  <Progress value={progress} />
                </div>
              )}
              <Button
                onClick={handleUpload}
                className="w-full mt-4"
                disabled={!selectedFile || !apiKey || uploading || apiKeyLoading}
              >
                {uploading
                  ? 'Uploading...'
                  : apiKeyLoading
                    ? 'Loading...'
                    : 'Upload Video'}
              </Button>

              {message && (
                <div
                  className={`mt-4 p-3 rounded-md border ${
                    message.toLowerCase().includes('success')
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                >
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
