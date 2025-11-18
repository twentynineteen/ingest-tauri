/**
 * ScriptFormatter Page
 * Feature: 006-i-wish-to (T048)
 * Purpose: Main page orchestration for AI-powered autocue script formatting
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { useBreadcrumb } from '@hooks/index'
import { AlertCircle, Database, Download, FileText, Save, Sparkles } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
// Hooks
import { useAIModels } from '../../../hooks/useAIModels'
import { useAIProvider } from '../../../hooks/useAIProvider'
import { useDocxGenerator } from '../../../hooks/useDocxGenerator'
import { useDocxParser } from '../../../hooks/useDocxParser'
import { useExampleManagement } from '../../../hooks/useExampleManagement'
import { useOllamaEmbedding } from '../../../hooks/useOllamaEmbedding'
import { useScriptProcessor } from '../../../hooks/useScriptProcessor'
// Types
import {
  ExampleCategory,
  type ExampleMetadata,
  type UploadRequest
} from '../../../types/exampleEmbeddings'
import {
  STORAGE_KEYS,
  type ProcessedOutput,
  type ProviderConfiguration,
  type ScriptDocument
} from '../../../types/scriptFormatter'
// Components
import { DiffEditor } from './DiffEditor'
import { ExampleToggleList } from './ExampleToggleList'
import { FileUploader } from './FileUploader'
import { ModelSelector } from './ModelSelector'
import { ProviderSelector } from './ProviderSelector'
import { SaveExampleDialog } from './SaveExampleDialog'

type WorkflowStep = 'upload' | 'select-model' | 'processing' | 'review' | 'download'

/**
 * Converts markdown formatting to HTML
 */
function convertMarkdownToHtml(text: string): string {
  // Bold: **text** or __text__ -> <strong>text</strong>
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_ -> <em>text</em>
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  result = result.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')

  return result
}

/**
 * Restores cached output from localStorage
 */
function restoreCachedOutput(): ProcessedOutput | null {
  const savedOutput = localStorage.getItem(STORAGE_KEYS.PROCESSED_OUTPUT)
  if (!savedOutput) {
    console.log('[ScriptFormatter] No cached result found')
    return null
  }

  try {
    const output = JSON.parse(savedOutput)
    console.log('[ScriptFormatter] Restored cached result:', {
      formattedTextPreview: output.formattedText.substring(0, 100),
      timestamp: output.generationTimestamp,
      examplesCount: output.examplesCount
    })
    return output
  } catch (err) {
    console.warn('[ScriptFormatter] Failed to restore cached result:', err)
    localStorage.removeItem(STORAGE_KEYS.PROCESSED_OUTPUT)
    return null
  }
}

const ScriptFormatter: React.FC = () => {
  // Breadcrumb
  useBreadcrumb([
    { label: 'AI tools', href: '/ai-tools/script-formatter' },
    { label: 'Autocue script formatter' }
  ])

  // State
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload')
  const [document, setDocument] = useState<ScriptDocument | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [processedOutput, setProcessedOutput] = useState<ProcessedOutput | null>(null)
  const [modifiedText, setModifiedText] = useState<string>('')
  const [markdownText, setMarkdownText] = useState<string>('') // Keep markdown version for download
  const [examplesCount, setExamplesCount] = useState<number>(0)
  const [ragStatus, setRagStatus] = useState<string>('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [enabledExampleIds, setEnabledExampleIds] = useState<Set<string>>(new Set())
  const validatedProviderRef = useRef<string | null>(null)

  // Hooks
  const { parseFile, isLoading: isParsing, error: parseError } = useDocxParser()
  const { generateFile, isGenerating, error: generateError } = useDocxGenerator()
  const { activeProvider, availableProviders, switchProvider, validateProvider } =
    useAIProvider()
  const [isValidatingProvider, setIsValidatingProvider] = useState(false)

  const { models, isLoading: isLoadingModels } = useAIModels({
    providerId: activeProvider?.id || '',
    configuration: activeProvider?.configuration || {
      serviceUrl: '',
      connectionStatus: 'not-configured'
    },
    enabled: !!activeProvider && activeProvider.status === 'configured'
  })

  const {
    processScript,
    progress,
    error: processingError,
    cancel: cancelProcessing,
    isEmbeddingReady,
    isEmbeddingLoading,
    embeddingError
  } = useScriptProcessor()

  const {
    uploadExample,
    examples: allExamples,
    isLoading: isLoadingExamples
  } = useExampleManagement()
  const { embed: embedForSaving } = useOllamaEmbedding()

  // Initialize enabled examples when examples are loaded (all enabled by default)
  useEffect(() => {
    if (allExamples.length > 0 && enabledExampleIds.size === 0) {
      setEnabledExampleIds(new Set(allExamples.map(ex => ex.id)))
    }
  }, [allExamples, enabledExampleIds.size])

  // Restore session data from localStorage (initialize state)
  const [initialLoadDone] = useState(() => {
    const cachedOutput = restoreCachedOutput()
    if (cachedOutput) {
      setProcessedOutput(cachedOutput)
      setMarkdownText(cachedOutput.formattedText)
      setModifiedText(cachedOutput.formattedText)
      if (cachedOutput.examplesCount !== undefined) {
        setExamplesCount(cachedOutput.examplesCount)
      }
      setCurrentStep('review')
    }
    return true
  })

  // Suppress unused variable warning
  void initialLoadDone

  // Handlers
  const handleFileSelect = async (file: File) => {
    try {
      const parsed = await parseFile(file)
      setDocument(parsed)
      setCurrentStep('select-model')
    } catch (error) {
      console.error('Failed to parse file:', error)
    }
  }

  const handleProviderValidate = useCallback(
    async (providerId: string, config: ProviderConfiguration) => {
      setIsValidatingProvider(true)
      try {
        await validateProvider(providerId, config)
      } finally {
        setIsValidatingProvider(false)
      }
    },
    [validateProvider]
  )

  const handleFormatScript = async () => {
    console.log('handleFormatScript called', {
      document,
      selectedModelId,
      activeProvider
    })

    if (!document || !selectedModelId || !activeProvider) {
      console.warn('Missing required data:', {
        document,
        selectedModelId,
        activeProvider
      })
      return
    }

    // CRITICAL: Clear any cached results before processing new script
    localStorage.removeItem(STORAGE_KEYS.PROCESSED_OUTPUT)
    setProcessedOutput(null)
    setModifiedText('')
    setMarkdownText('')
    setRagStatus('')
    setExamplesCount(0)

    console.log('Setting step to processing...')
    setCurrentStep('processing')

    try {
      console.log(
        'Processing script with user input:',
        document.textContent.substring(0, 200) + '...'
      )

      const output = await processScript({
        text: document.textContent,
        modelId: selectedModelId,
        providerId: activeProvider.id,
        configuration: activeProvider.configuration,
        enabledExampleIds: enabledExampleIds,
        onProgress: prog => console.log(`Progress: ${prog}%`),
        onRAGUpdate: (status, count) => {
          setRagStatus(status)
          setExamplesCount(count)
        }
      })

      console.log('Processing completed successfully:', output)
      console.log('Output preview:', output.formattedText.substring(0, 200) + '...')

      // Store markdown text (decorations will hide asterisks and show bold)
      setMarkdownText(output.formattedText)
      setModifiedText(output.formattedText)
      setProcessedOutput(output)
      setCurrentStep('review')

      // Save to localStorage (includes examplesCount from output)
      localStorage.setItem(STORAGE_KEYS.PROCESSED_OUTPUT, JSON.stringify(output))
    } catch (error) {
      console.error('Processing failed with error:', error)
      // Stay on processing step to show the error instead of going back
      // The processingError state from useScriptProcessor will be displayed
    }
  }

  const handleModifiedChange = (value: string) => {
    setModifiedText(value)
    // Also update markdown text so manual edits are included in download
    setMarkdownText(value)

    if (processedOutput) {
      setProcessedOutput({
        ...processedOutput,
        formattedText: value,
        isEdited: true,
        editHistory: [
          ...processedOutput.editHistory,
          {
            timestamp: new Date(),
            type: 'manual',
            changeDescription: 'Manual edit',
            previousValue: processedOutput.formattedText,
            newValue: value
          }
        ]
      })
    }
  }

  const handleDownload = async () => {
    if (!document || !markdownText) return

    try {
      const filename = document.filename.replace('.docx', '_formatted.docx')

      // Convert plain text with line breaks to HTML paragraphs
      const htmlContent = markdownText
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${convertMarkdownToHtml(line)}</p>`)
        .join('')

      await generateFile(htmlContent, filename)
      setCurrentStep('download')

      // Clear localStorage after successful download
      localStorage.removeItem(STORAGE_KEYS.PROCESSED_OUTPUT)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleSaveAsExample = async (
    title: string,
    category: ExampleCategory,
    qualityScore: number
  ) => {
    if (!document || !modifiedText) {
      throw new Error('Missing document or formatted text')
    }

    try {
      // Generate embedding from the formatted (after) text
      console.log('[SaveExample] Generating embedding from formatted text...')
      const embedding = await embedForSaving(modifiedText)
      console.log(`[SaveExample] Embedding generated: ${embedding.length} dimensions`)

      const metadata: ExampleMetadata = {
        title,
        category,
        tags: [],
        qualityScore
      }

      const request: UploadRequest = {
        beforeContent: document.textContent,
        afterContent: modifiedText,
        metadata,
        embedding
      }

      await uploadExample.mutateAsync(request)

      console.log('[SaveExample] Example saved successfully!')
    } catch (error) {
      console.error('[SaveExample] Failed to save example:', error)
      throw error
    }
  }

  const handleStartOver = () => {
    setCurrentStep('upload')
    setDocument(null)
    setProcessedOutput(null)
    setModifiedText('')
    setMarkdownText('')
    setSelectedModelId(null)
    setRagStatus('')
    setExamplesCount(0)
    validatedProviderRef.current = null
    localStorage.removeItem(STORAGE_KEYS.PROCESSED_OUTPUT)
  }

  const handleExampleToggle = (exampleId: string) => {
    setEnabledExampleIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exampleId)) {
        newSet.delete(exampleId)
      } else {
        newSet.add(exampleId)
      }
      return newSet
    })
  }

  // Auto-validate provider when step changes to select-model
  useEffect(() => {
    if (currentStep === 'select-model' && activeProvider) {
      // Only validate if not already validated in this session
      if (
        activeProvider.status !== 'configured' &&
        validatedProviderRef.current !== activeProvider.id
      ) {
        validatedProviderRef.current = activeProvider.id
        handleProviderValidate(activeProvider.id, activeProvider.configuration)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, activeProvider?.id])

  // Auto-select first model when models become available
  useEffect(() => {
    if (models.length > 0 && !selectedModelId && currentStep === 'select-model') {
      setSelectedModelId(models[0].id)
    }
  }, [models, selectedModelId, currentStep])

  // Warn before navigation with unsaved work
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (processedOutput && !processedOutput.isEdited && currentStep === 'review') {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [processedOutput, currentStep])

  return (
    <div className="px-6 space-y-6">
      {/* Header */}
      <div className="w-full pb-4 border-b mb-4 flex items-center justify-between">
        <h2 className="px-4 text-2xl font-semibold flex flex-row gap-4 items-center">
          <FileText />
          Autocue Script Formatter
        </h2>
        {currentStep !== 'upload' && (
          <button
            onClick={handleStartOver}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Start Over
          </button>
        )}
      </div>

      {/* Workflow Steps Indicator */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {['upload', 'select-model', 'processing', 'review', 'download'].map(
          (step, idx) => (
            <div
              key={step}
              className={`flex items-center ${
                currentStep === step ? 'text-black font-medium' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step ? 'bg-black text-white' : 'bg-gray-300'
                }`}
              >
                {idx + 1}
              </div>
              <span className="ml-2 text-sm capitalize">{step.replace('-', ' ')}</span>
              {idx < 4 && <div className="w-12 h-0.5 bg-gray-300 mx-4" />}
            </div>
          )
        )}
      </div>

      {/* Step 1: Upload File */}
      {currentStep === 'upload' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <FileUploader
            onFileSelect={handleFileSelect}
            isLoading={isParsing}
            error={parseError}
          />
        </div>
      )}

      {/* Step 2: Select Model */}
      {currentStep === 'select-model' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ File uploaded: <strong>{document?.filename}</strong> ({document?.fileSize}{' '}
              bytes)
            </p>
          </div>

          {/* RAG/Embedding Status & Example Selection - Accordion */}
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
                {isEmbeddingLoading && (
                  <p className="text-sm text-blue-600">
                    Checking Ollama embedding model availability...
                  </p>
                )}
                {isEmbeddingReady && (
                  <p className="text-sm text-green-600">
                    ✓ RAG system ready (Ollama) - will use similar examples to improve
                    formatting
                  </p>
                )}
                {embeddingError && (
                  <div className="text-sm text-red-600">
                    <p className="font-medium">⚠ RAG system not available</p>
                    <p className="text-xs mt-1">{embeddingError.message}</p>
                    <p className="text-xs mt-1 text-gray-600">
                      Will format without example guidance.
                    </p>
                  </div>
                )}
                {!isEmbeddingLoading && !isEmbeddingReady && !embeddingError && (
                  <p className="text-sm text-gray-600">
                    RAG system not available - will format without example guidance
                  </p>
                )}
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
                    Choose which examples the AI should reference when formatting your
                    script. The system will automatically select the most relevant enabled
                    examples.
                  </p>
                  <ExampleToggleList
                    examples={allExamples}
                    enabledIds={enabledExampleIds}
                    onToggle={handleExampleToggle}
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
                onSelect={switchProvider}
                onValidate={handleProviderValidate}
                isValidating={isValidatingProvider}
              />
            </div>

            {/* Right column: Model Selector */}
            <div className="p-6 border border-gray-300 rounded-lg max-h-[200px] overflow-y-auto">
              {activeProvider?.status === 'configured' ? (
                <ModelSelector
                  models={models}
                  selectedModel={selectedModelId}
                  onSelect={setSelectedModelId}
                  isLoading={isLoadingModels}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p className="text-sm">
                    Select and validate an AI provider to see models
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Format button below the grid */}
          {selectedModelId && activeProvider?.status === 'configured' && (
            <button
              type="button"
              onClick={e => {
                e.preventDefault()
                handleFormatScript()
              }}
              className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 mb-3"
            >
              <Sparkles className="h-5 w-5" />
              Format Script with AI
            </button>
          )}
        </div>
      )}

      {/* Step 3: Processing */}
      {currentStep === 'processing' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-8 border border-gray-300 rounded-lg text-center">
            <Sparkles className="h-16 w-16 text-black mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Formatting your script...
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Using AI to optimize for autocue readability
            </p>

            {/* RAG Status */}
            {ragStatus && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-sm text-blue-800">
                  <Database className="h-4 w-4" />
                  <span>{ragStatus}</span>
                </div>
              </div>
            )}

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>

            <button
              onClick={cancelProcessing}
              className="mt-4 px-4 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
            >
              Cancel Processing
            </button>
          </div>

          {processingError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Processing Error</p>
                  <p className="text-sm text-red-700 mt-1">{processingError.message}</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentStep('select-model')}
                className="w-full px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review & Edit */}
      {currentStep === 'review' && processedOutput && (
        <div className="w-full space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-gray-900">Review and Edit</h3>
              {examplesCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-800">
                  <Database className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    Enhanced with {examplesCount} example{examplesCount > 1 ? 's' : ''}
                  </span>
                  <span className="sm:hidden">{examplesCount} ex.</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex-1 lg:flex-initial px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                title="Save this script as an example for future RAG-enhanced formatting"
              >
                <Save className="h-4 w-4" />
                <span className="hidden md:inline">Save as Example</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 lg:flex-initial px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">
                  {isGenerating ? 'Downloading...' : 'Download Formatted Script'}
                </span>
                <span className="md:hidden">Download</span>
              </button>
            </div>
          </div>

          <DiffEditor
            original={document?.textContent || ''}
            modified={modifiedText}
            onModifiedChange={handleModifiedChange}
          />

          {generateError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{generateError.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 5: Download Complete */}
      {currentStep === 'download' && (
        <div className="max-w-2xl mx-auto">
          <div className="p-8 bg-green-50 border border-green-200 rounded-lg text-center">
            <Download className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Download Complete!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your formatted script has been saved successfully.
            </p>
            <button
              onClick={() => {
                setCurrentStep('upload')
                setDocument(null)
                setProcessedOutput(null)
                setModifiedText('')
                setMarkdownText('')
                setSelectedModelId(null)
                setRagStatus('')
                setExamplesCount(0)
              }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Format Another Script
            </button>
          </div>
        </div>
      )}

      {/* Save Example Dialog */}
      <SaveExampleDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveAsExample}
        defaultTitle={document?.filename.replace('.docx', '') || 'Untitled Script'}
      />
    </div>
  )
}

export default ScriptFormatter
