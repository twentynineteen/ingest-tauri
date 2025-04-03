import { useEffect } from 'react'
import { useBreadcrumbStore } from 'src/store/useBreadcrumbStore'

export const useBreadcrumb = (items: { label: string; href?: string }[]) => {
  const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs)

  useEffect(() => {
    setBreadcrumbs(items)
  }, [JSON.stringify(items)]) // Re-run only if breadcrumb content changes
}
