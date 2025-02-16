import { core } from '@tauri-apps/api'
import { Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Page from './app/dashboard/page'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import BuildProject from './pages/BuildProject'
import ConnectedApps from './pages/ConnectedApps'
import IngestHistory from './pages/IngestHistory'
import Posterframe from './pages/Posterframe'
import UploadOtter from './pages/UploadOtter'
import UploadSprout from './pages/UploadSprout'
import UploadTrello from './pages/UploadTrello'

// The AppRouter component switches the display if the user is not logged in
// The top level component, Page, acts as the provider for the layout
// subsequent components are loaded within the page window via the Outlet component.

export const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading screen while checking authentication
  if (isAuthenticated === null) {
    return <div>Loading...</div>
  }

  return (
    <Routes>
      {/* Ensure login and register routes are always accessible */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protect all other routes */}
      {!isAuthenticated ? (
        <>
          <Route path="*" element={<Navigate to="/login" state={{ from: location }} />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Page />}>
            <Route path="ingest">
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
