import { useState, useMemo } from 'react'
import { WorkoutSession, BodyWeightLog } from '../types'
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
  bodyWeightLogs: BodyWeightLog[]
  onAddBodyWeight: (weight_kg: number) => void
  onDeleteBodyWeight: (id: string) => void
}

export default function Progress({ workouts, bodyWeightLogs, onAddBodyWeight, onDeleteBodyWeight }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bwInput, setBwInput] = useState('')

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

  const bwChartData = useMemo(() =>
    [...bodyWeightLogs]
      .reverse()
      .slice(-30)
      .map(l => ({
        label: new Date(l.logged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        weight: l.weight_kg,
        id: l.id,
      })),
    [bodyWeightLogs]
  )

  const handleAddBw = () => {
    const val = parseFloat(bwInput)
    if (!val || val <= 0) return
    onAddBodyWeight(val)
    setBwInput('')
  }

  return (
    <div className="px-4 pt-6 pb-6">
      <h1 className="text-2xl font-bold text-white mb-6">Progress</h1>

      {/* ── Body weight section ── */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Body Weight</p>

        {/* Log input */}
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            inputMode="decimal"
            placeholder={bodyWeightLogs[0] ? `Last: ${bodyWeightLogs[0].weight_kg} kg` : 'Enter weight (kg)'}
            value={bwInput}
            onChange={e => setBwInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddBw()}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleAddBw}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Log
          </button>
        </div>

        {/* Chart */}
        {bwChartData.length >= 2 ? (
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-3">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={bwChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} unit=" kg" domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#f97316' }}
                  formatter={(val: number) => [`${val} kg`, 'Weight']}
                />
                <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : bodyWeightLogs.length === 1 ? (
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 mb-3">
            <p className="text-xs text-gray-500">Log more entries to see your weight chart.</p>
          </div>
        ) : null}

        {/* Recent logs */}
        {bodyWeightLogs.length > 0 && (
          <div className="space-y-1">
            {bodyWeightLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-2.5 border border-gray-800">
                <div>
                  <span className="text-white font-semibold text-sm">{log.weight_kg} kg</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {new Date(log.logged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <button onClick={() => onDeleteBodyWeight(log.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
