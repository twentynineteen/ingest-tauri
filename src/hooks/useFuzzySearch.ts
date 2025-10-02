import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'

interface UseFuzzySearchOptions {
  keys: string[]
  threshold?: number
  includeMatches?: boolean
}

export function useFuzzySearch<T>(items: T[], options: UseFuzzySearchOptions) {
  const [searchTerm, setSearchTerm] = useState('')

  // Stringify options for stable comparison
  const optionsKey = JSON.stringify({
    keys: options.keys,
    threshold: options.threshold ?? 0.3,
    includeMatches: options.includeMatches ?? false
  })

  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: options.keys,
      threshold: options.threshold ?? 0.3,
      includeMatches: options.includeMatches ?? false,
      ignoreLocation: true,
      minMatchCharLength: 2
    })
  }, [items, options.keys, options.threshold, options.includeMatches])

  const results = useMemo(() => {
    if (!searchTerm.trim()) {
      return items
    }
    return fuse.search(searchTerm).map(result => result.item)
  }, [fuse, searchTerm, items])

  return {
    searchTerm,
    setSearchTerm,
    results
  }
}
