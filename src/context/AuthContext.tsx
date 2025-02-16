import { core } from '@tauri-apps/api'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  login: (token: string, username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const storedUsername = localStorage.getItem('username')

        if (!token || !storedUsername) {
          setIsAuthenticated(false)
          setUsername(null)
          return
        }

        const response = await core.invoke<string>('check_auth', { token })
        setIsAuthenticated(response.includes('authenticated'))
        setUsername(storedUsername)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        setUsername(null)
      }
    }

    checkAuth()
  }, [])

  const login = (token: string, username: string) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('username', username) // store username
    setIsAuthenticated(true) // 🔥 This triggers a UI update
    setUsername(username)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('username')
    setIsAuthenticated(false)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
