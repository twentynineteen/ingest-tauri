import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import AppRouter from './AppRouter'
import { AuthProvider } from './context/AuthProvider'

// The app component acts as the main routing generator for the application.
// AppRouter wraps the app routes to make use of the useLocation method within react-router-dom
// The top level component, Page, acts as the provider for the layout
// subsequent components are loaded within the page window via the Outlet component.

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRouter />
      </Router>
    </AuthProvider>
  )
}

export default App
