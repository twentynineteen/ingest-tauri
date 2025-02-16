import { core } from '@tauri-apps/api'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate() // ✅ Get the navigation function

  async function handleRegister() {
    try {
      registerSchema.parse({ username, password })
      setError(null)

      // Call Tauri backend (Rust) for user registration
      const response = await core.invoke('register', { username, password })
      console.log('Registration successful:', response)

      // If your registration command returns a token, store it.
      const token = (response as any)?.token || ''

      // Use Stronghold secure storage to store the username.
      await core.invoke('set_secure_value', { key: 'username', value: username })
      if (token) {
        await core.invoke('set_secure_value', { key: 'accessToken', value: token })
      }

      // Redirect to the login page.
      // navigate('/login')
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else {
        setError('Registration failed')
      }
    }
  }

  return (
    <div className="flex flex-col p-6 max-w-sm mx-auto bg-white shadow-md rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Register</h2>
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
        onClick={handleRegister}
        className="bg-green-500 text-white p-2 rounded w-full hover:bg-green-600"
      >
        Register
      </button>
      <p className="mt-3">
        Registered? click{' '}
        <Link to="/login" className="font-bold text-blue-600">
          here
        </Link>{' '}
        to log in.
      </p>
    </div>
  )
}
