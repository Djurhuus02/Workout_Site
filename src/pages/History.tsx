import { WorkoutSession } from '../types'
import WorkoutCard from '../components/WorkoutCard'

interface Props {
  workouts: WorkoutSession[]
  onDelete: (id: string) => void
}

export default function History({ workouts, onDelete }: Props) {
  if (workouts.length === 0) {
    return (
      <div className="px-4 pt-6 pb-6">
        <h1 className="text-2xl font-bold text-white mb-6">History</h1>
        <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto mb-3 text-gray-700">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className="text-gray-600 text-sm">No workouts logged yet.</p>
          <p className="text-gray-600 text-sm mt-1">Complete your first session to see it here.</p>
        </div>
      </div>
    )
  }

  // Group by month
  const grouped = new Map<string, WorkoutSession[]>()
  for (const w of workouts) {
    const month = new Date(w.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    const arr = grouped.get(month) ?? []
    arr.push(w)
    grouped.set(month, arr)
  }

  return (
    <div className="px-4 pt-6 pb-6">
      <h1 className="text-2xl font-bold text-white mb-6">History</h1>
      <div className="space-y-6">
        {[...grouped.entries()].map(([month, monthWorkouts]) => (
          <div key={month}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-semibold text-gray-400">{month}</span>
              <span className="text-xs text-gray-600">{monthWorkouts.length} workout{monthWorkouts.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {monthWorkouts.map(w => (
                <WorkoutCard
                  key={w.id}
                  workout={w}
                  onDelete={() => onDelete(w.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
