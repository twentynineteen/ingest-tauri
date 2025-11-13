/**
 * useEmbedding Hook
 * Feature: 006-i-wish-to RAG Enhancement
 * Purpose: Client-side text embedding using Xenova Transformers
 */

import { pipeline } from '@xenova/transformers'
import { useEffect, useRef, useState } from 'react'

// Singleton instance to avoid reloading the model
let embedderInstance: any = null
let loadingPromise: Promise<any> | null = null

interface UseEmbeddingResult {
  embed: (text: string) => Promise<number[]>
  isReady: boolean
  isLoading: boolean
  error: Error | null
}

export function useEmbedding(): UseEmbeddingResult {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    const loadEmbedder = async () => {
      // If model already loaded, just mark as ready
      if (embedderInstance) {
        setIsReady(true)
        return
      }

      // If currently loading, wait for it
      if (loadingPromise) {
        try {
          await loadingPromise
          if (isMountedRef.current) {
            setIsReady(true)
          }
        } catch (err) {
          if (isMountedRef.current) {
            setError(
              err instanceof Error ? err : new Error('Failed to load embedding model')
            )
          }
        }
        return
      }

      // Start loading
      setIsLoading(true)
      loadingPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

      try {
        console.log('[useEmbedding] Starting to load Xenova embedding model...')
        console.log('[useEmbedding] Model: Xenova/all-MiniLM-L6-v2')
        embedderInstance = await loadingPromise
        console.log('[useEmbedding] ✓ Embedding model loaded successfully!')

        if (isMountedRef.current) {
          setIsReady(true)
          setIsLoading(false)
          console.log('[useEmbedding] ✓ State updated - RAG is ready')
        }
      } catch (err) {
        console.error('[useEmbedding] ✗ FAILED to load embedding model:', err)
        console.error('[useEmbedding] Error type:', err instanceof Error ? 'Error' : typeof err)
        console.error('[useEmbedding] Error details:', JSON.stringify(err, null, 2))
        if (isMountedRef.current) {
          const errorMessage = err instanceof Error
            ? `Failed to load embedding model: ${err.message}`
            : 'Failed to load embedding model (unknown error)'
          setError(new Error(errorMessage))
          setIsLoading(false)
          console.log('[useEmbedding] ✗ State updated - RAG failed')
        }
      } finally {
        loadingPromise = null
      }
    }

    loadEmbedder()

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const embed = async (text: string): Promise<number[]> => {
    if (!embedderInstance) {
      throw new Error('Embedding model not loaded yet')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    try {
      console.log(
        `[useEmbedding] Generating embedding for text (${text.length} chars)...`
      )

      const output = await embedderInstance(text, {
        pooling: 'mean',
        normalize: true
      })

      const embedding = Array.from(output.data) as number[]
      console.log(`[useEmbedding] Embedding generated (${embedding.length} dimensions)`)

      return embedding
    } catch (err) {
      console.error('[useEmbedding] Failed to generate embedding:', err)
      throw err instanceof Error ? err : new Error('Failed to generate embedding')
    }
  }

  return {
    embed,
    isReady,
    isLoading,
    error
  }
}
