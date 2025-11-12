/**
 * useScriptProcessor Hook
 * Feature: 006-i-wish-to (T042)
 * Purpose: AI script processing with streaming, retry, and tool calling
 * Enhanced with RAG (Retrieval-Augmented Generation)
 */

import { invoke } from '@tauri-apps/api/core'
import { streamText } from 'ai'
import { useRef, useState } from 'react'
import { ModelFactory } from '../services/ai/modelFactory'
import type { ProcessedOutput, ProviderConfiguration } from '../types/scriptFormatter'
import { buildRAGPrompt } from '../utils/aiPrompts'
import { useEmbedding } from './useEmbedding'
import type { SimilarExample } from './useScriptRetrieval'

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

  // Use embedding hook for RAG
  const { embed, isReady: isEmbeddingReady } = useEmbedding()

  const processScript = async (
    options: ProcessScriptOptions
  ): Promise<ProcessedOutput> => {
    lastOptionsRef.current = options
    setIsProcessing(true)
    setProgress(0)
    setError(null)
    setResult(null)

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    const maxRetries = 3
    let attempt = 0

    while (attempt < maxRetries) {
      try {
        // Step 1: Retrieve similar examples using RAG (10% progress)
        console.log('[useScriptProcessor] Step 1: Retrieving similar examples...')
        setProgress(5)
        options.onProgress?.(5)

        let examples: SimilarExample[] = []

        // IMPORTANT: Only use RAG if explicitly enabled - disable for now due to embedding issues
        const enableRAG = false // TODO: Set to true once Ollama embedding is fixed

        if (enableRAG && isEmbeddingReady && options.text.length > 50) {
          try {
            // Generate embedding for query
            const queryEmbedding = await embed(options.text)

            // Search for similar scripts
            examples = await invoke<SimilarExample[]>('search_similar_scripts', {
              queryEmbedding,
              topK: 3,
              minSimilarity: 0.65
            })
            console.log(`[useScriptProcessor] Found ${examples.length} similar examples`)
          } catch (ragError) {
            console.warn(
              '[useScriptProcessor] RAG retrieval failed, continuing without examples:',
              ragError
            )
            // Continue without examples - don't fail the whole process
          }
        } else {
          console.log(
            '[useScriptProcessor] RAG disabled or not ready - processing without examples'
          )
        }

        setProgress(15)
        options.onProgress?.(15)

        // Step 2: Build enhanced prompt with examples (20% progress)
        console.log('[useScriptProcessor] Step 2: Building prompt...')
        const systemPrompt = buildRAGPrompt(options.text, examples)
        setProgress(20)
        options.onProgress?.(20)

        // Step 3: Create model and stream (20-95% progress)
        console.log('[useScriptProcessor] Step 3: Processing with AI...')
        const model = ModelFactory.createModel({
          providerId: options.providerId,
          modelId: options.modelId,
          configuration: options.configuration
        })

        const streamResult = streamText({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Format this script for autocue/teleprompter reading. Preserve ALL the original words and content exactly as written - DO NOT rewrite, paraphrase, or change the meaning. ONLY add formatting (line breaks, bold, pauses). Output ONLY the formatted script with no preamble, introduction, or explanation.

SCRIPT TO FORMAT:
${options.text}`
            }
          ],
          temperature: 0.3,
          abortSignal: abortControllerRef.current.signal
        })

        // Collect streamed text
        let formattedText = ''
        let chunkCount = 0

        for await (const chunk of streamResult.textStream) {
          formattedText += chunk
          chunkCount++

          // Update progress (20-95%)
          const streamProgress = 20 + Math.min(75, (chunkCount / 100) * 75)
          setProgress(streamProgress)
          options.onProgress?.(streamProgress)
        }

        // Complete processing
        setProgress(100)
        options.onProgress?.(100)

        // Debug logging
        console.log(
          'Formatted text preview (first 200 chars):',
          formattedText.substring(0, 200)
        )
        console.log('Line breaks found:', formattedText.split('\n').length)

        // Create ProcessedOutput
        // Convert line breaks to proper HTML paragraphs
        const htmlContent = formattedText
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => `<p>${line}</p>`)
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
            modifiedLineCount: formattedText.split('\n').length
          },
          editHistory: [],
          generationTimestamp: new Date(),
          isEdited: false
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
          // Final failure after retries
          const finalError =
            err instanceof Error ? err : new Error('Failed to process script')
          setError(finalError)
          setIsProcessing(false)
          throw finalError
        }

        // Retry with exponential backoff
        options.onRetry?.(attempt)
        const backoffDelay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
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
    cancel
  }
}
