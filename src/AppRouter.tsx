import { Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
// The AppRouter component switches the display if the user is not logged in
// The top level component, Page, acts as the provider for the layout
// subsequent components are loaded within the page window via the Outlet component.

// import {
//   checkFullDiskAccessPermissions,
//   requestFullDiskAccessPermissions
// } from 'tauri-plugin-macos-permissions-api'
import Page from './app/dashboard/page'
// import { useAuth } from './context/AuthProvider'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import BuildProject from './pages/BuildProject'
import ConnectedApps from './pages/ConnectedApps'
import IngestHistory from './pages/IngestHistory'
import Posterframe from './pages/Posterframe'
import UploadOtter from './pages/UploadOtter'
import UploadSprout from './pages/UploadSprout'
import UploadTrello from './pages/UploadTrello'

// async function requestPermissions() {
//   const checked = await checkFullDiskAccessPermissions()
//   if (checked) {
//     console.log('Checked permissions: ', checked)
//   }
//   const granted = await requestFullDiskAccessPermissions()
//   if (!granted) {
//     console.error('Full disk access permission denied.')
//   }
// }

export const AppRouter: React.FC = () => {
  // const { isAuthenticated } = useAuth() // Track authentication state
  const isAuthenticated = true // Track authentication state
  // requestFullDiskAccessPermissions()

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
