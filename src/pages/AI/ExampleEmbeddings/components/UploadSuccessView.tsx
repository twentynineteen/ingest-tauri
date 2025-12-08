/**
 * UploadSuccessView Component
 *
 * Displays success state after a successful upload.
 */

import { Button } from '@/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { CheckCircle } from 'lucide-react'

interface UploadSuccessViewProps {
  uploadedTitle: string
  onClose: () => void
  onUploadAnother: () => void
}

export function UploadSuccessView({
  uploadedTitle,
  onClose,
  onUploadAnother
}: UploadSuccessViewProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          Upload Successful!
        </DialogTitle>
        <DialogDescription>
          Your script example has been added to the library.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="rounded-md border border-success/20 bg-success/10 p-4">
          <p className="text-sm font-medium text-success">Uploaded Example</p>
          <p className="text-lg font-semibold text-success mt-1">{uploadedTitle}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">✓ Example added to the database</p>
          <p className="text-sm text-muted-foreground">
            ✓ Available for AI-powered script formatting
          </p>
          <p className="text-sm text-muted-foreground">
            ✓ List will update automatically when you close this dialog
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="button" onClick={onUploadAnother}>
          Upload Another
        </Button>
      </DialogFooter>
    </>
  )
}
