/**
 * ViewExampleDialog Component
 * Feature: 007-frontend-script-example
 *
 * Modal dialog for viewing full script example content
 */

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ExampleWithMetadata } from '@/types/exampleEmbeddings'
import { FileText } from 'lucide-react'

interface ViewExampleDialogProps {
  open: boolean
  example: ExampleWithMetadata | null
  onClose: () => void
}

export function ViewExampleDialog({ open, example, onClose }: ViewExampleDialogProps) {
  if (!example) return null

  const isUserUploaded = example.source === 'user-uploaded'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {example.title}
          </DialogTitle>

          <div className="flex items-center gap-3 mt-2">
            <DialogDescription className="flex-1">
              {example.category}
              {example.wordCount && ` • ${example.wordCount} words`}
              {example.qualityScore && ` • Quality: ${example.qualityScore}/5`}
            </DialogDescription>
            <Badge variant={isUserUploaded ? 'default' : 'secondary'} className="shrink-0">
              {isUserUploaded ? 'Uploaded' : 'Bundled'}
            </Badge>
          </div>

          {example.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {example.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="before" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="before">Original Script</TabsTrigger>
            <TabsTrigger value="after">Formatted Script</TabsTrigger>
          </TabsList>

          <TabsContent
            value="before"
            className="flex-1 overflow-y-auto mt-4 pr-4"
          >
            <div className="rounded-md border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {example.beforeText}
              </pre>
            </div>
          </TabsContent>

          <TabsContent
            value="after"
            className="flex-1 overflow-y-auto mt-4 pr-4"
          >
            <div className="rounded-md border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {example.afterText}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
