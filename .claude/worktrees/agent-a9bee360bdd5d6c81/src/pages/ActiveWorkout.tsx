import { useState, useEffect, useRef, useMemo } from 'react'
import confetti from 'canvas-confetti'
import ExercisePicker from '../components/ExercisePicker'
import SetRow from '../components/SetRow'
import ExerciseImageModal from '../components/ExerciseImageModal'
import { Exercise, WorkoutExercise, WorkoutSet, WorkoutSession } from '../types'
import { formatDuration, getPersonalRecords, calculateOneRM } from '../utils/calculations'
import { exercises as exerciseList } from '../data/exercises'
import { exerciseImageMap } from '../data/exerciseImages'

const REST_PRESETS = [60, 90, 120, 180]

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
  onFinish: (notes?: string) => void
  onDiscard: () => void
  getLastSession: (exerciseId: string, excludeId?: string) => { exercises: WorkoutExercise[] } | null
  bodyWeightKg?: number | null
  workouts: WorkoutSession[]
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
  bodyWeightKg,
  workouts,
}: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [editingName, setEditingName] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [modalExercise, setModalExercise] = useState<Exercise | null>(null)

  // PR tracking — keys are `${entryId}-${setId}`
  const [prSets, setPrSets] = useState<Set<string>>(new Set())
  // Exercises that already triggered confetti this session (fire only once per exercise)
  const [confettiFired, setConfettiFired] = useState<Set<string>>(new Set())
  // Best est. 1RM seen per exercise this session — so only a new session-high gets the PR badge
  const sessionBests = useRef<Map<string, number>>(new Map())

  // Rest timer
  const [restRemaining, setRestRemaining] = useState(0)
  const [restTotal, setRestTotal] = useState(90)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Compute saved PRs (excluding current in-progress workout)
  const savedPRs = useMemo(
    () => getPersonalRecords(workouts.filter(w => w.id !== active?.id)),
    [workouts, active?.id]
  )

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - active.startTime) / 1000))
    }, 1000)
    setElapsed(Math.round((Date.now() - active.startTime) / 1000))
    return () => clearInterval(interval)
  }, [active])

  // Rest timer countdown
  useEffect(() => {
    if (restRemaining <= 0) {
      if (restRef.current) clearInterval(restRef.current)
      if (restRemaining === 0 && restTotal > 0) return
      // Timer just hit 0 — vibrate
      navigator.vibrate?.([200, 100, 200])
      return
    }
  }, [restRemaining, restTotal])

  const startRest = (seconds: number) => {
    if (restRef.current) clearInterval(restRef.current)
    setRestTotal(seconds)
    setRestRemaining(seconds)
    restRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev <= 1) {
          clearInterval(restRef.current!)
          navigator.vibrate?.([200, 100, 200])
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopRest = () => {
    if (restRef.current) clearInterval(restRef.current)
    setRestRemaining(0)
    setRestTotal(0)
  }

  const handleSetCompleted = (entryId: string, setId: string, exerciseId: string, weight: number, reps: number) => {
    if (weight <= 0 || reps <= 0) return
    const currentOneRM = calculateOneRM(weight, reps)
    const savedBest = savedPRs.get(exerciseId)?.estimatedOneRM ?? 0
    const sessionBest = sessionBests.current.get(exerciseId) ?? 0
    const baseline = Math.max(savedBest, sessionBest)

    if (currentOneRM > baseline) {
      sessionBests.current.set(exerciseId, currentOneRM)
      setPrSets(prev => new Set(prev).add(`${entryId}-${setId}`))
      // Only fire confetti once per exercise per session
      if (!confettiFired.has(exerciseId)) {
        setConfettiFired(prev => new Set(prev).add(exerciseId))
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#F97316', '#FBBF24', '#FDE68A', '#ffffff'],
        })
      }
    }
    // Auto-start rest timer with last used duration
    startRest(restTotal || 90)
  }

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
  const restProgress = restTotal > 0 ? restRemaining / restTotal : 0

  return (
    <>
      {modalExercise && (
        <ExerciseImageModal exercise={modalExercise} onClose={() => setModalExercise(null)} />
      )}
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
              const isBodyweight = exerciseList.find(e => e.id === entry.exerciseId)?.equipment === 'Bodyweight'

              return (
                <div key={entry.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  {/* Exercise header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {(() => {
                        const ex = exerciseList.find(e => e.id === entry.exerciseId)
                        const imgUrl = exerciseImageMap[entry.exerciseId]
                        return (
                          <button
                            onClick={() => ex && setModalExercise(ex)}
                            className="flex-shrink-0 w-8 h-8 rounded-md bg-gray-800 overflow-hidden focus:outline-none active:opacity-70 transition-opacity"
                          >
                            {imgUrl ? (
                              <img src={imgUrl} alt={entry.exerciseName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-600">
                                  <rect x="2" y="9" width="3" height="6" rx="1" /><rect x="19" y="9" width="3" height="6" rx="1" />
                                  <rect x="5" y="7" width="2" height="10" rx="0.5" /><rect x="17" y="7" width="2" height="10" rx="0.5" />
                                  <line x1="7" y1="12" x2="17" y2="12" />
                                </svg>
                              </div>
                            )}
                          </button>
                        )
                      })()}
                      <h3 className="font-semibold text-white truncate">{entry.exerciseName}</h3>
                    </div>
                    <button
                      onClick={() => onRemoveExercise(entry.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
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
                      const isPR = prSets.has(`${entry.id}-${set.id}`)
                      return (
                        <SetRow
                          key={set.id}
                          set={set}
                          index={i}
                          previous={prevSet ? { weight: prevSet.weight, reps: prevSet.reps } : null}
                          onUpdate={patch => onUpdateSet(entry.id, set.id, patch)}
                          onDelete={() => onRemoveSet(entry.id, set.id)}
                          isBodyweight={isBodyweight}
                          bodyWeightKg={bodyWeightKg}
                          isPR={isPR}
                          onCompleted={() => handleSetCompleted(entry.id, set.id, entry.exerciseId, set.weight, set.reps)}
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
          onClick={() => setShowFinishModal(true)}
          disabled={active.exercises.length === 0}
          className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
        >
          Finish Workout
        </button>
      </div>

      {/* Rest timer — floating pill above nav */}
      {restRemaining > 0 && (
        <div style={{
          position: 'fixed', bottom: 'calc(4.5rem + env(safe-area-inset-bottom) + 12px)',
          left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)', maxWidth: 480,
          background: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '12px 16px', zIndex: 90,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: restRemaining <= 10 ? '#ef4444' : '#F97316',
              width: `${restProgress * 100}%`,
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Rest</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: restRemaining <= 10 ? '#ef4444' : 'white', fontVariantNumeric: 'tabular-nums' }}>
                {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {REST_PRESETS.map(s => (
                <button key={s} onClick={() => startRest(s)} style={{
                  padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: restTotal === s ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)',
                  color: restTotal === s ? '#F97316' : 'rgba(255,255,255,0.5)',
                  border: restTotal === s ? '1px solid rgba(249,115,22,0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                }}>
                  {s < 60 ? `${s}s` : s % 60 === 0 ? `${s / 60}m` : `${Math.floor(s / 60)}m${s % 60}s`}
                </button>
              ))}
              <button onClick={stopRest} style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={12} height={12}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish modal */}
      {showFinishModal && (
        <div
          onClick={() => setShowFinishModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1d24', borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '24px 24px 40px', width: '100%', maxWidth: 512,
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              Finish Workout
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Add a note about how it went (optional)
            </p>
            <textarea
              autoFocus
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Felt strong today, deload week..."
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                color: 'rgba(255,255,255,0.85)', fontSize: 14, padding: '12px 14px',
                fontFamily: 'inherit', resize: 'none', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => { onFinish(notes); setShowFinishModal(false) }}
              style={{
                marginTop: 12, width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                border: 'none', borderRadius: 12, color: 'white',
                fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Save Workout
            </button>
            <button
              onClick={() => { onFinish(); setShowFinishModal(false) }}
              style={{
                marginTop: 10, width: '100%', padding: '12px',
                background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, color: 'rgba(255,255,255,0.35)',
                fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </>
  )
}
