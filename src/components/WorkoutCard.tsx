import { useState } from 'react'
import { WorkoutSession } from '../types'
import { totalVolume, formatDuration } from '../utils/calculations'
import { categoryColors } from '../data/exercises'

interface Props {
  workout: WorkoutSession
  onDelete?: () => void
  onFavorite?: () => void
}

export default function WorkoutCard({ workout, onDelete, onFavorite }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const volume = totalVolume(workout)
  const completedSets = workout.exercises.reduce((n, e) => n + e.sets.filter(s => s.completed).length, 0)
  const date = new Date(workout.date)
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-white">{workout.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onFavorite && (
            <button onClick={onFavorite} className="transition-colors" title={workout.favorited ? 'Remove from templates' : 'Save as template'}>
              <svg viewBox="0 0 24 24" fill={workout.favorited ? '#F97316' : 'none'} stroke={workout.favorited ? '#F97316' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${workout.favorited ? '' : 'text-gray-600 hover:text-orange-400'}`}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}
          {onDelete && (
            confirmDelete ? (
              <>
                <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">No</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-gray-600 hover:text-red-400 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-3">
        <div className="text-center">
          <p className="text-xs text-gray-500">Duration</p>
          <p className="text-sm font-medium text-white">{formatDuration(workout.durationSeconds)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Volume</p>
          <p className="text-sm font-medium text-white">{volume.toLocaleString()} kg</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Sets</p>
          <p className="text-sm font-medium text-white">{completedSets}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Exercises</p>
          <p className="text-sm font-medium text-white">{workout.exercises.length}</p>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-1">
        {workout.exercises.map(ex => {
          const best = ex.sets
            .filter(s => s.completed && s.weight > 0 && s.reps > 0)
            .sort((a, b) => b.weight - a.weight)[0]
          const completedCount = ex.sets.filter(s => s.completed).length
          return (
            <div key={ex.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-300 truncate">{ex.exerciseName}</span>
              <span className="text-gray-500 ml-2 flex-shrink-0">
                {completedCount} {completedCount === 1 ? 'set' : 'sets'}
                {best ? ` · ${best.weight} kg × ${best.reps}` : ''}
              </span>
            </div>
          )
        })}
      </div>

      {/* Category tags */}
      <div className="flex flex-wrap gap-1 mt-3">
        </div>
    </div>
  )
}

/** Small inline badge */
export function CategoryBadge({ category }: { category: string }) {
  const cls = categoryColors[category] ?? 'bg-gray-700 text-gray-400'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {category}
    </span>
  )
}
