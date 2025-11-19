/**
 * ScriptFormatter Page
 * Feature: 006-i-wish-to (T048)
 * Purpose: Main page orchestration for AI-powered autocue script formatting
 * Refactored: 2025-11-18 - Extracted state to useScriptFormatterState, step components to /steps
 */

import { useBreadcrumb } from '@hooks/index'
import { useScriptFormatterState } from '@hooks/useScriptFormatterState'
import { FileText } from 'lucide-react'
import React from 'react'
import { FileUploader } from './FileUploader'
import { SaveExampleDialog } from './SaveExampleDialog'
import {
  DownloadCompleteStep,
  ProcessingStep,
  ReviewStep,
  SelectModelStep,
  WorkflowIndicator
} from './steps'

const ScriptFormatter: React.FC = () => {
  useBreadcrumb([
    { label: 'AI tools', href: '/ai-tools/script-formatter' },
    { label: 'Autocue script formatter' }
  ])

  const {
    // State
    currentStep,
    document,
    selectedModelId,
    processedOutput,
    modifiedText,
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
  } = useScriptFormatterState()

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

      {/* Workflow Progress Indicator */}
      <WorkflowIndicator currentStep={currentStep} />

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
        <SelectModelStep
          document={document}
          activeProvider={activeProvider}
          availableProviders={availableProviders}
          models={models}
          selectedModelId={selectedModelId}
          isLoadingModels={isLoadingModels}
          isValidatingProvider={isValidatingProvider}
          isEmbeddingLoading={isEmbeddingLoading}
          isEmbeddingReady={isEmbeddingReady}
          embeddingError={embeddingError}
          allExamples={allExamples}
          enabledExampleIds={enabledExampleIds}
          isLoadingExamples={isLoadingExamples}
          onProviderSelect={switchProvider}
          onProviderValidate={handleProviderValidate}
          onModelSelect={setSelectedModelId}
          onExampleToggle={handleExampleToggle}
          onFormatScript={handleFormatScript}
        />
      )}

      {/* Step 3: Processing */}
      {currentStep === 'processing' && (
        <ProcessingStep
          progress={progress}
          ragStatus={ragStatus}
          processingError={processingError}
          onCancel={cancelProcessing}
          onRetry={() => goToStep('select-model')}
        />
      )}

      {/* Step 4: Review & Edit */}
      {currentStep === 'review' && processedOutput && (
        <ReviewStep
          originalText={document?.textContent || ''}
          modifiedText={modifiedText}
          examplesCount={examplesCount}
          isGenerating={isGenerating}
          generateError={generateError}
          onModifiedChange={handleModifiedChange}
          onDownload={handleDownload}
          onOpenSaveDialog={() => setShowSaveDialog(true)}
        />
      )}

      {/* Step 5: Download Complete */}
      {currentStep === 'download' && (
        <DownloadCompleteStep onFormatAnother={handleStartOver} />
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
