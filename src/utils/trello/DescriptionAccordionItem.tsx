import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@components/ui/accordion'
import React from 'react'

interface Props {
  description: string
}

const DescriptionAccordionItem: React.FC<Props> = ({ description }) => {
  return (
    <AccordionItem value="description">
      <AccordionTrigger className="focus:outline-hidden focus-visible:outline-hidden">
        Description
      </AccordionTrigger>
      <AccordionContent>
        <div className="max-h-48 w-[460px] overflow-auto rounded border bg-muted p-3 text-sm whitespace-pre-wrap break-words focus:outline-hidden focus-visible:outline-hidden">
          {description.trim() || 'No description.'}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default DescriptionAccordionItem
