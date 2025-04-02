// tauri auto updater on app launch
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
// The AppRouter component switches the display if the user is not logged in
// The top level component, Page, acts as the provider for the layout
// subsequent components are loaded within the page window via the Outlet component.

import Page from './app/dashboard/page'
// import { useAuth } from './context/AuthProvider'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import BuildProject from './pages/BuildProject'
import ConnectedApps from './pages/ConnectedApps'
import IngestHistory from './pages/IngestHistory'
import Posterframe from './pages/Posterframe'
import Settings from './pages/Settings'
import UploadOtter from './pages/UploadOtter'
import UploadSprout from './pages/UploadSprout'
import UploadTrello from './pages/UploadTrello'
import { loadApiKeys } from './utils/storage'

export const AppRouter: React.FC = () => {
  const isAuthenticated = true // Track authentication state
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    const updateApp = async () => {
      // try to update on load
      try {
        const update = await check()

        if (update && 'version' in update) {
          console.log(
            `found update ${update.version} from ${update.date} with notes ${update.body}`
          )
          let downloaded = 0
          let contentLength = 0
          // alternatively we could also call update.download() and update.install() separately
          await update.downloadAndInstall(event => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength
                console.log(`started downloading ${event.data.contentLength} bytes`)
                break
              case 'Progress':
                downloaded += event.data.chunkLength
                console.log(`downloaded ${downloaded} from ${contentLength}`)
                break
              case 'Finished':
                console.log('download finished')
                break
            }
          })

          console.log('update installed')
          await relaunch()
        } else {
          console.log('No update found')
        }
      } catch (error) {
        console.error('Error during update check: ', error)
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
            <Route path="ingest" element={<BuildProject />}>
              <Route path="history" element={<IngestHistory />} />

              <Route path="build" element={<BuildProject />} />
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
