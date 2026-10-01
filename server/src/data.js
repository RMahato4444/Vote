export const CANDIDATES = [
  { id: 'tyson', name: 'Tyson', role: 'Candidate', image: '/assets/candidates/tyson.jpg' },
  { id: 'jishu', name: 'Jishu', role: 'Candidate', image: '/assets/candidates/jishu.jpg' },
  { id: 'rahul', name: 'Rahul', role: 'Candidate', image: '/assets/candidates/rahul.jpg' },
  { id: 'souvik', name: 'Souvik', role: 'Candidate', image: '/assets/candidates/souvik.jpg' },
  { id: 'mukesh', name: 'Mukesh', role: 'Candidate', image: '/assets/candidates/mukesh.jpg' },
  { id: 'abhishek', name: 'Abhishek', role: 'Candidate', image: '/assets/candidates/abhishek.jpg' },
  { id: 'rana', name: 'Rana', role: 'Candidate', image: '/assets/candidates/rana.jpg' }
]

export const candidateIds = new Set(CANDIDATES.map((candidate) => candidate.id))

export function hydrateCandidates(voteDocs) {
  const counts = new Map(voteDocs.map((doc) => [doc.candidateId, doc.votes]))
  return CANDIDATES.map((candidate) => ({
    ...candidate,
    votes: counts.get(candidate.id) ?? 0
  }))
}
