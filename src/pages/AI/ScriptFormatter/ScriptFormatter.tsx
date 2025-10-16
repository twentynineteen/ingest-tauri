/**
 * ScriptFormatter Page
 * Feature: 006-i-wish-to (T048)
 * Purpose: Main page orchestration for AI-powered autocue script formatting
 */

import React, { useState, useEffect } from 'react'
import { useBreadcrumb } from '@hooks/index'
import { FileText, Sparkles, Download, AlertCircle } from 'lucide-react'

// Hooks
import { useDocxParser } from '../../../hooks/useDocxParser'
import { useDocxGenerator } from '../../../hooks/useDocxGenerator'
import { useAIProvider } from '../../../hooks/useAIProvider'
import { useAIModels } from '../../../hooks/useAIModels'
import { useScriptProcessor } from '../../../hooks/useScriptProcessor'

// Components
import { FileUploader } from './FileUploader'
import { ProviderSelector } from './ProviderSelector'
import { ModelSelector } from './ModelSelector'
import { DiffEditor } from './DiffEditor'

// Types
import type { ScriptDocument, ProcessedOutput } from '../../../types/scriptFormatter'
import { STORAGE_KEYS } from '../../../types/scriptFormatter'

type WorkflowStep = 'upload' | 'select-model' | 'processing' | 'review' | 'download'

const ScriptFormatter: React.FC = () => {
  // Breadcrumb
  useBreadcrumb([
    { label: 'AI tools', href: '/ai-tools/script-formatter' },
    { label: 'Autocue script formatter' },
  ])

  // State
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload')
  const [document, setDocument] = useState<ScriptDocument | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [processedOutput, setProcessedOutput] = useState<ProcessedOutput | null>(null)
  const [modifiedText, setModifiedText] = useState<string>('')

  // Hooks
  const { parseFile, isLoading: isParsing, error: parseError } = useDocxParser()
  const { generateFile, isGenerating, error: generateError } = useDocxGenerator()
  const {
    activeProvider,
    availableProviders,
    switchProvider,
    validateProvider,
  } = useAIProvider()

  const {
    models,
    isLoading: isLoadingModels,
  } = useAIModels({
    providerId: activeProvider?.id || '',
    configuration: activeProvider?.configuration || {
      serviceUrl: '',
      connectionStatus: 'not-configured',
    },
    enabled: !!activeProvider && activeProvider.status === 'configured',
  })

  const {
    processScript,
    isProcessing,
    progress,
    error: processingError,
    cancel: cancelProcessing,
  } = useScriptProcessor()

  // FR-022: Restore session data from localStorage
  useEffect(() => {
    const savedOutput = localStorage.getItem(STORAGE_KEYS.PROCESSED_OUTPUT)
    if (savedOutput) {
      try {
        const output = JSON.parse(savedOutput)
        setProcessedOutput(output)
        setModifiedText(output.formattedText)
        setCurrentStep('review')
      } catch {
        // Invalid data, ignore
      }
    }
  }, [])

  // FR-023: Warn before navigation with unsaved work
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

  const handleProviderValidate = async (providerId: string, config: any) => {
    await validateProvider(providerId, config)
  }

  const handleFormatScript = async () => {
    if (!document || !selectedModelId || !activeProvider) return

    setCurrentStep('processing')

    try {
      const output = await processScript({
        text: document.textContent,
        modelId: selectedModelId,
        providerId: activeProvider.id,
        configuration: activeProvider.configuration,
        onProgress: (prog) => console.log(`Progress: ${prog}%`),
      })

      setProcessedOutput(output)
      setModifiedText(output.formattedText)
      setCurrentStep('review')

      // FR-022: Save to localStorage
      localStorage.setItem(STORAGE_KEYS.PROCESSED_OUTPUT, JSON.stringify(output))
    } catch (error) {
      console.error('Processing failed:', error)
      setCurrentStep('select-model')
    }
  }

  const handleModifiedChange = (value: string) => {
    setModifiedText(value)
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
            newValue: value,
          },
        ],
      })
    }
  }

  const handleDownload = async () => {
    if (!document || !modifiedText) return

    try {
      const filename = document.filename.replace('.docx', '_formatted.docx')
      await generateFile(`<p>${modifiedText}</p>`, filename)
      setCurrentStep('download')

      // Clear localStorage after successful download
      localStorage.removeItem(STORAGE_KEYS.PROCESSED_OUTPUT)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <div className="px-6 space-y-6">
      {/* Header */}
      <div className="w-full pb-4 border-b mb-4">
        <h2 className="px-4 text-2xl font-semibold flex flex-row gap-4 items-center">
          <FileText />
          Autocue Script Formatter
        </h2>
      </div>

      {/* Workflow Steps Indicator */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {['upload', 'select-model', 'processing', 'review', 'download'].map((step, idx) => (
          <div
            key={step}
            className={`flex items-center ${
              currentStep === step ? 'text-blue-600 font-medium' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === step ? 'bg-blue-600 text-white' : 'bg-gray-300'
              }`}
            >
              {idx + 1}
            </div>
            <span className="ml-2 text-sm capitalize">{step.replace('-', ' ')}</span>
            {idx < 4 && <div className="w-12 h-0.5 bg-gray-300 mx-4" />}
          </div>
        ))}
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
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ File uploaded: <strong>{document?.filename}</strong> ({document?.fileSize} bytes)
            </p>
          </div>

          <ProviderSelector
            providers={availableProviders}
            activeProvider={activeProvider}
            onSelect={switchProvider}
            onValidate={handleProviderValidate}
          />

          {activeProvider?.status === 'configured' && (
            <>
              <ModelSelector
                models={models}
                selectedModel={selectedModelId}
                onSelect={setSelectedModelId}
                isLoading={isLoadingModels}
              />

              {selectedModelId && (
                <button
                  onClick={handleFormatScript}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Format Script with AI
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 3: Processing */}
      {currentStep === 'processing' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-8 border border-gray-300 rounded-lg text-center">
            <Sparkles className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Formatting your script...
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Using AI to optimize for autocue readability (FR-011)
            </p>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{progress}% complete</p>

            <button
              onClick={cancelProcessing}
              className="mt-4 px-4 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
            >
              Cancel Processing
            </button>
          </div>

          {processingError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Processing Error</p>
                <p className="text-sm text-red-700 mt-1">{processingError.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review & Edit */}
      {currentStep === 'review' && processedOutput && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Review and Edit (FR-016, FR-017, FR-018)
            </h3>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Downloading...' : 'Download Formatted Script'}
            </button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Download Complete! (FR-020)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your formatted script has been saved successfully.
            </p>
            <button
              onClick={() => {
                setCurrentStep('upload')
                setDocument(null)
                setProcessedOutput(null)
                setModifiedText('')
                setSelectedModelId(null)
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Format Another Script
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScriptFormatter
