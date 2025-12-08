/**
 * WorkflowIndicator Component
 * Displays the workflow progress steps
 */

import React from 'react'
import type { WorkflowStep } from '../../../../hooks/useScriptFormatterState'

interface WorkflowIndicatorProps {
  currentStep: WorkflowStep
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  'upload',
  'select-model',
  'processing',
  'review',
  'download'
]

export const WorkflowIndicator: React.FC<WorkflowIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-between max-w-4xl mx-auto">
      {WORKFLOW_STEPS.map((step, idx) => (
        <div
          key={step}
          className={`flex items-center ${
            currentStep === step ? 'text-black font-medium' : 'text-muted-foreground/50'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === step ? 'bg-black text-white' : 'bg-muted'
            }`}
          >
            {idx + 1}
          </div>
          <span className="ml-2 text-sm capitalize">{step.replace('-', ' ')}</span>
          {idx < 4 && <div className="w-12 h-0.5 bg-muted mx-4" />}
        </div>
      ))}
    </div>
  )
}
