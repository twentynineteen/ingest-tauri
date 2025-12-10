/**
 * Premiere Plugin Manager Page Component
 *
 * Install and manage Premiere Pro CEP extensions directly from the app.
 * Automatically deploys plugin updates to your Premiere Pro installation.
 */

import ErrorBoundary from '@components/ErrorBoundary'
import { Button } from '@components/ui/button'
import { useBreadcrumb } from '@hooks/useBreadcrumb'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FolderOpen,
  Package,
  RefreshCw
} from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  filename: string
  size: number
  installed: boolean
  description: string
  features: string[]
  icon: string
}

interface InstallResult {
  success: boolean
  message: string
  pluginName: string
  installedPath: string
}

const PremierePluginManagerContent: React.FC = () => {
  // Set breadcrumbs for navigation
  useBreadcrumb([
    { label: 'Upload content', href: '/upload/sprout' },
    { label: 'Premiere Plugin Manager' }
  ])

  const queryClient = useQueryClient()

  // Fetch available plugins
  const {
    data: plugins,
    isLoading,
    error
  } = useQuery({
    queryKey: ['plugins'],
    queryFn: async () => {
      return await invoke<PluginInfo[]>('get_available_plugins')
    }
  })

  // Install plugin mutation
  const installMutation = useMutation({
    mutationFn: async ({ filename, name }: { filename: string; name: string }) => {
      return await invoke<InstallResult>('install_plugin', {
        pluginFilename: filename,
        pluginName: name
      })
    },
    onSuccess: result => {
      toast.success(result.message)
      queryClient.invalidateQueries({ queryKey: ['plugins'] })
    },
    onError: (error: Error) => {
      toast.error(`Installation failed: ${error.message}`)
    }
  })

  // Open CEP folder
  const handleOpenFolder = async () => {
    try {
      await invoke('open_cep_folder')
    } catch (error) {
      toast.error(`Failed to open folder: ${error}`)
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-full pb-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-card/50">
          <h1 className="text-2xl font-bold text-foreground">Premiere Plugin Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Install and manage Premiere Pro CEP extensions directly from the app.
            Automatically deploys plugin updates to your Premiere Pro installation.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4 max-w-full">
          {/* Step 1: Available Plugins */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Available Plugins
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Install Premiere Pro extensions with one click
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Loading plugins...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mt-3">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-destructive mr-2 flex-shrink-0" />
                  <span className="text-sm text-destructive">
                    Error loading plugins:{' '}
                    {error instanceof Error ? error.message : 'Unknown error'}
                  </span>
                </div>
              </div>
            )}

            {/* Plugin List */}
            {plugins && plugins.length > 0 && (
              <div className="mt-3 space-y-3">
                {plugins.map(plugin => (
                  <div
                    key={plugin.name}
                    className="bg-card border border-border rounded-xl shadow-sm p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Plugin Icon */}
                      <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 flex-shrink-0">
                        <img
                          src={plugin.icon}
                          alt={`${plugin.displayName} icon`}
                          className="w-10 h-10 object-contain"
                          onError={e => {
                            // Fallback to Package icon if image fails to load
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget
                              .nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'block'
                          }}
                        />
                        <Package
                          className="w-8 h-8 text-primary hidden"
                          style={{ display: 'none' }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {plugin.displayName}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              v{plugin.version} • {(plugin.size / 1024).toFixed(0)} KB
                            </p>
                          </div>

                          {plugin.installed && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/20 text-success text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Installed
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {plugin.description}
                        </p>

                        <div className="mb-3">
                          <p className="text-xs font-semibold text-foreground mb-1">
                            Features:
                          </p>
                          <ul className="space-y-1">
                            {plugin.features.map((feature, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-muted-foreground flex items-start gap-1"
                              >
                                <span className="text-primary mt-0.5">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button
                          onClick={() =>
                            installMutation.mutate({
                              filename: plugin.filename,
                              name: plugin.name
                            })
                          }
                          disabled={installMutation.isPending || plugin.installed}
                          size="sm"
                          className="gap-1.5"
                        >
                          {installMutation.isPending ? (
                            <>
                              <Download className="w-3.5 h-3.5 animate-pulse" />
                              Installing...
                            </>
                          ) : plugin.installed ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Installed
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              Install Plugin
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Settings */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-foreground">Settings</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage plugin installation settings
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  CEP Extensions Folder
                </p>
                <Button
                  onClick={handleOpenFolder}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Open Extensions Folder
                </Button>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  After installing plugins, restart Premiere Pro to see them in{' '}
                  <strong className="text-foreground">Window &gt; Extensions</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const PremierePluginManager: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="max-w-md">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Premiere Plugin Manager Error
            </h2>
            <div className="text-muted-foreground mb-6">
              <p>An error occurred while loading this page. This could be due to:</p>
              <ul className="text-left mt-2 space-y-1">
                <li>• Plugin file access issues</li>
                <li>• CEP directory permissions</li>
                <li>• System compatibility problems</li>
              </ul>
              {error && process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left bg-muted/50 p-4 rounded-md text-sm border border-border">
                  <summary className="cursor-pointer font-medium text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Error:</strong> {error.message}
                    </p>
                  </div>
                </details>
              )}
            </div>
            <Button onClick={retry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}
    >
      <PremierePluginManagerContent />
    </ErrorBoundary>
  )
}

export default PremierePluginManager
