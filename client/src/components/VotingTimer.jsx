import { Clock3 } from 'lucide-react'

function formatTime(totalSeconds) {
  const seconds = Math.max(0, totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':')
}

export default function VotingTimer({ remainingSeconds }) {
  return (
    <section className="rounded-[2rem] border border-[#c7a86b]/15 bg-[#6b3e5c]/10 p-5 shadow-glow sm:p-6">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-[#c7a86b]" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8c79e]">Time left</span>
        </div>
        <p className="font-mono text-4xl font-black tabular-nums tracking-wider text-[#f4efe6] sm:text-5xl">
          {formatTime(remainingSeconds)}
        </p>
      </div>
    </section>
  )
}
