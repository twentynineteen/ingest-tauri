import { useCallback, useEffect } from 'react'
import { useBreadcrumbStore } from 'store/useBreadcrumbStore'

export const useBreadcrumb = (items: { label: string; href?: string }[]) => {
  const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs)

  const updateBreadcrumbs = useCallback(() => {
    setBreadcrumbs(items)
  }, [setBreadcrumbs, items])

  useEffect(() => {
    updateBreadcrumbs()
  }, [updateBreadcrumbs])
}
