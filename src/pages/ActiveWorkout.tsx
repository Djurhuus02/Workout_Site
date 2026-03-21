import { useState, useEffect } from 'react'
import ExercisePicker from '../components/ExercisePicker'
import SetRow from '../components/SetRow'
import { Exercise, WorkoutExercise, WorkoutSet } from '../types'
import { formatDuration } from '../utils/calculations'

interface ActiveWorkoutData {
  id: string
  name: string
  startTime: number
  exercises: WorkoutExercise[]
}

interface Props {
  active: ActiveWorkoutData | null
  isActive: boolean
  onStart: (name?: string) => void
  onAddExercise: (id: string, name: string) => void
  onRemoveExercise: (id: string) => void
  onAddSet: (entryId: string, prev?: WorkoutSet) => void
  onRemoveSet: (entryId: string, setId: string) => void
  onUpdateSet: (entryId: string, setId: string, patch: Partial<WorkoutSet>) => void
  onUpdateName: (name: string) => void
  onFinish: () => void
  onDiscard: () => void
  getLastSession: (exerciseId: string, excludeId?: string) => { exercises: WorkoutExercise[] } | null
}

export default function ActiveWorkout({
  active,
  isActive,
  onStart,
  onAddExercise,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onUpdateName,
  onFinish,
  onDiscard,
  getLastSession,
}: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [editingName, setEditingName] = useState(false)

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - active.startTime) / 1000))
    }, 1000)
    setElapsed(Math.round((Date.now() - active.startTime) / 1000))
    return () => clearInterval(interval)
  }, [active])

  const handleDiscard = () => {
    if (confirm('Discard this workout? All progress will be lost.')) {
      onDiscard()
    }
  }

  const handleSelectExercise = (exercise: Exercise) => {
    onAddExercise(exercise.id, exercise.name)
    setShowPicker(false)
  }

  if (!isActive || !active) {
    return (
      <div className="px-4 pt-6 pb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Start Workout</h1>
        <p className="text-gray-500 text-sm mb-8">Log your lifts, track your progress.</p>

        <button
          onClick={() => onStart()}
          className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg transition-colors mb-4"
        >
          + Start Empty Workout
        </button>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto mb-3 text-gray-700">
            <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11" />
            <circle cx="3.5" cy="6.5" r="1.5" fill="currentColor" />
            <circle cx="3.5" cy="12" r="1.5" fill="currentColor" />
            <circle cx="3.5" cy="17.5" r="1.5" fill="currentColor" />
          </svg>
          <p className="text-gray-600 text-sm">Add exercises, log your sets with weight & reps.</p>
          <p className="text-gray-600 text-sm mt-1">Your previous performance is shown for each set.</p>
        </div>
      </div>
    )
  }

  const excludedIds = active.exercises.map(e => e.exerciseId)

  return (
    <>
      {showPicker && (
        <ExercisePicker
          onSelect={handleSelectExercise}
          onClose={() => setShowPicker(false)}
          exclude={excludedIds}
        />
      )}

      <div className="px-4 pt-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          {editingName ? (
            <input
              autoFocus
              value={active.name}
              onChange={e => onUpdateName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              className="flex-1 bg-transparent text-xl font-bold text-white border-b border-orange-500 focus:outline-none mr-2"
            />
          ) : (
            <button
              className="flex-1 text-left text-xl font-bold text-white truncate mr-2"
              onClick={() => setEditingName(true)}
            >
              {active.name}
            </button>
          )}
          <button
            onClick={handleDiscard}
            className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1"
            title="Discard workout"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>

        {/* Timer */}
        <p className="text-sm text-gray-500 mb-5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          {formatDuration(elapsed)}
        </p>

        {/* Exercises */}
        <div className="space-y-4 mb-4">
          {active.exercises.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-6 border border-dashed border-gray-700 text-center">
              <p className="text-gray-600 text-sm">No exercises yet.</p>
              <p className="text-gray-600 text-sm mt-1">Tap "Add Exercise" below to get started.</p>
            </div>
          ) : (
            active.exercises.map(entry => {
              const lastSession = getLastSession(entry.exerciseId, active.id)
              const lastExercise = lastSession?.exercises.find(e => e.exerciseId === entry.exerciseId)

              return (
                <div key={entry.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  {/* Exercise header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <h3 className="font-semibold text-white">{entry.exerciseName}</h3>
                    <button
                      onClick={() => onRemoveExercise(entry.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Column headers */}
                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600">
                    <span className="w-5 text-center">#</span>
                    <span className="w-16 text-center">Prev</span>
                    <span className="flex-1 text-center">Weight</span>
                    <span className="w-12 text-center">Reps</span>
                    <span className="w-7" />
                    <span className="w-6" />
                  </div>

                  {/* Sets */}
                  <div className="px-2 pb-2 space-y-1">
                    {entry.sets.map((set, i) => {
                      const prevSet = lastExercise?.sets[i] ?? null
                      return (
                        <SetRow
                          key={set.id}
                          set={set}
                          index={i}
                          previous={prevSet ? { weight: prevSet.weight, reps: prevSet.reps } : null}
                          onUpdate={patch => onUpdateSet(entry.id, set.id, patch)}
                          onDelete={() => onRemoveSet(entry.id, set.id)}
                        />
                      )
                    })}
                  </div>

                  {/* Add set button */}
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => {
                        const last = entry.sets[entry.sets.length - 1]
                        onAddSet(entry.id, last)
                      }}
                      className="w-full py-2 rounded-lg border border-dashed border-gray-700 text-gray-500 text-sm hover:border-orange-500 hover:text-orange-500 transition-colors"
                    >
                      + Add Set
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Add exercise */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-400 font-medium hover:border-orange-500 hover:text-orange-500 transition-colors mb-4"
        >
          + Add Exercise
        </button>

        {/* Finish workout */}
        <button
          onClick={onFinish}
          disabled={active.exercises.length === 0}
          className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
        >
          Finish Workout
        </button>
      </div>
    </>
  )
}
