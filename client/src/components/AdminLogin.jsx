import { LockKeyhole, LogIn } from 'lucide-react'
import { useState } from 'react'
import { adminLogin } from '../api'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  function goAdmin() {
    window.history.replaceState({}, '', '/admin')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await adminLogin(username, password)
      sessionStorage.setItem('livevote-admin-token', result.token)
      goAdmin()
    } catch (error) {
      setMessage(error.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="glass w-full max-w-md rounded-[2rem] p-6 shadow-glow sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c7a86b]/10 text-[#c7a86b]">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-center text-2xl font-black text-[#f4efe6]">Admin</h1>

        <div className="mt-6 space-y-4">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Username"
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 text-sm text-[#f4efe6] outline-none placeholder:text-[#6f6860] focus:border-[#c7a86b]/40"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 text-sm text-[#f4efe6] outline-none placeholder:text-[#6f6860] focus:border-[#c7a86b]/40"
          />
        </div>

        {message && <p className="mt-4 text-center text-sm text-[#e0b0a0]">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#c7a86b] px-4 py-3 font-bold text-[#17150f] transition hover:bg-[#d1b77e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogIn className="h-5 w-5" />
          {loading ? '...' : 'Login'}
        </button>
      </form>
    </main>
  )
}
