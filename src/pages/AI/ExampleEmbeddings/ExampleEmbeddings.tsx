/**
 * ExampleEmbeddings Page
 * Feature: 007-frontend-script-example
 *
 * Main page for managing AI script example embeddings
 */

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { useExampleManagement } from '@/hooks/useExampleManagement'
import type { ExampleCategory, ExampleSource } from '@/types/exampleEmbeddings'
import { Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DeleteConfirm } from './DeleteConfirm'
import { ExampleList } from './ExampleList'
import { UploadDialog } from './UploadDialog'
import { ViewExampleDialog } from './ViewExampleDialog'

export function ExampleEmbeddings() {
  // Breadcrumb for navigation
  useBreadcrumb([
    { label: 'AI Tools', href: '/ai-tools' },
    { label: 'Example Embeddings', href: '/ai-tools/example-embeddings' }
  ])

  const { examples, isLoading, deleteExample, uploadExample } = useExampleManagement()

  // Local state
  const [filterSource, setFilterSource] = useState<ExampleSource | 'all'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  // Filter examples by source
  const filteredExamples =
    filterSource === 'all' ? examples : examples.filter(ex => ex.source === filterSource)

  // Count by source
  const bundledCount = examples.filter(ex => ex.source === 'bundled').length
  const uploadedCount = examples.filter(ex => ex.source === 'user-uploaded').length

  // Handle delete
  const handleDeleteClick = (id: string) => {
    setSelectedExampleId(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedExampleId) return

    try {
      await deleteExample.mutateAsync(selectedExampleId)
      toast.success('Example deleted', {
        description: 'The example has been removed from your library.'
      })
      setDeleteDialogOpen(false)
      setSelectedExampleId(null)
    } catch (error) {
      toast.error('Delete failed', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Handle upload
  const handleUpload = async (data: {
    beforeContent: string
    afterContent: string
    metadata: {
      title: string
      category: ExampleCategory
      tags?: string[]
      qualityScore?: number
    }
    embedding: number[]
  }) => {
    await uploadExample.mutateAsync({
      beforeContent: data.beforeContent,
      afterContent: data.afterContent,
      metadata: {
        title: data.metadata.title,
        category: data.metadata.category,
        tags: data.metadata.tags,
        qualityScore: data.metadata.qualityScore
      },
      embedding: data.embedding
    })
  }

  // Handle replace (TODO: implement)
  const handleReplaceClick = (id: string) => {
    console.log('Replace example:', id)
    toast.info('Coming soon', {
      description: 'Replace functionality will be implemented in a future update.'
    })
  }

  // Handle view
  const handleViewClick = (id: string) => {
    setSelectedExampleId(id)
    setViewDialogOpen(true)
  }

  const selectedExample = examples.find(ex => ex.id === selectedExampleId)

  return (
    <div className="container mx-auto space-y-6 px-6">
      {/* Header */}
      <div className="w-full pb-4 border-b mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex flex-row gap-4 items-center">
            Example Embeddings
          </h2>
          <p className="mt-2 text-muted-foreground">
            Manage script examples for AI-powered autocue formatting.{' '}
          </p>
          <p className="mt-2 text-muted-foreground">
            Upload your own examples or use bundled templates.
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Example
        </Button>
      </div>

      {/* Tabs for filtering */}
      <Tabs
        value={filterSource}
        onValueChange={value => setFilterSource(value as typeof filterSource)}
      >
        <TabsList>
          <TabsTrigger value="all">All ({examples.length})</TabsTrigger>
          <TabsTrigger value="bundled">Bundled ({bundledCount})</TabsTrigger>
          <TabsTrigger value="user-uploaded">Uploaded ({uploadedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ExampleList
            examples={filteredExamples}
            isLoading={isLoading}
            onDelete={handleDeleteClick}
            onReplace={handleReplaceClick}
            onView={handleViewClick}
          />
        </TabsContent>

        <TabsContent value="bundled" className="mt-6">
          <ExampleList
            examples={filteredExamples}
            isLoading={isLoading}
            onDelete={handleDeleteClick}
            onReplace={handleReplaceClick}
            onView={handleViewClick}
          />
        </TabsContent>

        <TabsContent value="user-uploaded" className="mt-6">
          <ExampleList
            examples={filteredExamples}
            isLoading={isLoading}
            onDelete={handleDeleteClick}
            onReplace={handleReplaceClick}
            onView={handleViewClick}
          />
        </TabsContent>
      </Tabs>

      {/* View example dialog */}
      <ViewExampleDialog
        open={viewDialogOpen}
        example={selectedExample || null}
        onClose={() => {
          setViewDialogOpen(false)
          setSelectedExampleId(null)
        }}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirm
        open={deleteDialogOpen}
        exampleTitle={selectedExample?.title || 'this example'}
        isDeleting={deleteExample.isPending}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Upload dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}
