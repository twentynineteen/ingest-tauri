import { Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Page from './app/dashboard/page'
import { useStronghold } from './context/StrongholdContext'
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
  const { stronghold, client, isInitialized } = useStronghold() // Get Stronghold instance
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // Track authentication state
  const location = useLocation()
  const navigate = useNavigate() // To navigate after login

  // Check authentication on component mount
  useEffect(() => {
    if (!isInitialized || !client) {
      console.warn('Waiting for Stronghold to initialize...')
      return
    }
    async function checkAuth() {
      try {
        console.log('Checking authentication...')
        const store = client.getStore()
        const storedUser = await store.get('authenticated') // Retrieve stored username

        if (storedUser) {
          console.log('User authenticated.')
          setIsAuthenticated(true)
        } else {
          console.log('No user found, redirecting to login.')
          setIsAuthenticated(false)
          navigate('/login') // redirect to login page if user not found
        }
      } catch (error) {
        console.error('Failed to check authentication:', error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [client, isInitialized]) // Runs when Stronghold client is ready

  // Show loading screen while checking authentication
  if (isInitialized === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        Checking authentication...
      </div>
    )
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
