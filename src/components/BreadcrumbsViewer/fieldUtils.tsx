/**
 * Field rendering utilities for BreadcrumbsViewer
 * Extracted from BreadcrumbsViewerEnhanced.tsx (DEBT-002)
 */

import type { FieldChange } from '@/types/baker'
import { formatFieldValue } from '@utils/breadcrumbsComparison'
import { Edit, Minus, Plus } from 'lucide-react'
import React from 'react'

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getChangeIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'added':
      return <Plus className="h-3 w-3 text-success" />
    case 'modified':
      return <Edit className="h-3 w-3 text-warning" />
    case 'removed':
      return <Minus className="h-3 w-3 text-destructive" />
    default:
      return null
  }
}

export const getChangeColor = (type: string): string => {
  switch (type) {
    case 'added':
      return 'bg-success/10 border-success/30'
    case 'modified':
      return 'bg-warning/10 border-warning/30'
    case 'removed':
      return 'bg-destructive/10 border-destructive/30'
    default:
      return 'bg-background border-border'
  }
}

interface FieldProps {
  label: string
  value: unknown
  icon?: React.ReactNode
  change?: FieldChange
}

export const Field: React.FC<FieldProps> = ({ label, value, icon, change }) => {
  const changeColor = change ? getChangeColor(change.type) : 'bg-background border-border'
  const changeIcon = change ? getChangeIcon(change.type) : null

  return (
    <div className={`p-2 border rounded ${changeColor}`}>
      <label className="flex items-center text-xs font-medium text-muted-foreground">
        {changeIcon && <span className="mr-1">{changeIcon}</span>}
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </label>
      <p className="text-foreground mt-1">
        {formatFieldValue(value, label.toLowerCase())}
      </p>
    </div>
  )
}
