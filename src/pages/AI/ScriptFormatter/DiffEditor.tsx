/**
 * DiffEditor Component
 * Feature: 006-i-wish-to (T046)
 * Purpose: Monaco Editor diff viewer with editable output
 */

import React, { useRef, useEffect } from 'react'
import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface DiffEditorProps {
  original: string
  modified: string
  onModifiedChange: (value: string) => void
  height?: string
}

export const DiffEditor: React.FC<DiffEditorProps> = ({
  original,
  modified,
  onModifiedChange,
  height = '600px',
}) => {
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)

  const handleEditorDidMount = (editor: editor.IStandaloneDiffEditor) => {
    editorRef.current = editor

    // FR-018: Listen to modifications on the modified (right) side
    const modifiedEditor = editor.getModifiedEditor()
    modifiedEditor.onDidChangeModelContent(() => {
      const newValue = modifiedEditor.getValue()
      onModifiedChange(newValue)
    })
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Original</span>
          <span className="text-gray-400">↔</span>
          <span className="text-sm font-medium text-gray-700">Formatted (Editable)</span>
        </div>
        <span className="text-xs text-gray-500">
          GitHub-style diff • Use right panel to edit
        </span>
      </div>

      <MonacoDiffEditor
        height={height}
        language="markdown"
        original={original}
        modified={modified}
        onMount={handleEditorDidMount}
        options={{
          renderSideBySide: true, // GitHub-style side-by-side
          renderIndicators: true, // Show +/- indicators
          renderMarginRevertIcon: true, // Gutter icons to revert changes
          originalEditable: false, // Read-only original (left side)
          readOnly: false, // Editable modified (right side) - FR-018
          enableSplitViewResizing: true, // Allow resizing panes
          renderOverviewRuler: true, // Show overview ruler
          wordWrap: 'on', // Wrap long lines
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
        }}
        theme="vs-light"
      />
    </div>
  )
}
