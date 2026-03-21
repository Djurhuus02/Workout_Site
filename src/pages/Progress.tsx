import { useState, useMemo } from 'react'
import { WorkoutSession } from '../types'
import { getPersonalRecords, getExerciseProgress } from '../utils/calculations'
import { exercises } from '../data/exercises'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface Props {
  workouts: WorkoutSession[]
}

export default function Progress({ workouts }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const prs = useMemo(() => getPersonalRecords(workouts), [workouts])

  // Only show exercises that have been logged
  const loggedExerciseIds = useMemo(() => {
    const ids = new Set<string>()
    for (const w of workouts) {
      for (const e of w.exercises) {
        if (e.sets.some(s => s.completed && s.weight > 0)) {
          ids.add(e.exerciseId)
        }
      }
    }
    return ids
  }, [workouts])

  const progressData = useMemo(() =>
    selectedId ? getExerciseProgress(workouts, selectedId) : [],
    [workouts, selectedId]
  )

  const selectedPR = selectedId ? prs.get(selectedId) : null
  const selectedExercise = selectedId ? exercises.find(e => e.id === selectedId) : null

  if (workouts.length === 0) {
    return (
      <div className="px-4 pt-6 pb-6">
        <h1 className="text-2xl font-bold text-white mb-6">Progress</h1>
        <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto mb-3 text-gray-700">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p className="text-gray-600 text-sm">Log some workouts to see your progress here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-6">
      <h1 className="text-2xl font-bold text-white mb-6">Progress</h1>

      {/* Exercise selector */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1.5">Select exercise</label>
        <select
          value={selectedId ?? ''}
          onChange={e => setSelectedId(e.target.value || null)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 appearance-none"
        >
          <option value="">Choose an exercise...</option>
          {exercises
            .filter(e => loggedExerciseIds.has(e.id))
            .map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))
          }
        </select>
      </div>

      {selectedId && selectedExercise && (
        <>
          {/* PR Card */}
          {selectedPR ? (
            <div className="bg-gray-900 rounded-xl p-4 border border-orange-500/30 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-orange-500 font-medium mb-1">Personal Record</p>
                  <p className="text-3xl font-bold text-white">{selectedPR.weight} kg</p>
                  <p className="text-sm text-gray-400 mt-0.5">× {selectedPR.reps} reps</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Est. 1RM</p>
                  <p className="text-xl font-bold text-orange-500">{selectedPR.estimatedOneRM} kg</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(selectedPR.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
              <p className="text-gray-600 text-sm">No completed sets found for this exercise.</p>
            </div>
          )}

          {/* Chart */}
          {progressData.length >= 2 ? (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
              <p className="text-xs text-gray-500 mb-3">Estimated 1RM over time</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={progressData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    unit=" kg"
                  />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#d1d5db' }}
                    itemStyle={{ color: '#f97316' }}
                    formatter={(val: number) => [`${val} kg`, 'Est. 1RM']}
                  />
                  <Line
                    type="monotone"
                    dataKey="estimatedOneRM"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : progressData.length === 1 ? (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
              <p className="text-xs text-gray-500">Log more sessions to see your progress chart.</p>
            </div>
          ) : null}

          {/* Session history for this exercise */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Session history</p>
            <div className="space-y-2">
              {progressData.slice().reverse().map((p, i) => (
                <div key={i} className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{p.weight} kg × {p.reps}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-orange-500 font-medium">{p.estimatedOneRM} kg</p>
                    <p className="text-xs text-gray-600">Est. 1RM</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!selectedId && (
        <>
          {/* PR overview */}
          <div>
            <p className="text-xs text-gray-500 mb-2">All personal records</p>
            <div className="space-y-2">
              {[...prs.values()]
                .sort((a, b) => b.estimatedOneRM - a.estimatedOneRM)
                .map(pr => (
                  <button
                    key={pr.exerciseId}
                    onClick={() => setSelectedId(pr.exerciseId)}
                    className="w-full bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center justify-between hover:border-orange-500/50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{pr.exerciseName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{pr.weight} kg × {pr.reps} reps</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-orange-500 font-medium">{pr.estimatedOneRM} kg</p>
                      <p className="text-xs text-gray-600">Est. 1RM</p>
                    </div>
                  </button>
                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  )
}
