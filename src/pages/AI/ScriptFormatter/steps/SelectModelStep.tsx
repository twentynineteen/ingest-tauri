/**
 * SelectModelStep Component
 * Step 2: AI Provider and Model Selection
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Database, Sparkles } from 'lucide-react'
import React from 'react'
import type { ExampleWithMetadata } from '../../../../types/exampleEmbeddings'
import type {
  AIModel,
  AIProvider,
  ProviderConfiguration,
  ScriptDocument
} from '../../../../types/scriptFormatter'
import { ExampleToggleList } from '../ExampleToggleList'
import { ModelSelector } from '../ModelSelector'
import { ProviderSelector } from '../ProviderSelector'

interface SelectModelStepProps {
  document: ScriptDocument | null
  activeProvider: AIProvider | null
  availableProviders: AIProvider[]
  models: AIModel[]
  selectedModelId: string | null
  isLoadingModels: boolean
  isValidatingProvider: boolean
  isEmbeddingLoading: boolean
  isEmbeddingReady: boolean
  embeddingError: Error | null
  allExamples: ExampleWithMetadata[]
  enabledExampleIds: Set<string>
  isLoadingExamples: boolean
  onProviderSelect: (providerId: string) => void
  onProviderValidate: (providerId: string, config: ProviderConfiguration) => void
  onModelSelect: (modelId: string) => void
  onExampleToggle: (exampleId: string) => void
  onFormatScript: () => void
}

export const SelectModelStep: React.FC<SelectModelStepProps> = ({
  document,
  activeProvider,
  availableProviders,
  models,
  selectedModelId,
  isLoadingModels,
  isValidatingProvider,
  isEmbeddingLoading,
  isEmbeddingReady,
  embeddingError,
  allExamples,
  enabledExampleIds,
  isLoadingExamples,
  onProviderSelect,
  onProviderValidate,
  onModelSelect,
  onExampleToggle,
  onFormatScript
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* File uploaded confirmation */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          ✓ File uploaded: <strong>{document?.filename}</strong> ({document?.fileSize}{' '}
          bytes)
        </p>
      </div>

      {/* RAG/Embedding Status & Example Selection */}
      <Accordion
        type="multiple"
        defaultValue={['rag-status', 'example-selection']}
        className="space-y-4"
      >
        {/* RAG/Embedding Status */}
        <AccordionItem value="rag-status" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">RAG Enhancement Status</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <RAGStatusContent
              isLoading={isEmbeddingLoading}
              isReady={isEmbeddingReady}
              error={embeddingError}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Example Selection */}
        {isEmbeddingReady && allExamples.length > 0 && (
          <AccordionItem value="example-selection" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Select Examples to Use</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="text-xs text-gray-600 mb-3">
                Choose which examples the AI should reference when formatting your script.
                The system will automatically select the most relevant enabled examples.
              </p>
              <ExampleToggleList
                examples={allExamples}
                enabledIds={enabledExampleIds}
                onToggle={onExampleToggle}
                isLoading={isLoadingExamples}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Two-column grid for provider and model selection */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left column: AI Provider */}
        <div className="p-6 border border-gray-300 rounded-lg max-h-[200px] overflow-y-auto">
          <ProviderSelector
            providers={availableProviders}
            activeProvider={activeProvider}
            onSelect={onProviderSelect}
            onValidate={onProviderValidate}
            isValidating={isValidatingProvider}
          />
        </div>

        {/* Right column: Model Selector */}
        <div className="p-6 border border-gray-300 rounded-lg max-h-[200px] overflow-y-auto">
          {activeProvider?.status === 'configured' ? (
            <ModelSelector
              models={models}
              selectedModel={selectedModelId}
              onSelect={onModelSelect}
              isLoading={isLoadingModels}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-sm">Select and validate an AI provider to see models</p>
            </div>
          )}
        </div>
      </div>

      {/* Format button */}
      {selectedModelId && activeProvider?.status === 'configured' && (
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            onFormatScript()
          }}
          className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 mb-3"
        >
          <Sparkles className="h-5 w-5" />
          Format Script with AI
        </button>
      )}
    </div>
  )
}

// Sub-component for RAG status content
const RAGStatusContent: React.FC<{
  isLoading: boolean
  isReady: boolean
  error: Error | null
}> = ({ isLoading, isReady, error }) => {
  if (isLoading) {
    return (
      <p className="text-sm text-blue-600">
        Checking Ollama embedding model availability...
      </p>
    )
  }

  if (isReady) {
    return (
      <p className="text-sm text-green-600">
        ✓ RAG system ready (Ollama) - will use similar examples to improve formatting
      </p>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        <p className="font-medium">⚠ RAG system not available</p>
        <p className="text-xs mt-1">{error.message}</p>
        <p className="text-xs mt-1 text-gray-600">
          Will format without example guidance.
        </p>
      </div>
    )
  }

  return (
    <p className="text-sm text-gray-600">
      RAG system not available - will format without example guidance
    </p>
  )
}
