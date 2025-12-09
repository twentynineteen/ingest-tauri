import React from 'react'

interface ProgressBarProps {
  progress: number
  completed: boolean
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, completed }) => {
  // Show progress bar when progress is 0 or greater, but hide when completed
  if (progress < 0 || completed) {
    return null
  }

  return (
    <div className="w-full bg-secondary rounded-lg overflow-hidden h-8 relative">
      <div
        className="bg-primary h-full flex items-center justify-center text-sm font-semibold text-primary-foreground transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-foreground drop-shadow-sm">
          {progress.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

export default ProgressBar
