import { useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBreadcrumbStore } from 'store/useBreadcrumbStore'
import { queryKeys } from '../lib/query-keys'
import { createQueryOptions } from '../lib/query-utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbData {
  path: string
  items: Array<{ name: string; url: string }>
  updatedAt: string
}

export const useBreadcrumb = (items: BreadcrumbItem[]) => {
  const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs)
  const queryClient = useQueryClient()
  const queryKey = queryKeys.user.breadcrumb()

  // Cache the breadcrumb path in React Query
  const { data } = useQuery(
    createQueryOptions(
      queryKey,
      async (): Promise<BreadcrumbData> => {
        // Convert items to breadcrumb data format
        const path = items.map(item => item.label).join(' > ')
        const breadcrumbItems = items.map(item => ({
          name: item.label,
          url: item.href || '#'
        }))

        return {
          path,
          items: breadcrumbItems,
          updatedAt: new Date().toISOString(),
        }
      },
      'STATIC', // Breadcrumb data is relatively stable
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
      }
    )
  )

  const updateBreadcrumbs = useCallback(() => {
    // Update both React Query cache and Zustand store
    const path = items.map(item => item.label).join(' > ')
    const breadcrumbItems = items.map(item => ({
      name: item.label,
      url: item.href || '#'
    }))

    const breadcrumbData: BreadcrumbData = {
      path,
      items: breadcrumbItems,
      updatedAt: new Date().toISOString(),
    }

    queryClient.setQueryData(queryKey, breadcrumbData)
    setBreadcrumbs(items) // Maintain Zustand store compatibility
  }, [setBreadcrumbs, items, queryClient, queryKey])

  useEffect(() => {
    updateBreadcrumbs()
  }, [updateBreadcrumbs])

  // Return breadcrumb data for components that might need it
  return {
    breadcrumbData: data,
    updateBreadcrumbs,
  }
}
