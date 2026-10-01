export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function parseResponse(response, fallback) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || fallback)
  return payload
}

export async function fetchVotingState(voterId = '') {
  const query = voterId ? `?voterId=${encodeURIComponent(voterId)}` : ''
  const response = await fetch(`${API_BASE}/api/voting-state${query}`)
  return parseResponse(response, 'Could not load voting state')
}

export async function submitVote(candidateId, voterId) {
  const response = await fetch(`${API_BASE}/api/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId, voterId })
  })
  return parseResponse(response, 'Vote could not be submitted')
}

export async function removeVote(voterId) {
  const response = await fetch(`${API_BASE}/api/vote`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterId })
  })
  return parseResponse(response, 'Vote could not be removed')
}

export async function adminLogin(username, password) {
  const response = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  return parseResponse(response, 'Invalid credentials')
}

async function adminFetch(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  })
  return parseResponse(response, 'Admin action failed')
}

export async function adminSetVotingTimer(minutes, token) {
  return adminFetch('/api/admin/voting-timer', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes: Number(minutes) })
  })
}

export async function adminResetVotingTimer(token) {
  return adminFetch('/api/admin/voting-timer/reset', token, { method: 'POST' })
}

export async function adminResetPage(token) {
  return adminFetch('/api/admin/reset-page', token, { method: 'POST' })
}

export async function adminResetVotes(token) {
  return adminFetch('/api/admin/reset-votes', token, { method: 'POST' })
}
