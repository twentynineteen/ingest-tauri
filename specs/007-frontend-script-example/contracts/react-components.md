# React Component Contracts

**Feature**: 007-frontend-script-example
**Module**: `src/pages/AI/ExampleEmbeddings/`
**Date**: 2025-11-12

## Overview

This document defines the React component interfaces for the Example Embeddings management UI. All components follow the existing codebase patterns (TypeScript, React.FC, TailwindCSS, Radix UI).

## Component Tree

```
ExampleEmbeddings (Page)
├── ExampleList
│   └── ExampleCard (multiple)
│       ├── Preview text
│       ├── Metadata display
│       └── Action buttons
├── UploadDialog (modal)
│   ├── File picker button
│   ├── Metadata form
│   └── Upload button
└── DeleteConfirm (modal)
    ├── Warning message
    └── Confirm/Cancel buttons
```

## Component Definitions

### 1. ExampleEmbeddings (Page Component)

Main page component that orchestrates the feature.

**File**: `src/pages/AI/ExampleEmbeddings/ExampleEmbeddings.tsx`

**Props**: None (top-level page)

**State**:
```typescript
interface ExampleEmbeddingsState {
  uploadDialogOpen: boolean
  deleteDialogOpen: boolean
  selectedExampleId: string | null
  filterSource: 'all' | 'bundled' | 'user-uploaded'
}
```

**Hooks Used**:
- `useBreadcrumb([{ label: 'AI tools', href: '/ai-tools' }, { label: 'Example embeddings' }])`
- `useExampleManagement()` - Fetch and mutate examples
- `useState()` - Local dialog/filter state

**Behavior**:
- Sets breadcrumb navigation
- Fetches all examples on mount
- Manages dialog open/close state
- Handles filter selection
- Passes callbacks to child components

**Layout**:
```tsx
<div className="container mx-auto p-6">
  <header>
    <h1>Script Example Embeddings</h1>
    <p>Manage script examples for AI formatting</p>
    <Button onClick={() => setUploadDialogOpen(true)}>
      <Upload /> Upload Example
    </Button>
  </header>

  <Tabs value={filterSource} onValueChange={setFilterSource}>
    <TabsList>
      <TabsTrigger value="all">All ({total})</TabsTrigger>
      <TabsTrigger value="bundled">Bundled ({bundledCount})</TabsTrigger>
      <TabsTrigger value="user-uploaded">Uploaded ({userCount})</TabsTrigger>
    </TabsList>
  </Tabs>

  <ExampleList
    examples={filteredExamples}
    onDelete={(id) => { setSelectedExampleId(id); setDeleteDialogOpen(true) }}
    onReplace={(id) => { /* replace logic */ }}
  />

  <UploadDialog
    open={uploadDialogOpen}
    onClose={() => setUploadDialogOpen(false)}
    onUpload={handleUpload}
  />

  <DeleteConfirm
    open={deleteDialogOpen}
    onClose={() => setDeleteDialogOpen(false)}
    onConfirm={handleDelete}
    exampleTitle={selectedExample?.title}
  />
</div>
```

---

### 2. ExampleList

Grid/list view of example cards.

**File**: `src/pages/AI/ExampleEmbeddings/ExampleList.tsx`

**Props**:
```typescript
interface ExampleListProps {
  examples: ExampleWithMetadata[]
  onDelete: (id: string) => void
  onReplace: (id: string) => void
  isLoading?: boolean
}
```

**Behavior**:
- Displays examples in responsive grid (1-3 columns)
- Shows loading skeleton when `isLoading=true`
- Shows empty state when `examples.length === 0`
- Passes individual example + callbacks to ExampleCard

**Layout**:
```tsx
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
  </div>
) : examples.length === 0 ? (
  <EmptyState
    icon={<FileText />}
    title="No examples yet"
    description="Upload your first example to get started"
  />
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {examples.map(example => (
      <ExampleCard
        key={example.id}
        example={example}
        onDelete={() => onDelete(example.id)}
        onReplace={() => onReplace(example.id)}
      />
    ))}
  </div>
)}
```

---

### 3. ExampleCard

Individual example display card with actions.

**File**: `src/pages/AI/ExampleEmbeddings/ExampleCard.tsx`

**Props**:
```typescript
interface ExampleCardProps {
  example: ExampleWithMetadata
  onDelete: () => void
  onReplace: () => void
}
```

**Behavior**:
- Displays example metadata (title, category, source badge)
- Shows preview of before_text (first 200 chars, truncated)
- Displays tags as badges
- Shows action buttons (delete/replace) only for user-uploaded
- Uses Radix Card, Badge, Button components

**Layout**:
```tsx
<Card className="relative">
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <CardTitle className="text-lg">{example.title}</CardTitle>
        <p className="text-sm text-muted-foreground capitalize">
          {example.category}
        </p>
      </div>
      <Badge variant={example.source === 'bundled' ? 'secondary' : 'default'}>
        {example.source === 'bundled' ? 'Bundled' : 'Uploaded'}
      </Badge>
    </div>
  </CardHeader>

  <CardContent>
    <p className="text-sm text-muted-foreground line-clamp-3">
      {example.beforeText.substring(0, 200)}...
    </p>

    {example.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {example.tags.map(tag => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    )}
  </CardContent>

  <CardFooter className="flex justify-between">
    <div className="text-xs text-muted-foreground">
      {example.wordCount} words
    </div>

    {example.source === 'user-uploaded' && (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onReplace}>
          <RefreshCw className="w-4 h-4" />
          Replace
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>
    )}
  </CardFooter>
</Card>
```

---

### 4. UploadDialog

Modal dialog for uploading new examples.

**File**: `src/pages/AI/ExampleEmbeddings/UploadDialog.tsx`

**Props**:
```typescript
interface UploadDialogProps {
  open: boolean
  onClose: () => void
  onUpload: (data: UploadData) => Promise<void>
}

interface UploadData {
  beforeText: string
  afterText: string
  metadata: ExampleMetadata
  embedding: number[]
}
```

**State**:
```typescript
interface UploadDialogState {
  beforeFile: File | null
  afterFile: File | null
  title: string
  category: ExampleCategory
  tags: string[]
  qualityScore: number | null
  isGeneratingEmbedding: boolean
  validationErrors: Record<string, string>
}
```

**Hooks Used**:
- `useFileUpload()` - File selection and reading
- `useEmbedding()` - Generate embedding
- `useState()` - Form state
- `useForm()` (react-hook-form + zod) - Form validation

**Behavior**:
1. User selects "before" file (.txt)
2. User selects "after" file (.txt)
3. User fills metadata form
4. On submit:
   - Validate all fields
   - Read file contents
   - Generate embedding from beforeText
   - Call onUpload with data
   - Show progress/loading state
   - Close on success, show error on failure

**Layout**:
```tsx
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Upload Script Example</DialogTitle>
      <DialogDescription>
        Add a new script example to improve AI formatting suggestions
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Before file picker */}
        <div>
          <Label htmlFor="before-file">Original Script (.txt)</Label>
          <Input
            id="before-file"
            type="file"
            accept=".txt"
            onChange={(e) => setBeforeFile(e.target.files?.[0])}
          />
          {validationErrors.beforeFile && (
            <p className="text-sm text-destructive">{validationErrors.beforeFile}</p>
          )}
        </div>

        {/* After file picker */}
        <div>
          <Label htmlFor="after-file">Formatted Script (.txt)</Label>
          <Input
            id="after-file"
            type="file"
            accept=".txt"
            onChange={(e) => setAfterFile(e.target.files?.[0])}
          />
        </div>

        {/* Title input */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Tech Conference Keynote"
          />
        </div>

        {/* Category select */}
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="narrative">Narrative</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="documentary">Documentary</SelectItem>
              <SelectItem value="user-custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags input (comma-separated) */}
        <div>
          <Label htmlFor="tags">Tags (optional)</Label>
          <Input
            id="tags"
            value={tags.join(', ')}
            onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()))}
            placeholder="technical, formal, presentation"
          />
        </div>

        {/* Quality score slider */}
        <div>
          <Label htmlFor="quality">Quality Score (optional)</Label>
          <Slider
            id="quality"
            min={1}
            max={5}
            step={1}
            value={[qualityScore ?? 3]}
            onValueChange={([val]) => setQualityScore(val)}
          />
          <p className="text-sm text-muted-foreground">
            {qualityScore ? `${qualityScore}/5` : 'Not rated'}
          </p>
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isGeneratingEmbedding}>
          {isGeneratingEmbedding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating embedding...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

### 5. DeleteConfirm

Confirmation dialog for deleting examples.

**File**: `src/pages/AI/ExampleEmbeddings/DeleteConfirm.tsx`

**Props**:
```typescript
interface DeleteConfirmProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  exampleTitle?: string
  isDeleting?: boolean
}
```

**Behavior**:
- Shows warning message with example title
- Disables confirm button while deleting
- Closes automatically on successful delete
- Shows error toast on failure

**Layout**:
```tsx
<AlertDialog open={open} onOpenChange={onClose}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Example?</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete "{exampleTitle}"?
        This action cannot be undone and will remove the example
        from the database permanently.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={onConfirm}
        disabled={isDeleting}
        className="bg-destructive text-destructive-foreground"
      >
        {isDeleting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Deleting...
          </>
        ) : (
          'Delete'
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Shared Types

**File**: `src/types/exampleEmbeddings.ts`

```typescript
export interface ExampleWithMetadata {
  id: string
  title: string
  category: string
  beforeText: string
  afterText: string
  tags: string[]
  wordCount: number | null
  qualityScore: number | null
  source: 'bundled' | 'user-uploaded'
  createdAt: string
}

export interface ExampleMetadata {
  title: string
  category: ExampleCategory
  tags?: string[]
  qualityScore?: number
}

export enum ExampleCategory {
  EDUCATIONAL = 'educational',
  BUSINESS = 'business',
  NARRATIVE = 'narrative',
  INTERVIEW = 'interview',
  DOCUMENTARY = 'documentary',
  USER_CUSTOM = 'user-custom'
}
```

## Testing Contracts

### Component Tests

**Test File**: `tests/pages/AI/ExampleEmbeddings/ExampleEmbeddings.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExampleEmbeddings } from '@/pages/AI/ExampleEmbeddings/ExampleEmbeddings'

describe('ExampleEmbeddings', () => {
  it('should render example list', async () => {
    render(<ExampleEmbeddings />)

    await waitFor(() => {
      expect(screen.getByText(/Example Embeddings/i)).toBeInTheDocument()
    })
  })

  it('should open upload dialog when button clicked', async () => {
    const user = userEvent.setup()
    render(<ExampleEmbeddings />)

    await user.click(screen.getByRole('button', { name: /upload/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should filter examples by source', async () => {
    const user = userEvent.setup()
    render(<ExampleEmbeddings />)

    await user.click(screen.getByRole('tab', { name: /bundled/i }))

    // Assert only bundled examples visible
  })
})
```

## Accessibility Requirements

**ARIA Labels**:
- Upload button: `aria-label="Upload new example"`
- Delete button: `aria-label="Delete example"`
- Replace button: `aria-label="Replace example"`
- Filter tabs: `role="tablist"`

**Keyboard Navigation**:
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close dialogs
- Arrow keys for tab navigation

**Screen Reader Support**:
- Announce dialog open/close
- Announce loading states
- Announce success/error messages

## Version History

- **v1.0.0** (2025-11-12): Initial component contracts
