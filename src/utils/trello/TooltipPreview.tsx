import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@components/ui/tooltip'
import React from 'react'

interface TooltipPreviewProps {
  trigger: React.ReactNode
  content: string | React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

const TooltipPreview: React.FC<TooltipPreviewProps> = ({
  trigger,
  content,
  side = 'top',
  align = 'start'
}) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className="max-w-[400px] max-h-[300px] overflow-auto bg-white p-3 border border-gray-300 rounded shadow text-xs font-mono whitespace-pre-wrap text-gray-600"
        >
          {typeof content === 'string' ? <pre>{content}</pre> : content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default TooltipPreview
