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
import { save } from '@tauri-apps/plugin-dialog'
import { mkdir, writeTextFile } from '@tauri-apps/plugin-fs'
import { Download, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DeleteConfirm } from './DeleteConfirm'
import { ExampleList } from './ExampleList'
import { ReplaceDialog } from './ReplaceDialog'
import { UploadDialog } from './UploadDialog'
import { ViewExampleDialog } from './ViewExampleDialog'

export function ExampleEmbeddings() {
  // Breadcrumb for navigation
  useBreadcrumb([
    { label: 'AI Tools', href: '/ai-tools' },
    { label: 'Example Embeddings', href: '/ai-tools/example-embeddings' }
  ])

  const { examples, isLoading, deleteExample, uploadExample, replaceExample } =
    useExampleManagement()

  // Local state
  const [filterSource, setFilterSource] = useState<ExampleSource | 'all'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
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

  // Handle replace
  const handleReplaceClick = (id: string) => {
    setSelectedExampleId(id)
    setReplaceDialogOpen(true)
  }

  const handleReplace = async (data: {
    id: string
    beforeContent: string
    afterContent: string
    embedding: number[]
  }) => {
    await replaceExample.mutateAsync({
      id: data.id,
      request: {
        beforeContent: data.beforeContent,
        afterContent: data.afterContent,
        embedding: data.embedding
      }
    })
  }

  // Handle view
  const handleViewClick = (id: string) => {
    setSelectedExampleId(id)
    setViewDialogOpen(true)
  }

  // Handle download individual example
  const handleDownloadClick = async (id: string) => {
    const example = examples.find(ex => ex.id === id)
    if (!example) return

    try {
      // Let user select a folder
      const folderPath = await save({
        defaultPath: example.title.replace(/[^a-z0-9\s-]/gi, '_'),
        filters: [
          {
            name: 'Folder',
            extensions: ['']
          }
        ]
      })

      if (folderPath) {
        // Create folder by saving a file into it, then save both files
        const basePath = folderPath

        // Write before.txt
        await writeTextFile(`${basePath}/before.txt`, example.beforeText)

        // Write after.txt
        await writeTextFile(`${basePath}/after.txt`, example.afterText)

        toast.success('Download successful', {
          description: `${example.title} saved as before.txt and after.txt`
        })
      }
    } catch (error) {
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Handle bulk download all examples
  const handleDownloadAll = async () => {
    if (filteredExamples.length === 0) {
      toast.error('No examples to download')
      return
    }

    try {
      // Let user select a parent folder for all examples
      const parentFolderPath = await save({
        defaultPath: `script_examples_${new Date().toISOString().split('T')[0]}`,
        filters: [
          {
            name: 'Folder',
            extensions: ['']
          }
        ]
      })

      if (parentFolderPath) {
        // Create parent folder first
        await mkdir(parentFolderPath, { recursive: true })

        // Create a folder for each example
        for (const example of filteredExamples) {
          const folderName = example.title.replace(/[^a-z0-9\s-]/gi, '_')
          const examplePath = `${parentFolderPath}/${folderName}`

          // Create example folder
          await mkdir(examplePath, { recursive: true })

          // Write before.txt
          await writeTextFile(`${examplePath}/before.txt`, example.beforeText)

          // Write after.txt
          await writeTextFile(`${examplePath}/after.txt`, example.afterText)
        }

        toast.success('Download successful', {
          description: `${filteredExamples.length} example${filteredExamples.length > 1 ? 's' : ''} downloaded to separate folders.`
        })
      }
    } catch (error) {
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadAll}>
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Example
          </Button>
        </div>
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
            onDownload={handleDownloadClick}
          />
        </TabsContent>

        <TabsContent value="bundled" className="mt-6">
          <ExampleList
            examples={filteredExamples}
            isLoading={isLoading}
            onDelete={handleDeleteClick}
            onReplace={handleReplaceClick}
            onView={handleViewClick}
            onDownload={handleDownloadClick}
          />
        </TabsContent>

        <TabsContent value="user-uploaded" className="mt-6">
          <ExampleList
            examples={filteredExamples}
            isLoading={isLoading}
            onDelete={handleDeleteClick}
            onReplace={handleReplaceClick}
            onView={handleViewClick}
            onDownload={handleDownloadClick}
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

      {/* Replace example dialog */}
      <ReplaceDialog
        open={replaceDialogOpen}
        example={selectedExample || null}
        onClose={() => {
          setReplaceDialogOpen(false)
          setSelectedExampleId(null)
        }}
        onReplace={handleReplace}
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
