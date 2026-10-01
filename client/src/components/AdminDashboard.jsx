import { LogOut, RefreshCw, RotateCcw, TimerReset } from 'lucide-react'
import { useEffect, useState } from 'react'
import { adminResetPage, adminResetVotes, adminResetVotingTimer, adminSetVotingTimer, fetchVotingState } from '../api'

const TOKEN_KEY = 'livevote-admin-token'

export default function AdminDashboard() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [minutes, setMinutes] = useState(30)
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')

  function goHome() {
    window.history.replaceState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    goHome()
  }

  useEffect(() => {
    if (!token) return
    fetchVotingState()
      .then((data) => {
        setState(data)
        setMinutes(data.voting.durationMinutes)
      })
      .catch(() => {
        setMessage('Session expired.')
        sessionStorage.removeItem(TOKEN_KEY)
        setToken('')
      })
  }, [token])

  async function runAction(action, successMessage) {
    setLoading(true)
    setMessage('')
    try {
      const result = await action()
      setState(result)
      setMinutes(result.voting.durationMinutes)
      setMessage(successMessage)
    } catch (error) {
      if (error.message.includes('authentication')) logout()
      setMessage(error.message || 'Action failed.')
    } finally {
      setLoading(false)
    }
  }

  async function refreshVotes() {
    setRefreshing(true)
    try {
      const result = await fetchVotingState()
      setState(result)
      setMinutes(result.voting.durationMinutes)
    } catch (error) {
      setMessage(error.message || 'Could not refresh.')
    } finally {
      setRefreshing(false)
    }
  }

  if (!token) return null

  const candidates = state?.candidates || []
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.votes, 0)

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#c7a86b]">Admin</p>
          <h1 className="mt-1 text-3xl font-black text-[#f4efe6]">Control</h1>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold text-[#e7dfd4] transition hover:bg-white/[.08]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#8b847b]">Votes</p>
          <p className="mt-2 text-3xl font-black text-[#f4efe6]">{totalVotes}</p>
        </div>
        <div className="glass rounded-2xl p-4 sm:col-span-2">
          <p className="text-xs uppercase tracking-[0.16em] text-[#8b847b]">Timer</p>
          <p className="mt-2 text-sm font-bold text-[#d8c79e]">{state?.voting?.endAt ? new Date(state.voting.endAt).toLocaleString() : '-'}</p>
        </div>
      </section>

      <section className="glass mt-6 rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="admin-minutes" className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b847b]">Minutes</label>
            <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2">
              <TimerReset className="mr-2 h-4 w-4 text-[#c7a86b]" />
              <input
                id="admin-minutes"
                type="number"
                min="1"
                max="10080"
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-[#f4efe6] outline-none"
              />
              <span className="text-xs text-[#7d756c]">min</span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => runAction(() => adminSetVotingTimer(minutes, token), 'Timer updated.')}
            className="min-h-12 rounded-2xl bg-[#c7a86b] px-5 font-bold text-[#17150f] transition hover:bg-[#d1b77e] disabled:opacity-50"
          >
            Set Timer
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => runAction(() => adminResetVotingTimer(token), 'Timer reset.')}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-5 font-bold text-[#e7dfd4] transition hover:bg-white/[.08] disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Timer
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              const confirmed = window.confirm('Reset page and start a new voting round?')
              if (confirmed) runAction(() => adminResetPage(token), 'Page reset.')
            }}
            className="min-h-12 rounded-2xl border border-[#6b3e5c]/35 bg-[#6b3e5c]/20 px-5 font-bold text-[#eadfc9] transition hover:bg-[#6b3e5c]/30 disabled:opacity-50"
          >
            Reset Page
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              const confirmed = window.confirm("Reset all votes to 0? This will also clear every user's active vote.")
              if (confirmed) runAction(() => adminResetVotes(token), 'All votes reset to 0.')
            }}
            className="min-h-12 rounded-2xl border border-[#8c4f4f]/35 bg-[#8c4f4f]/15 px-5 font-bold text-[#eadfc9] transition hover:bg-[#8c4f4f]/25 disabled:opacity-50"
          >
            Reset All Votes to 0
          </button>

          <button
            type="button"
            onClick={refreshVotes}
            disabled={refreshing}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-5 font-bold text-[#e7dfd4] transition hover:bg-white/[.08] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Votes
          </button>
        </div>
      </section>

      {message && <p className="mt-4 text-sm text-[#d8c79e]">{message}</p>}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="glass flex items-center gap-4 rounded-2xl p-4">
            <img src={candidate.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-[#f4efe6]">{candidate.name}</p>
              <p className="mt-1 text-sm font-black text-[#c7a86b]">{candidate.votes}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
