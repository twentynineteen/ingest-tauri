/**
 * DiffEditor Component
 * Feature: 006-i-wish-to (T046)
 * Purpose: Monaco Editor for viewing and editing formatted output
 */

import Editor, { loader } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import React, { useEffect, useRef, useState } from 'react'

// Configure loader to use CDN
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.53.0/min/vs'
  }
})

interface DiffEditorProps {
  original: string // Kept for compatibility but not displayed
  modified: string
  onModifiedChange: (value: string) => void
  height?: string
}

export const DiffEditor: React.FC<DiffEditorProps> = ({ modified, onModifiedChange }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onModifiedChange(value)
    }
  }

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    setIsEditorReady(true)

    // Force layout after mount
    setTimeout(() => {
      editor.layout()
    }, 100)
  }

  // Re-layout editor when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden mb-2 flex flex-col h-[calc(100vh-300px)]">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between shrink-0">
        <span className="text-sm font-medium text-gray-700">
          Formatted Script (Editable)
        </span>
        <span className="text-xs text-gray-500">Use **text** for bold formatting</span>
      </div>

      <div ref={containerRef} className="flex-1 relative">
        {!isEditorReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading editor...</p>
              <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
            </div>
          </div>
        )}
        <Editor
          height="100%"
          width="100%"
          language="markdown"
          value={modified || ''}
          defaultValue={modified || ''}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading Monaco Editor...</p>
                <p className="text-xs text-gray-500 mt-2">
                  If this persists, check browser console for errors
                </p>
              </div>
            </div>
          }
          options={{
            wordWrap: 'bounded',
            wrappingStrategy: 'advanced',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            readOnly: false,
            automaticLayout: true,
            renderWhitespace: 'selection',
            tabSize: 2,
            unicodeHighlight: {
              ambiguousCharacters: false,
              invisibleCharacters: false,
              nonBasicASCII: false
            }
          }}
          theme="vs-light"
        />
      </div>
    </div>
  )
}
