import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'

interface UseFuzzySearchOptions {
  keys: string[]
  threshold?: number
  includeMatches?: boolean
}

export function useFuzzySearch<T>(items: T[], options: UseFuzzySearchOptions) {
  const [searchTerm, setSearchTerm] = useState('')

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
    return fuse.search(searchTerm).map((result) => result.item)
  }, [fuse, searchTerm, items])

  return {
    searchTerm,
    setSearchTerm,
    results
  }
}
