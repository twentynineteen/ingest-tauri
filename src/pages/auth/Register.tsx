// import { core } from '@tauri-apps/api'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStronghold } from 'src/context/StrongholdContext'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { stronghold, client } = useStronghold()
  const navigate = useNavigate() //  Get the navigation function

  async function handleRegister() {
    if (!client) {
      console.error('Stronghold client is not initialized')
      setError('Internal error. Please try again.')
      return
    }
    console.log('1. try to validate user input')
    try {
      // Validate user input before proceeding
      registerSchema.parse({ username, password })
      setError(null)
      console.log(`Errors: ${error}`)

      const store = client.getStore()
      const encoder = new TextEncoder()
      const encodedPassword = encoder.encode(password)

      //  Check if the username already exists
      console.log('Checking if user exists')
      const existingUser = await store.get(username)
      if (existingUser) {
        setError('Username already exists. Choose another one.')
        return
      }
      console.log('inserting the user data')
      //  Store the user data securely
      await store.insert(username, Array.from(new Uint8Array(encodedPassword)))

      //  Ensure Stronghold saves properly
      try {
        await stronghold?.save()
      } catch (saveError) {
        console.error('❌ Failed to save Stronghold:', saveError)
        setError('Could not complete registration. Try again.')
        return
      }

      console.log('Registration successful:', username)
      navigate('/login') //  Redirect to login after successful registration
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else {
        console.error('❌ Registration failed:', err)
        setError('Unexpected error occurred.')
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
