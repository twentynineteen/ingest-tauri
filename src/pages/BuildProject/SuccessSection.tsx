import { RefreshCw } from 'lucide-react'
import { TrelloCardsManager } from '../../components/Baker/TrelloCardsManager'

interface SuccessSectionProps {
  showSuccess: boolean
  selectedFolder: string
  title: string
  trelloApiKey: string
  trelloApiToken: string
  onStartNew: () => void
}

export const SuccessSection: React.FC<SuccessSectionProps> = ({
  showSuccess,
  selectedFolder,
  title,
  trelloApiKey,
  trelloApiToken,
  onStartNew
}) => {
  // Check all required conditions
  if (!showSuccess) {
    return null
  }

  if (!selectedFolder) {
    return null
  }

  if (!title) {
    return null
  }

  return (
    <div
      className="px-6 mt-4 animate-in fade-in slide-in-from-bottom-4"
      data-test="success-section-visible"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-success/10 via-success/5 to-transparent border-2 border-success/30 rounded-xl p-6 shadow-lg">
        {/* Start New Project Button - Top Right */}
        <button
          onClick={onStartNew}
          className="absolute top-4 right-4 inline-flex items-center justify-center gap-2
            px-4 py-2 text-xs font-semibold
            text-foreground bg-card border border-border
            hover:bg-secondary hover:border-primary/30
            rounded-lg shadow-sm hover:shadow
            focus:ring-2 focus:outline-none focus:ring-ring
            transition-all duration-200 z-10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Start New Project
        </button>

        {/* Success Icon & Message */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-success/10 rounded-full p-3 border-2 border-success/30">
              <svg
                className="w-8 h-8 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-success text-center mb-2">
          Project Created Successfully!
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-4">
          Your project has been created and is ready for editing
        </p>

        {/* Trello Cards Manager */}
        <TrelloCardsManager
          projectPath={selectedFolder}
          trelloApiKey={trelloApiKey}
          trelloApiToken={trelloApiToken}
          autoSyncToTrello={true}
        />
      </div>
    </div>
  )
}
