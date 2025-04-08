import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@components/components/ui/accordion'
import React from 'react'

interface VideoInfoAccordionProps {
  title: string
  duration: string
  uploaded: string
  thumbnail?: string
  url: string
}

const VideoInfoAccordion: React.FC<VideoInfoAccordionProps> = ({
  title,
  duration,
  uploaded,
  thumbnail,
  url
}) => {
  return (
    <AccordionItem value="videoinfo">
      <AccordionTrigger className="font-semibold">Video Info</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Title:</span> {title}
          </p>
          <p>
            <span className="font-medium text-foreground">Duration:</span> {duration}
          </p>
          <p>
            <span className="font-medium text-foreground">Uploaded:</span> {uploaded}
          </p>
          {thumbnail && (
            <img
              src={thumbnail}
              alt="Thumbnail"
              className="mt-2 max-w-xs rounded border"
            />
          )}
          <p>
            <span className="font-medium text-foreground">URL:</span>{' '}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Open Video
            </a>
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default VideoInfoAccordion
