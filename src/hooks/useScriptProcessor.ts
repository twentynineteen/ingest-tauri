/**
 * useScriptProcessor Hook
 * Feature: 006-i-wish-to (T042)
 * Purpose: AI script processing with streaming, retry, and tool calling
 */

import { useState, useRef } from 'react'
import { streamText } from 'ai'
import { ModelFactory } from '../services/ai/modelFactory'
import { AUTOCUE_PROMPT } from '../utils/aiPrompts'
import type {
  ProcessedOutput,
  ProviderConfiguration,
} from '../types/scriptFormatter'

interface ProcessScriptOptions {
  text: string
  modelId: string
  providerId: string
  configuration: ProviderConfiguration
  onProgress?: (progress: number) => void
  onRetry?: (attempt: number) => void
}

interface UseScriptProcessorResult {
  processScript: (options: ProcessScriptOptions) => Promise<ProcessedOutput>
  isProcessing: boolean
  progress: number
  result: ProcessedOutput | null
  error: Error | null
  retry: () => Promise<void>
  cancel: () => void
}

export function useScriptProcessor(): UseScriptProcessorResult {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ProcessedOutput | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const lastOptionsRef = useRef<ProcessScriptOptions | null>(null)

  const processScript = async (options: ProcessScriptOptions): Promise<ProcessedOutput> => {
    lastOptionsRef.current = options
    setIsProcessing(true)
    setProgress(0)
    setError(null)
    setResult(null)

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    const maxRetries = 3 // FR-014: 3 retry attempts
    let attempt = 0

    while (attempt < maxRetries) {
      try {
        // Create model using ModelFactory (provider-agnostic)
        const model = ModelFactory.createModel({
          providerId: options.providerId,
          modelId: options.modelId,
          configuration: options.configuration,
        })

        // Stream text with AI SDK (FR-011: streaming responses)
        // Note: Removed tools for Phase 1 - direct text formatting is simpler
        const streamResult = streamText({
          model,
          messages: [
            { role: 'system', content: AUTOCUE_PROMPT },
            {
              role: 'user',
              content: `Format this script for autocue/teleprompter reading. Output ONLY the formatted script with no preamble, introduction, or explanation.\n\n${options.text}`,
            },
          ],
          temperature: 0.7,
          abortSignal: abortControllerRef.current.signal,
        })

        // Collect streamed text
        let formattedText = ''
        let chunkCount = 0

        for await (const chunk of streamResult.textStream) {
          formattedText += chunk
          chunkCount++

          // Update progress (approximate)
          const estimatedProgress = Math.min(95, (chunkCount / 100) * 95)
          setProgress(estimatedProgress)
          options.onProgress?.(estimatedProgress)
        }

        // Complete processing
        setProgress(100)
        options.onProgress?.(100)

        // Debug logging
        console.log('Formatted text preview (first 200 chars):', formattedText.substring(0, 200))
        console.log('Line breaks found:', formattedText.split('\n').length)

        // Create ProcessedOutput
        // Convert line breaks to proper HTML paragraphs
        const htmlContent = formattedText
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => `<p>${line}</p>`)
          .join('\n')

        const output: ProcessedOutput = {
          id: crypto.randomUUID(),
          requestId: crypto.randomUUID(), // Create request ID
          formattedHtml: htmlContent,
          formattedText,
          diffData: {
            additions: [],
            deletions: [],
            modifications: [],
            originalLineCount: options.text.split('\n').length,
            modifiedLineCount: formattedText.split('\n').length,
          },
          editHistory: [],
          generationTimestamp: new Date(),
          isEdited: false,
        }

        setResult(output)
        setIsProcessing(false)
        return output
      } catch (err) {
        attempt++

        if (abortControllerRef.current?.signal.aborted) {
          // User cancelled
          const cancelError = new Error('Processing cancelled by user')
          setError(cancelError)
          setIsProcessing(false)
          throw cancelError
        }

        if (attempt >= maxRetries) {
          // Final failure after retries (FR-015)
          const finalError =
            err instanceof Error ? err : new Error('Failed to process script')
          setError(finalError)
          setIsProcessing(false)
          throw finalError
        }

        // Retry with exponential backoff
        options.onRetry?.(attempt)
        const backoffDelay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, backoffDelay))
      }
    }

    throw new Error('Max retries exceeded')
  }

  const retry = async () => {
    if (lastOptionsRef.current) {
      await processScript(lastOptionsRef.current)
    }
  }

  const cancel = () => {
    abortControllerRef.current?.abort()
  }

  return {
    processScript,
    isProcessing,
    progress,
    result,
    error,
    retry,
    cancel,
  }
}
