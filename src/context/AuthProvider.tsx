import { invoke } from '@tauri-apps/api/core'
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

        // Call Tauri backend
        const response = await invoke<string>('check_auth', { token })
        if (response.includes('authenticated')) {
          setIsAuthenticated(true)
          setUsername(storedUsername)
        } else {
          logout() // Remove invalid token
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        logout()
      }
    }

    checkAuth()
  }, [])

  const login = async (token: string, username: string) => {
    try {
      await invoke('add_token', { token }) // Add token to backend
      localStorage.setItem('access_token', token)
      localStorage.setItem('username', username)
      setIsAuthenticated(true)
      setUsername(username)
    } catch (error) {
      console.error('Login failed:', error)
    }
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
