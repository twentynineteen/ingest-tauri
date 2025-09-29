/**
 * Breadcrumbs Comparison Utilities
 *
 * Utilities for comparing breadcrumbs files and generating diffs
 * for preview functionality in Baker.
 */

import { format, parse } from 'date-fns'
import type {
  BreadcrumbsDiff,
  BreadcrumbsFile,
  BreadcrumbsPreview,
  FieldChange,
  DetailedFieldChange,
  ProjectChangeDetail
} from '../types/baker'

/**
 * Format breadcrumbs date strings with comprehensive fallback handling
 *
 * Supports multiple date formats:
 * - ISO 8601 strings (RFC3339 from Rust backend)
 * - Legacy format: 'dd/MM/yyyy, HH:mm:ss'
 * - Standard JavaScript Date constructor formats
 *
 * @param dateString - The date string to format
 * @param formatPattern - Optional date-fns format pattern (default: 'PPPpp' for full format)
 * @returns Formatted date string or fallback error message
 */
export function formatBreadcrumbDate(
  dateString: string | null | undefined,
  formatPattern: string = 'PPPpp'
): string {
  if (!dateString || dateString === 'null' || dateString === 'undefined') {
    return 'Not set'
  }

  try {
    // Try parsing as ISO string first (most common case from Rust backend)
    const isoDate = new Date(dateString)
    if (!isNaN(isoDate.getTime())) {
      return format(isoDate, formatPattern)
    }

    // Fallback to parsing with legacy format (dd/MM/yyyy, HH:mm:ss)
    const parsedDate = parse(
      dateString,
      'dd/MM/yyyy, HH:mm:ss',
      new Date()
    )
    if (!isNaN(parsedDate.getTime())) {
      return format(parsedDate, formatPattern)
    }

    // Additional fallback for other common formats
    const commonFormats = [
      'yyyy-MM-dd HH:mm:ss',
      'MM/dd/yyyy HH:mm:ss',
      'dd-MM-yyyy HH:mm:ss'
    ]

    for (const fmt of commonFormats) {
      try {
        const testDate = parse(dateString, fmt, new Date())
        if (!isNaN(testDate.getTime())) {
          return format(testDate, formatPattern)
        }
      } catch {
        // Continue to next format
      }
    }

    console.warn('Unable to parse date string:', dateString)
    return 'Invalid date'
  } catch (error) {
    console.warn('Error parsing date:', dateString, error)
    return 'Invalid date'
  }
}

/**
 * Simple date formatting for basic locale string output
 * (backward compatibility version)
 */
export function formatBreadcrumbDateSimple(
  dateString: string | null | undefined
): string {
  if (!dateString || dateString === 'null' || dateString === 'undefined') {
    return 'Not set'
  }

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string received:', dateString)
      return 'Invalid date'
    }
    return date.toLocaleString()
  } catch (error) {
    console.warn('Error parsing date:', dateString, error)
    return 'Invalid date'
  }
}

/**
 * Deep equality check for any value type
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (a == null || b == null) return a === b

  if (typeof a !== typeof b) return false

  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false

    if (Array.isArray(a)) {
      if (a.length !== (b as unknown[]).length) return false
      return a.every((item, index) => deepEqual(item, (b as unknown[])[index]))
    }

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    return keysA.every(key => deepEqual(a[key], b[key]))
  }

  return false
}

/**
 * Compare two breadcrumbs files and generate a diff
 * @param current - Current breadcrumbs file (null if doesn't exist)
 * @param updated - What Baker will create/update to
 * @param includeMaintenance - Whether to include maintenance fields (timestamps, scannedBy)
 */
export function compareBreadcrumbs(
  current: BreadcrumbsFile | null,
  updated: BreadcrumbsFile,
  includeMaintenance: boolean = true
): BreadcrumbsDiff {
  const changes: FieldChange[] = []

  // Define meaningful content fields (always compared)
  const contentFields = [
    'projectTitle',
    'numberOfCameras',
    'files',
    'parentFolder',
    'createdBy',
    'creationDateTime',
    'folderSizeBytes',
    'trelloCardUrl'
  ] as const

  // Define maintenance fields (only compared if includeMaintenance is true)
  const maintenanceFields = ['lastModified', 'scannedBy'] as const

  const fieldsToCompare = includeMaintenance
    ? [...contentFields, ...maintenanceFields]
    : contentFields

  if (!current) {
    // All fields are new
    fieldsToCompare.forEach((field: keyof BreadcrumbsFile) => {
      if (updated[field] !== undefined) {
        changes.push({
          type: 'added',
          field,
          newValue: updated[field]
        })
      }
    })
  } else {
    // Compare each field
    fieldsToCompare.forEach((field: keyof BreadcrumbsFile) => {
      const oldValue = current[field]
      const newValue = updated[field]

      if (oldValue === undefined && newValue !== undefined) {
        changes.push({
          type: 'added',
          field,
          newValue
        })
      } else if (oldValue !== undefined && newValue === undefined) {
        changes.push({
          type: 'removed',
          field,
          oldValue
        })
      } else if (!deepEqual(oldValue, newValue)) {
        changes.push({
          type: 'modified',
          field,
          oldValue,
          newValue
        })
      } else if (oldValue !== undefined) {
        changes.push({
          type: 'unchanged',
          field,
          oldValue,
          newValue
        })
      }
    })
  }

  // Calculate summary
  const summary = changes.reduce(
    (acc, change) => {
      acc[change.type]++
      return acc
    },
    { added: 0, modified: 0, removed: 0, unchanged: 0 }
  )

  return {
    hasChanges: summary.added > 0 || summary.modified > 0 || summary.removed > 0,
    changes,
    summary
  }
}

/**
 * Detect if a createdBy change is just Baker maintenance (adding "- updated by Baker")
 */
function isBakerMaintenanceChange(oldValue: unknown, newValue: unknown): boolean {
  if (typeof oldValue !== 'string' || typeof newValue !== 'string') {
    return false
  }

  // Check if new value is just old value + Baker suffix
  const bakerSuffix = ' - updated by Baker'
  return (
    newValue === oldValue + bakerSuffix ||
    (newValue.endsWith(bakerSuffix) && newValue.startsWith(oldValue))
  )
}

/**
 * Compare breadcrumbs files for meaningful changes only (excluding maintenance)
 * Use this for determining if user confirmation is actually needed
 */
export function compareBreadcrumbsMeaningful(
  current: BreadcrumbsFile | null,
  updated: BreadcrumbsFile
): BreadcrumbsDiff {
  const fullDiff = compareBreadcrumbs(current, updated, true)

  // Filter out maintenance changes
  const meaningfulChanges = fullDiff.changes.filter(change => {
    // Always exclude scannedBy (pure maintenance)
    if (change.field === 'scannedBy') {
      return false
    }

    // For lastModified, allow changes if current value is invalid/corrupted
    if (change.field === 'lastModified') {
      if (change.type === 'added') {
        return true // Adding missing lastModified is meaningful
      }
      if (change.type === 'modified' && change.oldValue) {
        // Check if old value is invalid date - if so, fixing it is meaningful
        try {
          const oldDate = new Date(change.oldValue as string)
          if (isNaN(oldDate.getTime())) {
            return true // Fixing invalid date is meaningful
          }
        } catch {
          return true // Fixing unparseable date is meaningful
        }
      }
      return false // Otherwise, lastModified updates are maintenance
    }

    // Filter out Baker maintenance createdBy changes
    if (change.field === 'createdBy' && change.type === 'modified') {
      return !isBakerMaintenanceChange(change.oldValue, change.newValue)
    }

    // For folderSizeBytes, meaningful if added or modified (indicates content changes)
    if (change.field === 'folderSizeBytes') {
      return change.type === 'added' || change.type === 'modified'
    }

    return true
  })

  // Recalculate summary for meaningful changes only
  const summary = meaningfulChanges.reduce(
    (acc, change) => {
      acc[change.type]++
      return acc
    },
    { added: 0, modified: 0, removed: 0, unchanged: 0 }
  )

  return {
    hasChanges: summary.added > 0 || summary.modified > 0 || summary.removed > 0,
    changes: meaningfulChanges,
    summary
  }
}

/**
 * Generate a preview of what Baker will update
 */
export function generateBreadcrumbsPreview(
  current: BreadcrumbsFile | null,
  projectPath: string,
  projectData: {
    files: Array<{ camera: number; name: string; path: string }>
    cameraCount: number
  }
): BreadcrumbsPreview {
  const now = new Date().toISOString()

  // Generate what Baker would create/update
  const updated: BreadcrumbsFile = current
    ? {
        ...current,
        files: projectData.files,
        numberOfCameras: projectData.cameraCount,
        // Update createdBy format if it's an update
        createdBy: current.createdBy.endsWith(' - updated by Baker')
          ? current.createdBy
          : `${current.createdBy} - updated by Baker`,
        lastModified: now,
        scannedBy: 'Baker',
        // Add folder size if missing
        folderSizeBytes: current.folderSizeBytes || undefined
      }
    : {
        // New breadcrumbs file
        projectTitle: projectPath.split('/').pop() || 'Unknown Project',
        numberOfCameras: projectData.cameraCount,
        files: projectData.files,
        parentFolder: projectPath.split('/').slice(0, -1).join('/'),
        createdBy: 'Baker',
        creationDateTime: now,
        folderSizeBytes: undefined,
        lastModified: now,
        scannedBy: 'Baker'
      }

  // Generate full diff for preview display (includes maintenance fields)
  const fullDiff = compareBreadcrumbs(current, updated, true)

  // Generate meaningful diff for determining if changes actually matter
  const meaningfulDiff = compareBreadcrumbsMeaningful(current, updated)

  // Generate detailed change information
  const detailedChanges = generateProjectChangeDetail(projectPath, fullDiff)

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    debugComparison(current, updated)
  }

  return {
    current,
    updated,
    diff: fullDiff,
    meaningfulDiff,
    detailedChanges
  }
}

/**
 * Format field names for display
 */
export function formatFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    projectTitle: 'Project Title',
    numberOfCameras: 'Number of Cameras',
    files: 'Files',
    parentFolder: 'Parent Folder',
    createdBy: 'Created By',
    creationDateTime: 'Creation Date',
    folderSizeBytes: 'Folder Size',
    lastModified: 'Last Modified',
    scannedBy: 'Scanned By',
    trelloCardUrl: 'Trello Card'
  }

  return fieldNames[field] || field
}

/**
 * Format values for display in the diff
 */
export function formatFieldValue(value: unknown, field: string): string {
  if (value === null || value === undefined) {
    return 'Not set'
  }

  if (field === 'folderSizeBytes' && typeof value === 'number') {
    return formatFileSize(value)
  }

  if (field === 'files' && Array.isArray(value)) {
    return `${value.length} files`
  }

  if (
    field === 'creationDateTime' ||
    field === 'lastModified' ||
    field === 'creation date' ||
    field === 'last modified'
  ) {
    try {
      return new Date(value as string).toLocaleString()
    } catch {
      return String(value)
    }
  }

  if (field === 'trelloCardUrl' || field === 'trello card') {
    return String(value)
  }

  return String(value)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Categorize fields by their type and importance
 */
export function categorizeField(
  field: string
): { category: 'content' | 'metadata' | 'maintenance'; impact: 'high' | 'medium' | 'low' } {
  const fieldCategories = {
    // Content fields - directly affect project data
    files: { category: 'content', impact: 'high' },
    numberOfCameras: { category: 'content', impact: 'high' },
    projectTitle: { category: 'content', impact: 'medium' },
    trelloCardUrl: { category: 'content', impact: 'medium' },
    
    // Metadata fields - organizational information
    parentFolder: { category: 'metadata', impact: 'low' },
    folderSizeBytes: { category: 'metadata', impact: 'medium' },
    createdBy: { category: 'metadata', impact: 'low' },
    creationDateTime: { category: 'metadata', impact: 'low' },
    
    // Maintenance fields - system-generated information
    lastModified: { category: 'maintenance', impact: 'low' },
    scannedBy: { category: 'maintenance', impact: 'low' }
  } as const

  if (fieldCategories[field as keyof typeof fieldCategories]) {
    return fieldCategories[field as keyof typeof fieldCategories];
  } else {
    console.warn(`[breadcrumbsComparison] Unknown field encountered in categorizeField: '${field}'. Defaulting to category 'metadata' with 'medium' impact.`);
    return { category: 'metadata', impact: 'medium' };
  }

/**
 * Create detailed field change with formatted values and categorization
 */
export function createDetailedFieldChange(change: FieldChange): DetailedFieldChange {
  const { category, impact } = categorizeField(change.field)
  
  return {
    ...change,
    fieldDisplayName: formatFieldName(change.field),
    formattedOldValue: formatFieldValue(change.oldValue, change.field),
    formattedNewValue: formatFieldValue(change.newValue, change.field),
    category,
    impact
  }
}

/**
 * Generate detailed project change information
 */
export function generateProjectChangeDetail(
  projectPath: string,
  diff: BreadcrumbsDiff
): ProjectChangeDetail {
  const projectName = projectPath.split('/').pop() || 'Unknown Project'
  
  // Convert all changes to detailed changes
  const detailedChanges = diff.changes.map(createDetailedFieldChange)
  
  // Categorize changes (exclude unchanged fields by default)
  const changeCategories = {
    content: detailedChanges.filter(c => c.category === 'content' && c.type !== 'unchanged'),
    metadata: detailedChanges.filter(c => c.category === 'metadata' && c.type !== 'unchanged'),
    maintenance: detailedChanges.filter(c => c.category === 'maintenance' && c.type !== 'unchanged')
  }
  
  // Calculate summary (only count actual changes, not unchanged fields)
  const actualChanges = detailedChanges.filter(c => c.type !== 'unchanged')
  const summary = {
    contentChanges: changeCategories.content.length,
    metadataChanges: changeCategories.metadata.length,
    maintenanceChanges: changeCategories.maintenance.length,
    totalChanges: actualChanges.length
  }
  
  return {
    projectPath,
    projectName,
    hasChanges: diff.hasChanges,
    changeCategories,
    summary
  }
}

/**
 * Debug helper to log comparison results
 * Remove this in production - for debugging only
 */
export function debugComparison(
  current: BreadcrumbsFile | null,
  updated: BreadcrumbsFile
): void {
  console.group('🔍 Breadcrumbs Comparison Debug')

  const fullDiff = compareBreadcrumbs(current, updated, true)
  const meaningfulDiff = compareBreadcrumbsMeaningful(current, updated)

  console.log('📄 Current:', current)
  console.log('🆕 Updated:', updated)
  console.log('📊 Full Diff:', fullDiff)
  console.log('⚡ Meaningful Diff:', meaningfulDiff)

  console.log('🎯 Change Analysis:')
  fullDiff.changes.forEach(change => {
    const isMeaningful = meaningfulDiff.changes.some(
      mc => mc.field === change.field && mc.type === change.type
    )
    console.log(
      `  ${change.field}: ${change.type} ${isMeaningful ? '✅ MEANINGFUL' : '⚠️  MAINTENANCE'}`
    )
    if (change.oldValue !== change.newValue) {
      console.log(`    Old: ${JSON.stringify(change.oldValue)}`)
      console.log(`    New: ${JSON.stringify(change.newValue)}`)
    }
  })

  console.groupEnd()
}
