import { useAuth } from 'hooks/useAuth'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createNamespacedLogger } from '../../utils/logger'

const logger = createNamespacedLogger('Login')

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate() // To navigate after login

  const handleLogin = async () => {
    setError(null) // Clear previous errors

    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }

    try {
      logger.log('Validating creds.')
      loginSchema.parse({ username, password })
      const fakeToken = `token_${username}` // Simulating a token
      await login(fakeToken, username)
      navigate('/') // Navigate to home after successful login
    } catch {
      setError('Invalid username or password format')
    }
  }

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
      {isAuthenticated ? <p>authenticated!</p> : <p>not authenticated</p>}
    </div>
  )
}

export default Login
