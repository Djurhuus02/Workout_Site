import { WorkoutSession, PersonalRecord, ExerciseCategory } from '../types'

/** Start of the current ISO week (Monday, local midnight). Shared so all weekly stats/features agree on one week boundary. */
export function getWeekStartDate(date: Date = new Date()): Date {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(date)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return start
}

/** Epley formula for estimated 1RM */
export function calculateOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps <= 0 || weight <= 0) return 0
  return weight * (1 + reps / 30)
}

/** Total volume for a workout session (sum of weight × reps for all completed sets) */
export function totalVolume(session: WorkoutSession): number {
  return session.exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((setTotal, s) => {
      if (!s.completed) return setTotal
      return setTotal + s.weight * s.reps
    }, 0)
  }, 0)
}

/** Get personal records per exercise across all workouts */
export function getPersonalRecords(workouts: WorkoutSession[]): Map<string, PersonalRecord> {
  const prs = new Map<string, PersonalRecord>()

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (!set.completed || set.reps <= 0 || set.weight <= 0) continue
        const oneRM = calculateOneRM(set.weight, set.reps)
        const existing = prs.get(exercise.exerciseId)
        if (!existing || oneRM > existing.estimatedOneRM) {
          prs.set(exercise.exerciseId, {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            weight: set.weight,
            reps: set.reps,
            estimatedOneRM: Math.round(oneRM * 10) / 10,
            date: workout.date,
          })
        }
      }
    }
  }

  return prs
}

/** Get progress data for a specific exercise (for charting) */
export interface ProgressPoint {
  rawDate: string
  label: string
  weight: number
  reps: number
  estimatedOneRM: number
}

export function getExerciseProgress(workouts: WorkoutSession[], exerciseId: string): ProgressPoint[] {
  return workouts
    .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
    .map(w => {
      const exercise = w.exercises.find(e => e.exerciseId === exerciseId)!
      const completedSets = exercise.sets.filter(s => s.completed && s.reps > 0 && s.weight > 0)
      if (completedSets.length === 0) return null
      const bestSet = completedSets.reduce((best, s) =>
        calculateOneRM(s.weight, s.reps) > calculateOneRM(best.weight, best.reps) ? s : best
      )
      return {
        rawDate: w.date,
        label: new Date(w.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        weight: bestSet.weight,
        reps: bestSet.reps,
        estimatedOneRM: Math.round(calculateOneRM(bestSet.weight, bestSet.reps) * 10) / 10,
      }
    })
    .filter((p): p is ProgressPoint => p !== null)
    .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatWeight(kg: number): string {
  return `${kg} kg`
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Set of local 'YYYY-MM-DD' date keys on which at least one workout was logged */
export function getWorkoutDateSet(workouts: WorkoutSession[]): Set<string> {
  return new Set(workouts.map(w => toDateKey(new Date(w.date))))
}

/** Consecutive-day streak ending today or yesterday (a streak isn't broken until a full day is missed) */
export function getCurrentStreak(workouts: WorkoutSession[]): number {
  const dates = getWorkoutDateSet(workouts)
  if (dates.size === 0) return 0

  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!dates.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!dates.has(toDateKey(cursor))) return 0
  }

  let streak = 0
  while (dates.has(toDateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Longest-ever run of consecutive workout days */
export function getLongestStreak(workouts: WorkoutSession[]): number {
  const dates = getWorkoutDateSet(workouts)
  if (dates.size === 0) return 0

  const sortedDays = [...dates].sort().map(key => new Date(key).getTime())
  let longest = 1
  let current = 1
  for (let i = 1; i < sortedDays.length; i++) {
    const diffDays = Math.round((sortedDays[i] - sortedDays[i - 1]) / 86400000)
    current = diffDays === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }
  return longest
}

export interface OverloadSuggestion {
  weight: number
  reps: number
  reason: 'increase_weight' | 'increase_reps'
}

/** Simple double-progression heuristic: add a rep until a threshold, then trade reps for a small weight jump */
export function suggestNextSet(previous: { weight: number; reps: number } | null): OverloadSuggestion | null {
  if (!previous || previous.weight <= 0 || previous.reps <= 0) return null

  if (previous.reps >= 10) {
    return { weight: previous.weight + 2.5, reps: previous.reps - 2, reason: 'increase_weight' }
  }
  return { weight: previous.weight, reps: previous.reps + 1, reason: 'increase_reps' }
}

export interface CategoryVolumePoint {
  label: string
  rawDate: string
  [category: string]: number | string
}

/** Completed-set volume aggregated by ISO week and exercise category, for the muscle-group balance chart */
export function getCategoryVolumeByWeek(
  workouts: WorkoutSession[],
  exerciseCategoryMap: Map<string, ExerciseCategory>,
  weeks: number = 8
): CategoryVolumePoint[] {
  const buckets = new Map<string, CategoryVolumePoint>()

  for (const workout of workouts) {
    const weekStart = getWeekStartDate(new Date(workout.date))
    const key = toDateKey(weekStart)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = {
        label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        rawDate: key,
      }
      buckets.set(key, bucket)
    }

    for (const exercise of workout.exercises) {
      const category = exerciseCategoryMap.get(exercise.exerciseId)
      if (!category) continue
      const volume = exercise.sets.reduce((sum, s) => (s.completed ? sum + s.weight * s.reps : sum), 0)
      if (volume <= 0) continue
      bucket[category] = ((bucket[category] as number) ?? 0) + volume
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    .slice(-weeks)
}
