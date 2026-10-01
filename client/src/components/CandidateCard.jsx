import { CheckCircle2, Loader2, RotateCcw, Vote } from 'lucide-react'

export default function CandidateCard({ candidate, totalVotes, loading, onVote, onRemove, votingOpen, userVote }) {
  const percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0
  const hasVoted = Boolean(userVote)
  const selected = userVote === candidate.id

  return (
    <article className={`group relative overflow-hidden rounded-[2rem] border p-4 shadow-glow transition duration-300 sm:p-5 ${
      votingOpen
        ? 'border-white/10 bg-[#17171b]/85 hover:-translate-y-1 hover:border-[#c7a86b]/35'
        : 'border-white/5 bg-[#17171b]/60 opacity-85'
    }`}>
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c7a86b] to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <img
            src={candidate.image}
            alt={`${candidate.name} profile`}
            className="h-28 w-28 rounded-[2rem] border border-white/10 object-cover shadow-2xl sm:h-32 sm:w-32"
          />
          {selected && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-[#17171b] bg-[#a7b39a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#161713]">
              Voted
            </span>
          )}
        </div>

        <div className="mt-4 w-full">
          <div className="flex items-end justify-between gap-3">
            <div className="text-left">
              <h2 className="text-xl font-bold tracking-tight text-[#f4efe6] sm:text-2xl">{candidate.name}</h2>
              <p className="mt-0.5 text-xs text-[#a89f94]">{candidate.role}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tabular-nums text-[#f4efe6] sm:text-3xl">{candidate.votes}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b847b]">votes</p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#2a292e]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6b3e5c] via-[#9a5b79] to-[#c7a86b] transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {!hasVoted ? (
        <button
          type="button"
          onClick={() => onVote(candidate.id)}
          disabled={!votingOpen || loading}
          className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-[#17150f] shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
            votingOpen
              ? 'bg-[#c7a86b] shadow-[#c7a86b]/10 hover:bg-[#d1b77e]'
              : 'bg-[#4a4844] text-white/70'
          }`}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Vote className="h-5 w-5" />}
          {votingOpen ? `Vote ${candidate.name}` : 'Voting ended'}
        </button>
      ) : selected ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={!votingOpen || loading}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#c7a86b]/25 bg-[#6b3e5c]/20 px-4 py-3 font-bold text-[#eadfc9] transition hover:bg-[#6b3e5c]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
          Remove vote
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2b292a] px-4 py-3 font-bold text-[#77716a]"
        >
          <CheckCircle2 className="h-5 w-5" />
          Vote locked
        </button>
      )}
    </article>
  )
}
