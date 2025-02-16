import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStronghold } from 'src/context/StrongholdContext'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const Login: React.FC = () => {
  const { stronghold, client } = useStronghold() // Use global login state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate() // To navigate after login

  const handleLogin = async () => {
    if (!client) {
      console.error('Stronghold client is not initialized')
      setError('Internal error. Please try again')
      return
    }

    try {
      console.log('Attempting to login...')
      const store = client.getStore()

      // Timeout for login process (5s)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout exceeded!')), 5000)
      )

      // Fetch stored password with timeout
      const storedPasswordData = await Promise.race([store.get(username), timeoutPromise])

      // Validate credentials
      console.log('Validating creds.')
      loginSchema.parse({ username, password })

      if (storedPasswordData) {
        console.log('Login successful. Storing authentication state..')

        const storedPassword = new TextDecoder().decode(
          new Uint8Array(storedPasswordData)
        )
        if (storedPassword === password) {
          console.log('login successful')

          await store.insert('authenticated', [1]) // Store authentication flag
          await store.insert('username', Array.from(new TextEncoder().encode(username)))

          // Timeout for `stronghold.save()`
          await Promise.race([
            stronghold?.save(),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error('Stronghold save timeout exceeded!')),
                5000
              )
            )
          ])

          navigate('/') // Redirect to home/dashboard
        } else {
          console.warn('Invalid password')
          setError('Invalid password.')
        }
      } else {
        console.warn('Username not found')
        setError('Invalid username.')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.message.includes('timeout')) {
        setError('Login took too long. Please try again.')
      } else {
        setError('Login failed. Check your credentials.')
      }
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
    </div>
  )
}

export default Login
