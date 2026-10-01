import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { RefreshCw, Sparkles, Trophy } from 'lucide-react'
import CandidateCard from './components/CandidateCard'
import LiveSummary from './components/LiveSummary'
import VotingTimer from './components/VotingTimer'
import WinnerScreen from './components/WinnerScreen'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import { API_BASE, fetchVotingState, removeVote, submitVote } from './api'

const DEFAULT_CANDIDATES = [
  { id: 'tyson', name: 'Tyson', role: 'Candidate', image: '/assets/candidates/tyson.jpg', votes: 0 },
  { id: 'jishu', name: 'Jishu', role: 'Candidate', image: '/assets/candidates/jishu.jpg', votes: 0 },
  { id: 'rahul', name: 'Rahul', role: 'Candidate', image: '/assets/candidates/rahul.jpg', votes: 0 },
  { id: 'souvik', name: 'Souvik', role: 'Candidate', image: '/assets/candidates/souvik.jpg', votes: 0 },
  { id: 'mukesh', name: 'Mukesh', role: 'Candidate', image: '/assets/candidates/mukesh.jpg', votes: 0 },
  { id: 'abhishek', name: 'Abhishek', role: 'Candidate', image: '/assets/candidates/abhishek.jpg', votes: 0 },
  { id: 'rana', name: 'Rana', role: 'Candidate', image: '/assets/candidates/rana.jpg', votes: 0 }
]

function getVoterId() {
  const key = 'livevote-voter-id'
  const current = localStorage.getItem(key)
  if (current) return current

  const value = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `voter-${Date.now()}-${Math.random().toString(36).slice(2)}`

  localStorage.setItem(key, value)
  return value
}

function currentPath() {
  return window.location.pathname
}

function App() {
  const [path, setPath] = useState(currentPath())
  const [voterId] = useState(getVoterId)
  const [candidates, setCandidates] = useState(DEFAULT_CANDIDATES)
  const [userVote, setUserVote] = useState(null)
  const [loadingId, setLoadingId] = useState(null)
  const [message, setMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [endAt, setEndAt] = useState(null)
  const [serverTimeOffset, setServerTimeOffset] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [serverEnded, setServerEnded] = useState(false)
  const [winner, setWinner] = useState(null)

  const totalVotes = useMemo(() => candidates.reduce((sum, item) => sum + item.votes, 0), [candidates])

  function applyVotingState(state, withUserVote = false) {
    if (!state) return
    setCandidates(state.candidates || DEFAULT_CANDIDATES)
    if (withUserVote) setUserVote(state.userVote || null)
    if (state.voting) {
      setEndAt(state.voting.endAt)
      setServerEnded(Boolean(state.voting.ended))
      setWinner(state.voting.winner || null)
      if (state.voting.serverNow) {
        setServerTimeOffset(new Date(state.voting.serverNow).getTime() - Date.now())
      }
    }
  }

  useEffect(() => {
    const handlePath = () => setPath(currentPath())
    window.addEventListener('popstate', handlePath)
    return () => window.removeEventListener('popstate', handlePath)
  }, [])

  useEffect(() => {
    if (path !== '/') return undefined

    let mounted = true
    fetchVotingState(voterId)
      .then((data) => mounted && applyVotingState(data, true))
      .catch(() => mounted && setMessage('Could not connect to the voting server.'))

    const socket = io(API_BASE, { transports: ['websocket', 'polling'] })
    socket.on('connect', () => mounted && setConnected(true))
    socket.on('disconnect', () => mounted && setConnected(false))
    socket.on('vote:update', (data) => mounted && applyVotingState(data, false))

    return () => {
      mounted = false
      socket.disconnect()
    }
  }, [path, voterId])

  useEffect(() => {
    if (!endAt || path !== '/') return undefined

    const tick = () => {
      const now = Date.now() + serverTimeOffset
      const seconds = Math.max(0, Math.ceil((new Date(endAt).getTime() - now) / 1000))
      setRemainingSeconds(seconds)
      if (seconds === 0) setServerEnded(true)
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [endAt, serverTimeOffset, path])

  useEffect(() => {
    if (!serverEnded || winner || path !== '/') return undefined
    let cancelled = false
    fetchVotingState(voterId)
      .then((data) => !cancelled && applyVotingState(data, true))
      .catch(() => {})
    return () => { cancelled = true }
  }, [serverEnded, winner, path, voterId])

  async function refreshVotes() {
    setRefreshing(true)
    setMessage('')
    try {
      const data = await fetchVotingState(voterId)
      applyVotingState(data, true)
      setMessage('')
    } catch (error) {
      setMessage(error.message || 'Could not refresh the vote totals.')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleVote(candidateId) {
    if (serverEnded || remainingSeconds <= 0 || userVote) return
    setLoadingId(candidateId)
    setMessage('')

    try {
      const result = await submitVote(candidateId, voterId)
      applyVotingState(result, true)
    } catch (error) {
      setMessage(error.message || 'Vote failed.')
      if (error.message === 'Voting has ended.') setServerEnded(true)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleRemoveVote() {
    if (!userVote || serverEnded) return
    setLoadingId(userVote)
    setMessage('')

    try {
      const result = await removeVote(voterId)
      applyVotingState(result, true)
    } catch (error) {
      setMessage(error.message || 'Could not remove the vote.')
    } finally {
      setLoadingId(null)
    }
  }

  if (path === '/admin-login') return <AdminLogin />
  if (path === '/admin') return <AdminDashboard />

  if (serverEnded) return <WinnerScreen winner={winner} />

  const votingOpen = remainingSeconds > 0

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[#f4efe6]">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />

      <header className="relative z-10 border-b border-white/5 bg-[#0f1012]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c7a86b]/10 ring-1 ring-[#c7a86b]/20">
              <Sparkles className="h-5 w-5 text-[#c7a86b]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#f4efe6] sm:text-base">LiveVote</p>
              <p className="text-[11px] text-[#736d66]">Live</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[.03] px-3 py-1.5 text-xs text-[#a89f94]">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-[#a7b39a]' : 'bg-[#c7a86b]'}`} />
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <Trophy className="mx-auto h-7 w-7 text-[#c7a86b]" />
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#f4efe6] sm:text-5xl md:text-6xl">Cast your vote For Team Leader Tyson</h1>
        </section>

        <div className="mx-auto mt-8 max-w-5xl">
          <VotingTimer remainingSeconds={remainingSeconds} />
        </div>

        <div className="mx-auto mt-5 max-w-5xl">
          <LiveSummary candidates={candidates} totalVotes={totalVotes} connected={connected} />
        </div>

        <section className="mx-auto mt-7 max-w-5xl">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#f4efe6] sm:text-2xl">Candidates</h2>
            </div>
            <button
              type="button"
              onClick={refreshVotes}
              disabled={refreshing}
              aria-label="Refresh vote totals"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-[#e7dfd4] transition hover:border-[#c7a86b]/25 hover:bg-[#c7a86b]/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Votes</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                totalVotes={totalVotes}
                loading={loadingId === candidate.id}
                onVote={handleVote}
                onRemove={handleRemoveVote}
                votingOpen={votingOpen}
                userVote={userVote}
              />
            ))}
          </div>
        </section>

        {message && (
          <div className="mx-auto mt-5 max-w-5xl rounded-2xl border border-[#6b3e5c]/30 bg-[#6b3e5c]/10 px-4 py-3 text-sm text-[#eadfc9]">
            {message}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
