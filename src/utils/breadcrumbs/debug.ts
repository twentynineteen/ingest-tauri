/**
 * Breadcrumbs Debug Utilities
 *
 * Debug helpers for development - should not be used in production.
 */

import type { BreadcrumbsFile } from '../../types/baker'
import { compareBreadcrumbs, compareBreadcrumbsMeaningful } from './comparison'

/**
 * Debug helper to log comparison results
 * Remove this in production - for debugging only
 */
export function debugComparison(
  current: BreadcrumbsFile | null,
  updated: BreadcrumbsFile
): void {
  console.group('Breadcrumbs Comparison Debug')

  const fullDiff = compareBreadcrumbs(current, updated, true)
  const meaningfulDiff = compareBreadcrumbsMeaningful(current, updated)

  console.log('Current:', current)
  console.log('Updated:', updated)
  console.log('Full Diff:', fullDiff)
  console.log('Meaningful Diff:', meaningfulDiff)

  console.log('Change Analysis:')
  fullDiff.changes.forEach(change => {
    const isMeaningful = meaningfulDiff.changes.some(
      mc => mc.field === change.field && mc.type === change.type
    )
    console.log(
      `  ${change.field}: ${change.type} ${isMeaningful ? 'MEANINGFUL' : 'MAINTENANCE'}`
    )
    if (change.oldValue !== change.newValue) {
      console.log(`    Old: ${JSON.stringify(change.oldValue)}`)
      console.log(`    New: ${JSON.stringify(change.newValue)}`)
    }
  })

  console.groupEnd()
}
