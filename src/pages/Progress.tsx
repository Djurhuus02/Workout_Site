import { useState, useMemo } from 'react'
import { WorkoutSession, BodyWeightLog, ExerciseCategory } from '../types'
import {
  getPersonalRecords,
  getExerciseProgress,
  getCategoryVolumeByWeek,
  getRaceBests,
  getRunningSummary,
  getRunProgress,
  getValidRuns,
  formatDuration,
  formatPace,
  effectiveWeight,
  RACE_DISTANCES,
} from '../utils/calculations'
import { exercises, categoryHexColors, categoryLabels } from '../data/exercises'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
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

  const bodyWeightKg = bodyWeightLogs[0]?.weight_kg ?? null

  const prs = useMemo(() => getPersonalRecords(workouts, bodyWeightKg), [workouts, bodyWeightKg])

  // Only show exercises that have been logged
  const loggedExerciseIds = useMemo(() => {
    const ids = new Set<string>()
    for (const w of workouts) {
      for (const e of w.exercises) {
        if (e.sets.some(s => s.completed && effectiveWeight(e.exerciseId, s.weight, bodyWeightKg) > 0)) {
          ids.add(e.exerciseId)
        }
      }
    }
    return ids
  }, [workouts, bodyWeightKg])

  const progressData = useMemo(() =>
    selectedId ? getExerciseProgress(workouts, selectedId, bodyWeightKg) : [],
    [workouts, selectedId, bodyWeightKg]
  )

  const exerciseCategoryMap = useMemo(
    () => new Map(exercises.map(e => [e.id, e.category])),
    []
  )
  const categoryVolumeData = useMemo(
    () => getCategoryVolumeByWeek(workouts, exerciseCategoryMap, bodyWeightKg, 8),
    [workouts, exerciseCategoryMap, bodyWeightKg]
  )
  const presentCategories = useMemo(() => {
    const cats = new Set<ExerciseCategory>()
    for (const point of categoryVolumeData) {
      for (const key of Object.keys(point)) {
        if (key !== 'label' && key !== 'rawDate') cats.add(key as ExerciseCategory)
      }
    }
    return [...cats]
  }, [categoryVolumeData])

  const selectedPR = selectedId ? prs.get(selectedId) : null
  const selectedExercise = selectedId ? exercises.find(e => e.id === selectedId) : null

  const validRuns = useMemo(() => getValidRuns(workouts), [workouts])
  const raceBests = useMemo(() => getRaceBests(validRuns), [validRuns])
  const runningSummary = useMemo(() => getRunningSummary(validRuns), [validRuns])
  const runProgress = useMemo(() => getRunProgress(validRuns), [validRuns])
  const hasRuns = runningSummary.totalRuns > 0

  // Must run before the early return below — every hook in this component has to
  // execute on every render regardless of `workouts.length`, or React throws once
  // `workouts` transitions from empty (initial fetch) to populated.
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

      {/* Muscle-group volume balance */}
      {presentCategories.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Muscle Balance</p>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryVolumeData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#d1d5db' }}
                  formatter={(val: number, name: string) => [`${val} kg`, categoryLabels[name] ?? name]}
                />
                <Legend
                  formatter={(name: string) => categoryLabels[name] ?? name}
                  wrapperStyle={{ fontSize: 11 }}
                />
                {presentCategories.map(category => (
                  <Bar key={category} dataKey={category} stackId="volume" fill={categoryHexColors[category]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Running */}
      {hasRuns && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Running</p>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-semibold text-white mt-1">{runningSummary.totalDistanceKm} km</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
              <p className="text-xs text-gray-500">Runs</p>
              <p className="text-sm font-semibold text-white mt-1">{runningSummary.totalRuns}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
              <p className="text-xs text-gray-500">Longest</p>
              <p className="text-sm font-semibold text-white mt-1">{runningSummary.longestRunKm} km</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
              <p className="text-xs text-gray-500">Best pace</p>
              <p className="text-sm font-semibold text-white mt-1">
                {runningSummary.bestPaceSecPerKm ? formatPace(1, runningSummary.bestPaceSecPerKm) : '—'}
              </p>
            </div>
          </div>

          {/* Race bests */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {RACE_DISTANCES.map(race => {
              const best = raceBests.get(race.key)
              return (
                <div
                  key={race.key}
                  className={`rounded-xl p-3 border ${best ? 'bg-gray-900 border-orange-500/30' : 'bg-gray-900/40 border-gray-800'}`}
                >
                  <p className={`text-xs font-medium ${best ? 'text-orange-500' : 'text-gray-600'}`}>{race.label}</p>
                  {best ? (
                    <>
                      <p className="text-lg font-bold text-white mt-1">{formatDuration(best.durationSeconds)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatPace(best.distanceKm, best.durationSeconds)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">Not logged yet</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pace over time */}
          {runProgress.length >= 2 ? (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-500 mb-3">Pace over time</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={runProgress} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    reversed
                    tickFormatter={(v: number) => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#d1d5db' }}
                    itemStyle={{ color: '#f97316' }}
                    formatter={(val: number) => [formatPace(1, val), 'Pace']}
                  />
                  <Line type="monotone" dataKey="paceSecPerKm" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
              <p className="text-xs text-gray-500">Log more runs to see your pace trend.</p>
            </div>
          )}
        </div>
      )}

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
