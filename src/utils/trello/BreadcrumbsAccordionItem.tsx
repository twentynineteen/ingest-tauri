import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@components/ui/accordion'
import { format, parse } from 'date-fns'
import React from 'react'
import { Breadcrumb } from 'utils/types'
import FileList from './FileList'
import KeyValueRow from './KeyValueRow'

interface Props {
  data: Breadcrumb
}

const BreadcrumbsAccordionItem: React.FC<Props> = ({ data }) => {
  if (!data) return null

  return (
    <AccordionItem value="breadcrumbs">
      <AccordionTrigger className="font-semibold">Breadcrumbs</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          {data.projectTitle && (
            <KeyValueRow label="Project Title" value={data.projectTitle} />
          )}
          {data.createdBy && <KeyValueRow label="Created By" value={data.createdBy} />}
          {data.creationDateTime && (
            <KeyValueRow
              label="Created On"
              value={format(
                parse(data.creationDateTime, 'dd/MM/yyyy, HH:mm:ss', new Date()),
                'PPPpp'
              )}
            />
          )}
          {data.parentFolder && <KeyValueRow label="Folder" value={data.parentFolder} />}
          {data.files && <FileList files={data.files} />}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default BreadcrumbsAccordionItem
