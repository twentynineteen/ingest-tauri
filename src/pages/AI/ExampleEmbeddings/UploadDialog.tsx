/**
 * UploadDialog Component
 * Feature: 007-frontend-script-example
 *
 * Modal dialog for uploading new script examples
 * Supports both .txt and .docx files
 */

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useDocxParser } from '@/hooks/useDocxParser'
import { useOllamaEmbedding } from '@/hooks/useOllamaEmbedding'
import { ExampleCategory, type ExampleMetadata } from '@/types/exampleEmbeddings'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  onUpload: (data: UploadData) => Promise<void>
}

interface UploadData {
  beforeContent: string
  afterContent: string
  metadata: ExampleMetadata
  embedding: number[]
}

export function UploadDialog({ open, onClose, onUpload }: UploadDialogProps) {
  const { parseFile: parseDocx, isLoading: isParsingDocx } = useDocxParser()
  const {
    embed,
    isReady: isModelReady,
    isLoading: isCheckingModel,
    error: modelError,
    modelName
  } = useOllamaEmbedding()

  // Form state
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ExampleCategory>(ExampleCategory.USER_CUSTOM)
  const [tags, setTags] = useState<string[]>([])
  const [qualityScore, setQualityScore] = useState<number>(3)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedTitle, setUploadedTitle] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle file selection
  const handleBeforeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setBeforeFile(file)
    if (file) {
      setErrors(prev => ({ ...prev, beforeFile: '' }))
    }
  }

  const handleAfterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setAfterFile(file)
    if (file) {
      setErrors(prev => ({ ...prev, afterFile: '' }))
    }
  }

  // Handle tags input
  const handleTagsChange = (value: string) => {
    const tagArray = value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    setTags(tagArray)
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!beforeFile) {
      newErrors.beforeFile = 'Original script file is required'
    }
    if (!afterFile) {
      newErrors.afterFile = 'Formatted script file is required'
    }
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Parse file content (supports both .txt and .docx)
  const parseFileContent = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.docx')) {
      // Parse .docx file using mammoth
      const document = await parseDocx(file)
      return document.textContent
    } else if (fileName.endsWith('.txt')) {
      // Read .txt file directly
      return await file.text()
    } else {
      throw new Error('File must be .txt or .docx format')
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Validation failed', {
        description: 'Please correct the errors in the form'
      })
      return
    }

    if (!beforeFile || !afterFile) return

    setIsUploading(true)

    try {
      // Parse file contents (supports both .txt and .docx)
      const beforeContent = await parseFileContent(beforeFile)
      const afterContent = await parseFileContent(afterFile)

      // Validate content length
      if (beforeContent.trim().length < 50) {
        throw new Error('Original script is too short (minimum 50 characters)')
      }

      if (afterContent.trim().length < 50) {
        throw new Error('Formatted script is too short (minimum 50 characters)')
      }

      if (beforeContent.trim().length > 100_000) {
        throw new Error('Original script is too long (maximum 100,000 characters)')
      }

      if (afterContent.trim().length > 100_000) {
        throw new Error('Formatted script is too long (maximum 100,000 characters)')
      }

      // Generate embedding from before content
      setIsGeneratingEmbedding(true)
      let embedding: number[]
      try {
        embedding = await embed(beforeContent)
      } catch (embedError) {
        setIsGeneratingEmbedding(false)
        throw new Error(
          'Failed to generate embedding. ' +
            (embedError instanceof Error ? embedError.message : String(embedError))
        )
      } finally {
        setIsGeneratingEmbedding(false)
      }

      if (!embedding || embedding.length === 0) {
        throw new Error('Failed to generate embedding: empty result')
      }

      // Prepare metadata
      const metadata: ExampleMetadata = {
        title: title.trim(),
        category,
        tags: tags.length > 0 ? tags : undefined,
        qualityScore: qualityScore || undefined
      }

      // Upload
      try {
        await onUpload({
          beforeContent,
          afterContent,
          metadata,
          embedding
        })

        // Show success state
        setUploadedTitle(title.trim())
        setUploadSuccess(true)

        toast.success('Example uploaded', {
          description: 'Your script example has been added successfully.'
        })
      } catch (uploadError) {
        throw new Error(
          'Failed to upload example. ' +
            (uploadError instanceof Error ? uploadError.message : String(uploadError))
        )
      }
    } catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setIsUploading(false)
      setIsGeneratingEmbedding(false)
    }
  }

  const isLoading = isGeneratingEmbedding || isUploading || isParsingDocx
  const canUpload = isModelReady && !isLoading

  // Handle closing dialog
  const handleClose = () => {
    setUploadSuccess(false)
    setUploadedTitle('')
    setBeforeFile(null)
    setAfterFile(null)
    setTitle('')
    setCategory(ExampleCategory.USER_CUSTOM)
    setTags([])
    setQualityScore(3)
    setErrors({})
    onClose()
  }

  // Handle upload another
  const handleUploadAnother = () => {
    setUploadSuccess(false)
    setUploadedTitle('')
    setBeforeFile(null)
    setAfterFile(null)
    setTitle('')
    setCategory(ExampleCategory.USER_CUSTOM)
    setTags([])
    setQualityScore(3)
    setErrors({})
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {uploadSuccess ? (
          // Success state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Upload Successful!
              </DialogTitle>
              <DialogDescription>
                Your script example has been added to the library.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-900">Uploaded Example</p>
                <p className="text-lg font-semibold text-green-700 mt-1">{uploadedTitle}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  ✓ Example added to the database
                </p>
                <p className="text-sm text-muted-foreground">
                  ✓ Available for AI-powered script formatting
                </p>
                <p className="text-sm text-muted-foreground">
                  ✓ List will update automatically when you close this dialog
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button type="button" onClick={handleUploadAnother}>
                Upload Another
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Upload form
          <>
            <DialogHeader>
              <DialogTitle>Upload Script Example</DialogTitle>
              <DialogDescription>
                Add a new script example to improve AI formatting suggestions. Supports .txt and
                .docx files.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Model availability status */}
            <div
              className={`rounded-md border p-3 ${
                isCheckingModel
                  ? 'border-blue-200 bg-blue-50'
                  : isModelReady
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {isCheckingModel ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">Checking embedding model...</span>
                  </>
                ) : isModelReady ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Embedding model ready: <code className="font-mono">{modelName}</code>
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700">Embedding model not available</p>
                      {modelError && (
                        <p className="text-xs text-red-600 mt-1">{modelError.message}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Before file picker */}
            <div>
              <Label htmlFor="before-file">Original Script (.txt or .docx)</Label>
              <Input
                id="before-file"
                type="file"
                accept=".txt,.docx"
                onChange={handleBeforeFileChange}
                disabled={isLoading}
              />
              {beforeFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {beforeFile.name} ({(beforeFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
              {errors.beforeFile && (
                <p className="text-sm text-destructive mt-1">{errors.beforeFile}</p>
              )}
            </div>

            {/* After file picker */}
            <div>
              <Label htmlFor="after-file">Formatted Script (.txt or .docx)</Label>
              <Input
                id="after-file"
                type="file"
                accept=".txt,.docx"
                onChange={handleAfterFileChange}
                disabled={isLoading}
              />
              {afterFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {afterFile.name} ({(afterFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
              {errors.afterFile && (
                <p className="text-sm text-destructive mt-1">{errors.afterFile}</p>
              )}
            </div>

            {/* Title input */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Tech Conference Keynote"
                disabled={isLoading}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>

            {/* Category select */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={value => setCategory(value as ExampleCategory)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ExampleCategory.EDUCATIONAL}>Educational</SelectItem>
                  <SelectItem value={ExampleCategory.BUSINESS}>Business</SelectItem>
                  <SelectItem value={ExampleCategory.NARRATIVE}>Narrative</SelectItem>
                  <SelectItem value={ExampleCategory.INTERVIEW}>Interview</SelectItem>
                  <SelectItem value={ExampleCategory.DOCUMENTARY}>Documentary</SelectItem>
                  <SelectItem value={ExampleCategory.USER_CUSTOM}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags input */}
            <div>
              <Label htmlFor="tags">Tags (optional, comma-separated)</Label>
              <Input
                id="tags"
                value={tags.join(', ')}
                onChange={e => handleTagsChange(e.target.value)}
                placeholder="technical, formal, presentation"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate tags with commas (max 10 tags)
              </p>
            </div>

            {/* Quality score */}
            <div>
              <Label htmlFor="quality">Quality Score (1-5)</Label>
              <Input
                id="quality"
                type="number"
                min={1}
                max={5}
                value={qualityScore}
                onChange={e => setQualityScore(Number(e.target.value))}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Higher scores will prioritize this example in AI suggestions
              </p>
            </div>
          </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canUpload}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isParsingDocx
                    ? 'Parsing Document...'
                    : isGeneratingEmbedding
                      ? 'Generating Embedding...'
                      : isUploading
                        ? 'Uploading...'
                        : !isModelReady
                          ? 'Model Not Ready'
                          : 'Upload'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
