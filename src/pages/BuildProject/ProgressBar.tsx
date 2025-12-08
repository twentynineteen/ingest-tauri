import React from 'react'
import { createNamespacedLogger } from '../../utils/logger'

const logger = createNamespacedLogger('ProgressBar')

interface ProgressBarProps {
  progress: number
  completed: boolean
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, completed }) => {
  logger.log('ProgressBar received props:', { progress, completed })

  // Show progress bar when progress is 0 or greater, but hide when completed
  if (progress < 0 || completed) {
    logger.log(
      'ProgressBar returning null - progress:',
      progress,
      'completed:',
      completed
    )
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
