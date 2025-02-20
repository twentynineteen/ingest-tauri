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
  const navigate = useNavigate() // Get the navigation function

  async function handleRegister() {
    setError(null) // Clear previous errors

    // Validate user input
    const result = registerSchema.safeParse({ username, password })
    if (!result.success) {
      setError(result.error.errors[0].message) // Show validation error
      return
    }

    try {
      // Check if user already exists
      const existingUser = localStorage.getItem(`user_${username}`)
      if (existingUser) {
        setError('Username already taken.')
        return
      }

      // Store user credentials in localStorage (simple approach, not secure)
      const userData = JSON.stringify({ username, password })
      localStorage.setItem(`user_${username}`, userData)

      // Redirect to login page after successful registration
      navigate('/login')
    } catch (err) {
      console.error('Registration failed:', err)
      setError('An error occurred while registering. Please try again.')
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
        Registered? Click{' '}
        <Link to="/login" className="font-bold text-blue-600">
          here
        </Link>{' '}
        to log in.
      </p>
    </div>
  )
}
