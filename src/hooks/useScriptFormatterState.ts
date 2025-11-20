/**
 * useScriptFormatterState Hook
 * Purpose: Manages all state and handlers for the ScriptFormatter workflow
 * Extracted from ScriptFormatter.tsx to reduce complexity (DEBT-002)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ExampleCategory,
  type ExampleMetadata,
  type UploadRequest
} from '../types/exampleEmbeddings'
import {
  STORAGE_KEYS,
  type ProcessedOutput,
  type ProviderConfiguration,
  type ScriptDocument
} from '../types/scriptFormatter'
import { createNamespacedLogger } from '../utils/logger'
import { useAIModels } from './useAIModels'
import { useAIProvider } from './useAIProvider'
import { useDocxGenerator } from './useDocxGenerator'
import { useDocxParser } from './useDocxParser'
import { useExampleManagement } from './useExampleManagement'
import { useOllamaEmbedding } from './useOllamaEmbedding'
import { useScriptProcessor } from './useScriptProcessor'

const log = createNamespacedLogger('ScriptFormatterState')

export type WorkflowStep =
  | 'upload'
  | 'select-model'
  | 'processing'
  | 'review'
  | 'download'

/**
 * Converts markdown formatting to HTML
 */
function convertMarkdownToHtml(text: string): string {
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>')
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
    log.debug('No cached result found')
    return null
  }

  try {
    const output = JSON.parse(savedOutput)
    log.debug('Restored cached result:', {
      formattedTextPreview: output.formattedText.substring(0, 100),
      timestamp: output.generationTimestamp,
      examplesCount: output.examplesCount
    })
    return output
  } catch (err) {
    console.warn('[ScriptFormatterState] Failed to restore cached result:', err)
    localStorage.removeItem(STORAGE_KEYS.PROCESSED_OUTPUT)
    return null
  }
}

export function useScriptFormatterState() {
  // Core workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload')
  const [document, setDocument] = useState<ScriptDocument | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [processedOutput, setProcessedOutput] = useState<ProcessedOutput | null>(null)
  const [modifiedText, setModifiedText] = useState<string>('')
  const [markdownText, setMarkdownText] = useState<string>('')
  const [examplesCount, setExamplesCount] = useState<number>(0)
  const [ragStatus, setRagStatus] = useState<string>('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [enabledExampleIds, setEnabledExampleIds] = useState<Set<string>>(new Set())
  const [isValidatingProvider, setIsValidatingProvider] = useState(false)
  const validatedProviderRef = useRef<string | null>(null)

  // Initialize hooks
  const { parseFile, isLoading: isParsing, error: parseError } = useDocxParser()
  const { generateFile, isGenerating, error: generateError } = useDocxGenerator()
  const { activeProvider, availableProviders, switchProvider, validateProvider } =
    useAIProvider()

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

  // Initialize enabled examples when examples are loaded
  useEffect(() => {
    if (allExamples.length > 0 && enabledExampleIds.size === 0) {
      setEnabledExampleIds(new Set(allExamples.map(ex => ex.id)))
    }
  }, [allExamples, enabledExampleIds.size])

  // Restore session data from localStorage on mount
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
  void initialLoadDone

  // Handlers
  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        const parsed = await parseFile(file)
        setDocument(parsed)
        setCurrentStep('select-model')
      } catch (error) {
        console.error('Failed to parse file:', error)
      }
    },
    [parseFile]
  )

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

  const handleFormatScript = useCallback(async () => {
    log.debug('handleFormatScript called', {
      document,
      selectedModelId,
      activeProvider
    })

    if (!document || !selectedModelId || !activeProvider) {
      console.warn('[ScriptFormatterState] Missing required data:', {
        document,
        selectedModelId,
        activeProvider
      })
      return
    }

    // Clear any cached results before processing
    localStorage.removeItem(STORAGE_KEYS.PROCESSED_OUTPUT)
    setProcessedOutput(null)
    setModifiedText('')
    setMarkdownText('')
    setRagStatus('')
    setExamplesCount(0)

    log.debug('Setting step to processing...')
    setCurrentStep('processing')

    try {
      log.debug(
        'Processing script with user input:',
        document.textContent.substring(0, 200) + '...'
      )

      const output = await processScript({
        text: document.textContent,
        modelId: selectedModelId,
        providerId: activeProvider.id,
        configuration: activeProvider.configuration,
        enabledExampleIds: enabledExampleIds,
        onProgress: prog => log.debug(`Progress: ${prog}%`),
        onRAGUpdate: (status, count) => {
          setRagStatus(status)
          setExamplesCount(count)
        }
      })

      log.debug('Processing completed successfully:', output)
      log.info('Output preview:', output.formattedText.substring(0, 200) + '...')

      setMarkdownText(output.formattedText)
      setModifiedText(output.formattedText)
      setProcessedOutput(output)
      setCurrentStep('review')

      localStorage.setItem(STORAGE_KEYS.PROCESSED_OUTPUT, JSON.stringify(output))
    } catch (error) {
      console.error('[ScriptFormatterState] Processing failed with error:', error)
    }
  }, [document, selectedModelId, activeProvider, enabledExampleIds, processScript])

  const handleModifiedChange = useCallback(
    (value: string) => {
      setModifiedText(value)
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
    },
    [processedOutput]
  )

  const handleDownload = useCallback(async () => {
    if (!document || !markdownText) return

    try {
      const filename = document.filename.replace('.docx', '_formatted.docx')
      const htmlContent = markdownText
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${convertMarkdownToHtml(line)}</p>`)
        .join('')

      await generateFile(htmlContent, filename)
      setCurrentStep('download')
      localStorage.removeItem(STORAGE_KEYS.PROCESSED_OUTPUT)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }, [document, markdownText, generateFile])

  const handleSaveAsExample = useCallback(
    async (title: string, category: ExampleCategory, qualityScore: number) => {
      if (!document || !modifiedText) {
        throw new Error('Missing document or formatted text')
      }

      try {
        log.info('Generating embedding from formatted text...')
        const embedding = await embedForSaving(modifiedText)
        log.info(`Embedding generated: ${embedding.length} dimensions`)

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
        log.info('Example saved successfully!')
      } catch (error) {
        console.error('[ScriptFormatterState] Failed to save example:', error)
        throw error
      }
    },
    [document, modifiedText, embedForSaving, uploadExample]
  )

  const handleStartOver = useCallback(() => {
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
  }, [])

  const handleExampleToggle = useCallback((exampleId: string) => {
    setEnabledExampleIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exampleId)) {
        newSet.delete(exampleId)
      } else {
        newSet.add(exampleId)
      }
      return newSet
    })
  }, [])

  const goToStep = useCallback((step: WorkflowStep) => {
    setCurrentStep(step)
  }, [])

  // Auto-validate provider when step changes to select-model
  useEffect(() => {
    if (currentStep === 'select-model' && activeProvider) {
      if (
        activeProvider.status !== 'configured' &&
        validatedProviderRef.current !== activeProvider.id
      ) {
        validatedProviderRef.current = activeProvider.id
        handleProviderValidate(activeProvider.id, activeProvider.configuration)
      }
    }
  }, [currentStep, activeProvider, handleProviderValidate])

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

  return {
    // State
    currentStep,
    document,
    selectedModelId,
    processedOutput,
    modifiedText,
    markdownText,
    examplesCount,
    ragStatus,
    showSaveDialog,
    enabledExampleIds,
    isValidatingProvider,

    // Loading states
    isParsing,
    isGenerating,
    isLoadingModels,
    isLoadingExamples,
    isEmbeddingLoading,
    isEmbeddingReady,

    // Errors
    parseError,
    generateError,
    processingError,
    embeddingError,

    // Data
    models,
    allExamples,
    activeProvider,
    availableProviders,
    progress,

    // Handlers
    handleFileSelect,
    handleProviderValidate,
    handleFormatScript,
    handleModifiedChange,
    handleDownload,
    handleSaveAsExample,
    handleStartOver,
    handleExampleToggle,
    goToStep,
    setSelectedModelId,
    setShowSaveDialog,
    switchProvider,
    cancelProcessing
  }
}
