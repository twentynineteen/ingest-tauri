// tauri auto updater on app launch
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
// The AppRouter component switches the display if the user is not logged in
// The top level component, Page, acts as the provider for the layout
// subsequent components are loaded within the page window via the Outlet component.

import Page from './app/dashboard/page'
import { ExampleEmbeddings } from './pages/AI/ExampleEmbeddings/ExampleEmbeddings'
import ScriptFormatter from './pages/AI/ScriptFormatter/ScriptFormatter'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Baker from './pages/Baker/Baker'
import BuildProject from './pages/BuildProject/BuildProject'
import ConnectedApps from './pages/ConnectedApps'
import IngestHistory from './pages/IngestHistory'
import Posterframe from './pages/Posterframe'
import Settings from './pages/Settings'
import UploadOtter from './pages/UploadOtter'
import UploadSprout from './pages/UploadSprout'
import UploadTrello from './pages/UploadTrello'
import { createNamespacedLogger } from './utils/logger'

const log = createNamespacedLogger('AppRouter')

export const AppRouter: React.FC = () => {
  const isAuthenticated = true // Track authentication state

  useEffect(() => {
    const updateApp = async () => {
      if (process.env.NODE_ENV === 'development') return // Skip updates in dev mode

      try {
        const update = await check()
        log.debug('Update check result:', update)

        // Only proceed if an actual update is returned
        if (update?.version) {
          log.info(`Found update: ${update.version}`)

          let downloaded = 0
          let contentLength = 0

          await update.downloadAndInstall(event => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength
                log.info(`Started downloading ${event.data.contentLength} bytes`)
                break
              case 'Progress':
                downloaded += event.data.chunkLength
                log.debug(`Downloaded ${downloaded} from ${contentLength}`)
                break
              case 'Finished':
                log.info('Download finished')
                break
            }
          })

          log.info('Update installed')
          await relaunch()
        } else {
          log.debug('No update available')
        }
      } catch (err) {
        console.error('[AppRouter] Updater error:', err)
      }
    }

    updateApp()
  }, [])

  return (
    <Routes>
      {/* Ensure login and register routes are always accessible */}

      {/* Protect all other routes */}
      {!isAuthenticated ? (
        <>
          {/* <Route path="/" element={<Login />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* <Route path="*" element={<Navigate to="/login" />} /> */}
        </>
      ) : (
        <>
          {/* Default redirect to BuildProject */}
          <Route path="/" element={<Navigate to="/ingest/build" replace />} />

          {/* <Route path="*" element={<Navigate to="/ingest/build" />} /> */}
          <Route path="/" element={<Page />}>
            <Route path="ingest">
              <Route path="history" element={<IngestHistory />} />
              <Route path="build" element={<BuildProject />} />
              <Route path="baker" element={<Baker />} />
            </Route>
            <Route path="ai-tools">
              <Route path="script-formatter" element={<ScriptFormatter />} />
              <Route path="example-embeddings" element={<ExampleEmbeddings />} />
            </Route>
            <Route path="upload">
              <Route path="sprout" element={<UploadSprout />} />
              <Route path="posterframe" element={<Posterframe />} />
              <Route path="trello" element={<UploadTrello />} />
              <Route path="otter" element={<UploadOtter />} />
            </Route>
            <Route path="settings">
              <Route path="general" element={<Settings />} />
              <Route path="connected-apps" element={<ConnectedApps />} />
            </Route>
          </Route>
        </>
      )}
    </Routes>
  )
}

export default AppRouter
