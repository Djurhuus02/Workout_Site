import { WorkoutSession, PersonalRecord } from '../types'

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
