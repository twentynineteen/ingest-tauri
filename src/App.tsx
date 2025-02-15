import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Header from './components/nav/Header'
import Home from './pages/Home'

const App: React.FC = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/*" element={<Home />} />
      </Routes>
    </Router>
  )
}

export default App
