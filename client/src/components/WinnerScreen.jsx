import { Sparkles, Trophy } from 'lucide-react'

export default function WinnerScreen({ winner }) {
  const isTie = winner?.type === 'tie'
  const winners = isTie ? winner.candidates : winner?.candidate ? [winner.candidate] : []

  return (
    <main className="winner-screen relative isolate flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="winner-orb winner-orb-one" />
      <div className="winner-orb winner-orb-two" />
      <div className="winner-confetti" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, index) => <span key={index} />)}
      </div>

      <section className="relative z-10 w-full max-w-4xl text-center">
        <div className="winner-crown mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#c7a86b]/30 bg-[#c7a86b]/10 shadow-2xl">
          <Trophy className="h-10 w-10 text-[#c7a86b]" />
        </div>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.45em] text-[#c7a86b]">{isTie ? 'Tie' : 'Winner'}</p>

        {winners.length === 0 ? (
          <h1 className="mt-4 text-5xl font-black tracking-tight text-[#f4efe6] sm:text-7xl">No winner</h1>
        ) : (
          <div className="mt-7 flex flex-wrap items-start justify-center gap-8">
            {winners.map((candidate) => (
              <div key={candidate.id} className="winner-card w-full max-w-[250px] rounded-[2rem] border border-white/10 bg-white/[.04] p-5 backdrop-blur-xl">
                <img
                  src={candidate.image}
                  alt={`${candidate.name} profile`}
                  className="mx-auto h-36 w-36 rounded-[2rem] border border-white/10 object-cover shadow-2xl sm:h-44 sm:w-44"
                />
                <h1 className="mt-5 text-4xl font-black tracking-tight text-[#f4efe6] sm:text-5xl">{candidate.name}</h1>
                <p className="mt-2 text-sm font-semibold text-[#d8c79e]">{candidate.votes} vote{candidate.votes === 1 ? '' : 's'}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mx-auto mt-8 flex items-center justify-center gap-2 text-[#a89f94]">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm">Final result</span>
          <Sparkles className="h-4 w-4" />
        </div>
      </section>
    </main>
  )
}
