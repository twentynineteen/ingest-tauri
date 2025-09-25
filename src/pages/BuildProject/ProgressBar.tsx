import React from 'react'

interface ProgressBarProps {
  progress: number
  completed: boolean
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, completed }) => {
  console.log('ProgressBar received props:', { progress, completed })
  
  // Show progress bar when progress is 0 or greater, but hide when completed
  if (progress < 0 || completed) {
    console.log('ProgressBar returning null - progress:', progress, 'completed:', completed)
    return null
  }

  return (
    <div className="w-full bg-gray-200 rounded-lg overflow-hidden mt-4">
      <div
        className="bg-blue-600 text-xs leading-none py-1 text-center text-white"
        style={{ width: `${progress}%` }}
      >
        {progress.toFixed(1)}%
      </div>
    </div>
  )
}

export default ProgressBar
