import { getCookie } from '@components/lib/utils'
import { core } from '@tauri-apps/api'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from 'src/context/AuthContext'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth() // Use global login state
  const navigate = useNavigate() // To navigate after login

  const handleLogin = async () => {
    try {
      // Validate credentials
      loginSchema.parse({ username, password })

      // Call Tauri backend for login
      const accessToken = await core.invoke<string>('login', { username, password })

      if (typeof accessToken === 'string') {
        // Securely store the username and access token using Stronghold
        await core.invoke('set_secure_value', { key: 'username', value: username })
        await core.invoke('set_secure_value', { key: 'accessToken', value: accessToken })

        // Update global auth state and redirect.
        login(accessToken, username)
        navigate('/') // 🔥 Redirect to home/dashboard
      } else {
        setError('Invalid login response.')
      }
    } catch (err) {
      setError('Login failed. Check your credentials.')
    }
  }

  // Auto-refresh access token when expired
  const refreshAccessToken = async () => {
    const refreshToken = getCookie('refresh_token')

    if (!refreshToken) {
      console.error('No refresh token found. User must log in again.')
      return
    }

    try {
      const newToken = await core.invoke<string>('refresh_access_token', { refreshToken })
      if (typeof newToken === 'string') {
        // Update secure storage with the new access token
        await core.invoke('set_secure_value', { key: 'accessToken', value: newToken })
        console.log('Access token refreshed!')
      } else {
        console.error('Session expired! Please log in again.')
      }
    } catch (error) {
      console.error('Failed to refresh access token:', error)
    }
  }

  // Call refreshAccessToken() whenever token expires

  return (
    <div className="flex flex-col p-6 max-w-sm mx-auto bg-white shadow-md rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      />
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600"
      >
        Login
      </button>
      <p className="mt-3">
        No account? click{' '}
        <Link to="/register" className="font-bold text-blue-600">
          here
        </Link>{' '}
        to register
      </p>
    </div>
  )
}
