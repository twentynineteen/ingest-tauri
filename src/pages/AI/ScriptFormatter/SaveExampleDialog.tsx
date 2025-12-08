/**
 * SaveExampleDialog Component
 * Modal dialog for saving formatted scripts as RAG examples
 */

import { AlertCircle } from 'lucide-react'
import React, { useState } from 'react'
import { ExampleCategory } from '../../../types/exampleEmbeddings'

interface SaveExampleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    title: string,
    category: ExampleCategory,
    qualityScore: number
  ) => Promise<void>
  defaultTitle: string
}

export function SaveExampleDialog({
  isOpen,
  onClose,
  onSave,
  defaultTitle
}: SaveExampleDialogProps) {
  const [title, setTitle] = useState(defaultTitle)
  const [category, setCategory] = useState<ExampleCategory>(ExampleCategory.USER_CUSTOM)
  const [qualityScore, setQualityScore] = useState(4)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (title.length > 200) {
      setError('Title must be 200 characters or less')
      return
    }

    setIsSaving(true)

    try {
      await onSave(title.trim(), category, qualityScore)
      onClose()
      // Reset form
      setTitle(defaultTitle)
      setCategory(ExampleCategory.USER_CUSTOM)
      setQualityScore(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save example')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Save as Example</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Input */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-info"
                placeholder="e.g., Educational Lecture - Business School"
                maxLength={200}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/200 characters
              </p>
            </div>

            {/* Category Select */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Category <span className="text-destructive">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value as ExampleCategory)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-info"
                disabled={isSaving}
              >
                <option value={ExampleCategory.EDUCATIONAL}>Educational</option>
                <option value={ExampleCategory.BUSINESS}>Business</option>
                <option value={ExampleCategory.NARRATIVE}>Narrative</option>
                <option value={ExampleCategory.INTERVIEW}>Interview</option>
                <option value={ExampleCategory.DOCUMENTARY}>Documentary</option>
                <option value={ExampleCategory.USER_CUSTOM}>User Custom</option>
              </select>
            </div>

            {/* Quality Score */}
            <div>
              <label
                htmlFor="quality"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Quality Score
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="quality"
                  type="range"
                  min="1"
                  max="5"
                  value={qualityScore}
                  onChange={e => setQualityScore(Number(e.target.value))}
                  className="flex-1"
                  disabled={isSaving}
                />
                <span className="text-sm font-medium w-12 text-right">
                  {qualityScore}/5
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Higher quality examples are prioritized in RAG searches
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Info Message */}
            <div className="p-3 bg-info/10 border border-info/20 rounded-md">
              <p className="text-xs text-info">
                This will save both the original and formatted versions of your script.
                The formatted version will be used to match similar content in future RAG
                searches.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm text-foreground border border-input rounded-md hover:bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-info text-info-foreground rounded-md hover:bg-info/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Example'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
