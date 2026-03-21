import { WorkoutSession, Page } from '../types'
import WorkoutCard from '../components/WorkoutCard'
import { totalVolume } from '../utils/calculations'

interface Props {
  workouts: WorkoutSession[]
  isActive: boolean
  onNavigate: (page: Page) => void
  onDeleteWorkout: (id: string) => void
}

export default function Dashboard({ workouts, isActive, onNavigate, onDeleteWorkout }: Props) {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  const thisWeek = workouts.filter(w => new Date(w.date) >= weekStart)
  const weekVolume = thisWeek.reduce((sum, w) => sum + totalVolume(w), 0)

  const greet = () => {
    const h = today.getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="px-4 pt-6 pb-6">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">{greet()}</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">LiftTracker</h1>
      </div>

      {/* This week stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">This week</p>
          <p className="text-2xl font-bold text-white">{thisWeek.length}</p>
          <p className="text-xs text-gray-500 mt-1">{thisWeek.length === 1 ? 'workout' : 'workouts'}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Weekly volume</p>
          <p className="text-2xl font-bold text-white">{weekVolume >= 1000 ? `${(weekVolume / 1000).toFixed(1)}t` : `${weekVolume}`}</p>
          <p className="text-xs text-gray-500 mt-1">kg lifted</p>
        </div>
      </div>

      {/* Start / Resume button */}
      {isActive ? (
        <button
          onClick={() => onNavigate('workout')}
          className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-lg transition-colors mb-6 flex items-center justify-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          Resume Workout
        </button>
      ) : (
        <button
          onClick={() => onNavigate('workout')}
          className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg transition-colors mb-6"
        >
          + Start Workout
        </button>
      )}

      {/* Recent workouts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Recent Workouts</h2>
          {workouts.length > 3 && (
            <button onClick={() => onNavigate('history')} className="text-orange-500 text-sm hover:text-orange-400 transition-colors">
              See all
            </button>
          )}
        </div>

        {workouts.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
            <p className="text-gray-600 text-sm">No workouts yet.</p>
            <p className="text-gray-600 text-sm mt-1">Hit "Start Workout" to log your first session!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.slice(0, 3).map(w => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onDelete={() => onDeleteWorkout(w.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
