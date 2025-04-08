import { Accordion } from '@components/components/ui/accordion'
import React from 'react'
import { VideoInfoData } from 'src/hooks/useVideoInfoBlock'
import BreadcrumbsAccordionItem from './BreadcrumbsAccordionItem'
import DescriptionAccordionItem from './DescriptionAccordionItem'
import VideoInfoAccordionItem from './VideoInfoAccordionItem'

interface Props {
  description: string
  breadcrumbsData?: any
  breadcrumbsBlock?: string
  videoInfoBlock?: string
  videoInfoData?: VideoInfoData | null
}

const CardDetailsAccordion: React.FC<Props> = ({
  description,
  breadcrumbsData,
  breadcrumbsBlock,
  videoInfoBlock,
  videoInfoData
}) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <DescriptionAccordionItem description={description} />
      {breadcrumbsBlock && <BreadcrumbsAccordionItem data={breadcrumbsData} />}
      {videoInfoBlock && videoInfoData && <VideoInfoAccordionItem data={videoInfoData} />}
    </Accordion>
  )
}

export default CardDetailsAccordion
