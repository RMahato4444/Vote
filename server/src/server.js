import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import crypto from 'crypto'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import { Vote } from './models/Vote.js'
import { Voter } from './models/Voter.js'
import { VotingTimer } from './models/VotingTimer.js'
import { CANDIDATES, candidateIds, hydrateCandidates } from './data.js'

const app = express()
const server = http.createServer(app)
const port = Number(process.env.PORT || 5000)
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'sprite@piyo'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234567'
const ADMIN_SESSION_HOURS = Math.max(1, Number(process.env.ADMIN_SESSION_HOURS || 12))
const adminSessions = new Map()

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST', 'DELETE']
  }
})

app.use(cors({ origin: clientUrl }))
app.use(express.json())

const configuredEndAt = process.env.VOTING_END_AT ? new Date(process.env.VOTING_END_AT) : null
const configuredDurationMinutes = Math.max(1, Number(process.env.VOTING_DURATION_MINUTES || 30))

if (configuredEndAt && Number.isNaN(configuredEndAt.getTime())) {
  throw new Error('VOTING_END_AT is invalid. Use an ISO date such as 2026-10-02T00:00:00+05:30.')
}

let votingEndAt = configuredEndAt || null
let timerDurationMinutes = configuredDurationMinutes

function isVotingOpen() {
  return Boolean(votingEndAt) && Date.now() < votingEndAt.getTime()
}

function cleanupAdminSessions() {
  const now = Date.now()
  for (const [token, expiresAt] of adminSessions.entries()) {
    if (expiresAt <= now) adminSessions.delete(token)
  }
}

function requireAdmin(req, res, next) {
  cleanupAdminSessions()
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const expiresAt = adminSessions.get(token)

  if (!token || !expiresAt || expiresAt <= Date.now()) {
    return res.status(401).json({ message: 'Admin authentication required.' })
  }

  next()
}

async function getCandidates() {
  const voteDocs = await Vote.find({}).lean()
  return hydrateCandidates(voteDocs)
}

function getWinner(candidates) {
  const maxVotes = Math.max(...candidates.map((candidate) => candidate.votes))
  if (!Number.isFinite(maxVotes) || maxVotes <= 0) return null

  const winners = candidates.filter((candidate) => candidate.votes === maxVotes)
  return winners.length === 1
    ? { type: 'winner', candidate: winners[0] }
    : { type: 'tie', candidates: winners }
}

async function getVotingState(voterId = '') {
  const candidates = await getCandidates()
  const voter = voterId ? await Voter.findOne({ voterId }).lean() : null
  const ended = !isVotingOpen()

  return {
    candidates,
    userVote: voter?.candidateId || null,
    voting: {
      endAt: votingEndAt ? votingEndAt.toISOString() : null,
      durationMinutes: timerDurationMinutes,
      ended,
      serverNow: new Date().toISOString(),
      winner: ended ? getWinner(candidates) : null
    }
  }
}

async function ensureTimer() {
  const existing = await VotingTimer.findOne({ key: 'main' }).lean()
  const voteCount = await Vote.countDocuments({})

  if (existing) {
    votingEndAt = new Date(existing.endAt)
    timerDurationMinutes = existing.durationMinutes

    // Apply the requested initial Tyson count once to an existing installation.
    // The flag prevents a later admin reset-to-zero from being overwritten on restart.
    if (!existing.tysonInitialised) {
      await Vote.updateOne(
        { candidateId: 'tyson' },
        { $set: { votes: 5 } },
        { upsert: true }
      )
      await seedVotes()
      await VotingTimer.updateOne(
        { key: 'main' },
        { $set: { tysonInitialised: true } }
      )
    } else if (voteCount === 0) {
      await seedVotes(0)
    } else {
      await seedVotes()
    }
    return
  }

  // First-ever setup starts with Tyson on 5 and every other candidate on 0.
  await Voter.deleteMany({})
  await Vote.deleteMany({})
  await seedVotes(5)

  const initialEndAt = configuredEndAt || new Date(Date.now() + configuredDurationMinutes * 60 * 1000)
  votingEndAt = initialEndAt
  timerDurationMinutes = configuredDurationMinutes

  await VotingTimer.create({
    key: 'main',
    durationMinutes: timerDurationMinutes,
    endAt: votingEndAt,
    tysonInitialised: true
  })
}

async function saveTimer(durationMinutes) {
  timerDurationMinutes = Math.max(1, Math.min(10080, Math.round(Number(durationMinutes))))
  votingEndAt = new Date(Date.now() + timerDurationMinutes * 60 * 1000)

  await VotingTimer.findOneAndUpdate(
    { key: 'main' },
    { $set: { durationMinutes: timerDurationMinutes, endAt: votingEndAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
}

async function seedVotes(initialTysonVotes = 0) {
  await Promise.all(
    CANDIDATES.map((candidate) =>
      Vote.updateOne(
        { candidateId: candidate.id },
        { $setOnInsert: { candidateId: candidate.id, votes: candidate.id === 'tyson' ? initialTysonVotes : 0 } },
        { upsert: true }
      )
    )
  )
}

async function resetPage() {
  // A reset starts a brand-new round: remove all previous voter locks
  // and recreate the candidate vote documents with exactly 0 votes.
  await Voter.deleteMany({})
  await Vote.deleteMany({})
  await seedVotes()
  await saveTimer(timerDurationMinutes)
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'realtime-voting-server',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    votingEndsAt: votingEndAt?.toISOString() || null,
    votingEnded: !isVotingOpen()
  })
})

app.get('/api/candidates', async (_req, res) => {
  try {
    res.json(await getCandidates())
  } catch (error) {
    console.error('GET /api/candidates failed:', error)
    res.status(500).json({ message: 'Could not load candidates.' })
  }
})

app.get('/api/voting-state', async (req, res) => {
  try {
    res.json(await getVotingState(String(req.query.voterId || '')))
  } catch (error) {
    console.error('GET /api/voting-state failed:', error)
    res.status(500).json({ message: 'Could not load voting state.' })
  }
})

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {}

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  cleanupAdminSessions()
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000
  adminSessions.set(token, expiresAt)

  return res.json({ token, expiresAt: new Date(expiresAt).toISOString() })
})

app.post('/api/admin/voting-timer', requireAdmin, async (req, res) => {
  try {
    const minutes = Number(req.body?.minutes)

    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 10080) {
      return res.status(400).json({ message: 'Timer must be between 1 and 10080 minutes.' })
    }

    await saveTimer(minutes)
    const state = await getVotingState()
    io.emit('vote:update', state)
    return res.json(state)
  } catch (error) {
    console.error('POST /api/admin/voting-timer failed:', error)
    return res.status(500).json({ message: 'Could not set the voting timer.' })
  }
})

app.post('/api/admin/voting-timer/reset', requireAdmin, async (_req, res) => {
  try {
    await saveTimer(timerDurationMinutes)
    const state = await getVotingState()
    io.emit('vote:update', state)
    return res.json(state)
  } catch (error) {
    console.error('POST /api/admin/voting-timer/reset failed:', error)
    return res.status(500).json({ message: 'Could not reset the timer.' })
  }
})

app.post('/api/admin/reset-page', requireAdmin, async (_req, res) => {
  try {
    await resetPage()
    const state = await getVotingState()
    io.emit('vote:update', state)
    return res.json(state)
  } catch (error) {
    console.error('POST /api/admin/reset-page failed:', error)
    return res.status(500).json({ message: 'Could not reset the page.' })
  }
})

app.post('/api/admin/reset-votes', requireAdmin, async (_req, res) => {
  try {
    await Voter.deleteMany({})
    await Vote.deleteMany({})
    await seedVotes(0)

    const state = await getVotingState()
    io.emit('vote:update', state)
    return res.json(state)
  } catch (error) {
    console.error('POST /api/admin/reset-votes failed:', error)
    return res.status(500).json({ message: 'Could not reset all votes.' })
  }
})

app.post('/api/vote', async (req, res) => {
  try {
    const { candidateId, voterId } = req.body || {}

    if (!candidateId || !candidateIds.has(candidateId)) {
      return res.status(400).json({ message: 'Invalid candidate.' })
    }

    if (!voterId || typeof voterId !== 'string' || voterId.length < 12 || voterId.length > 120) {
      return res.status(400).json({ message: 'A valid voter device ID is required.' })
    }

    if (!isVotingOpen()) {
      const state = await getVotingState(voterId)
      return res.status(403).json({ message: 'Voting has ended.', ...state })
    }

    const existingVote = await Voter.findOne({ voterId }).lean()
    if (existingVote) {
      const state = await getVotingState(voterId)
      return res.status(409).json({ message: 'You have already voted.', ...state })
    }

    try {
      await Voter.create({ voterId, candidateId })
    } catch (error) {
      if (error?.code === 11000) {
        const state = await getVotingState(voterId)
        return res.status(409).json({ message: 'You have already voted.', ...state })
      }
      throw error
    }

    await Vote.findOneAndUpdate(
      { candidateId },
      { $inc: { votes: 1 } },
      { upsert: true, new: true }
    )

    const state = await getVotingState(voterId)
    io.emit('vote:update', { candidates: state.candidates, voting: state.voting })
    return res.status(201).json(state)
  } catch (error) {
    console.error('POST /api/vote failed:', error)
    res.status(500).json({ message: 'Could not record the vote.' })
  }
})

app.delete('/api/vote', async (req, res) => {
  try {
    const { voterId } = req.body || {}

    if (!voterId || typeof voterId !== 'string') {
      return res.status(400).json({ message: 'A valid voter device ID is required.' })
    }

    if (!isVotingOpen()) {
      const state = await getVotingState(voterId)
      return res.status(403).json({ message: 'Voting has ended.', ...state })
    }

    const removedVote = await Voter.findOneAndDelete({ voterId }).lean()
    if (!removedVote) {
      return res.status(404).json({ message: 'No active vote found.', ...(await getVotingState(voterId)) })
    }

    await Vote.findOneAndUpdate(
      { candidateId: removedVote.candidateId, votes: { $gt: 0 } },
      { $inc: { votes: -1 } }
    )

    const state = await getVotingState(voterId)
    io.emit('vote:update', { candidates: state.candidates, voting: state.voting })
    return res.json(state)
  } catch (error) {
    console.error('DELETE /api/vote failed:', error)
    res.status(500).json({ message: 'Could not remove the vote.' })
  }
})

io.on('connection', async (socket) => {
  try {
    socket.emit('vote:update', { ...(await getVotingState()), userVote: null })
  } catch (error) {
    console.error('Socket sync failed:', error)
  }
})

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Create server/.env from server/.env.example.')
  }

  await mongoose.connect(process.env.MONGODB_URI)
  await ensureTimer()

  server.listen(port, () => {
    console.log(`Voting API listening on http://localhost:${port}`)
    console.log(`Allowed frontend origin: ${clientUrl}`)
    console.log(`Voting ends at: ${votingEndAt.toISOString()}`)
  })
}

start().catch((error) => {
  console.error('Server failed to start:', error)
  process.exit(1)
})
