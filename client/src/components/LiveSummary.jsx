import { Activity, Radio, UsersRound } from 'lucide-react'

export default function LiveSummary({ candidates, totalVotes, connected }) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="glass rounded-2xl p-4 shadow-glow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8b847b]">Live votes</span>
          <Activity className="h-4 w-4 text-[#c7a86b]" />
        </div>
        <p className="mt-2 text-2xl font-black tabular-nums text-[#f4efe6]">{totalVotes}</p>
      </div>
      <div className="glass rounded-2xl p-4 shadow-glow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8b847b]">Candidates</span>
          <UsersRound className="h-4 w-4 text-[#a7b39a]" />
        </div>
        <p className="mt-2 text-2xl font-black tabular-nums text-[#f4efe6]">{candidates.length}</p>
      </div>
      <div className="glass rounded-2xl p-4 shadow-glow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8b847b]">Connection</span>
          <Radio className={`h-4 w-4 ${connected ? 'text-[#a7b39a]' : 'text-[#c7a86b]'}`} />
        </div>
        <p className={`mt-2 text-lg font-bold ${connected ? 'text-[#b8c7ad]' : 'text-[#e1c27e]'}`}>
          {connected ? 'Live' : 'Reconnecting'}
        </p>
      </div>
    </section>
  )
}
