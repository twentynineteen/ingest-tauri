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
          {data.createdBy && (
            <KeyValueRow
              label="Created By"
              value={
                typeof data.createdBy === 'string'
                  ? data.createdBy
                  : data.createdBy?.data || 'Unknown User'
              }
            />
          )}
          {data.creationDateTime && (
            <KeyValueRow
              label="Created On"
              value={(() => {
                try {
                  // Try parsing as ISO string first (most common case)
                  const isoDate = new Date(data.creationDateTime)
                  if (!isNaN(isoDate.getTime())) {
                    return format(isoDate, 'PPPpp')
                  }

                  // Fallback to parsing with the old format
                  const parsedDate = parse(
                    data.creationDateTime,
                    'dd/MM/yyyy, HH:mm:ss',
                    new Date()
                  )
                  if (!isNaN(parsedDate.getTime())) {
                    return format(parsedDate, 'PPPpp')
                  }

                  // If all parsing fails, return the original string
                  return data.creationDateTime
                } catch {
                  return data.creationDateTime
                }
              })()}
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
