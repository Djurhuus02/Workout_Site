import { WorkoutSession, PersonalRecord, ExerciseCategory, LatLng } from '../types'
import { exercises as exerciseList } from '../data/exercises'

const bodyweightExerciseIds = new Set(exerciseList.filter(e => e.equipment === 'Bodyweight').map(e => e.id))

/**
 * Weight to use for PR/volume/1RM purposes. Bodyweight exercises add the lifter's body
 * weight to whatever extra weight was logged — most bodyweight sets are logged with 0
 * extra weight, and without this they'd never register a PR or contribute volume at all.
 */
export function effectiveWeight(exerciseId: string, setWeight: number, bodyWeightKg: number | null): number {
  if (!bodyweightExerciseIds.has(exerciseId)) return setWeight
  return (bodyWeightKg ?? 0) + setWeight
}

const EARTH_RADIUS_KM = 6371

/** Great-circle distance between two lat/lng points, in km */
function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/** Total distance covered by a route (GPS-recorded or suggested), in km */
export function routeDistanceKm(route: LatLng[]): number {
  let total = 0
  for (let i = 1; i < route.length; i++) {
    total += haversineKm(route[i - 1], route[i])
  }
  return total
}

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
export function totalVolume(session: WorkoutSession, bodyWeightKg: number | null): number {
  return session.exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((setTotal, s) => {
      if (!s.completed) return setTotal
      return setTotal + effectiveWeight(ex.exerciseId, s.weight, bodyWeightKg) * s.reps
    }, 0)
  }, 0)
}

/** Get personal records per exercise across all workouts */
export function getPersonalRecords(workouts: WorkoutSession[], bodyWeightKg: number | null): Map<string, PersonalRecord> {
  const prs = new Map<string, PersonalRecord>()

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (!set.completed || set.reps <= 0) continue
        const weight = effectiveWeight(exercise.exerciseId, set.weight, bodyWeightKg)
        if (weight <= 0) continue
        const oneRM = calculateOneRM(weight, set.reps)
        const existing = prs.get(exercise.exerciseId)
        if (!existing || oneRM > existing.estimatedOneRM) {
          prs.set(exercise.exerciseId, {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            weight,
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

/** Short "12 Mar"-style date label shared by all chart-data builders */
function formatChartLabel(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Get progress data for a specific exercise (for charting) */
export interface ProgressPoint {
  rawDate: string
  label: string
  weight: number
  reps: number
  estimatedOneRM: number
}

export function getExerciseProgress(workouts: WorkoutSession[], exerciseId: string, bodyWeightKg: number | null): ProgressPoint[] {
  return workouts
    .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
    .map(w => {
      const exercise = w.exercises.find(e => e.exerciseId === exerciseId)!
      const completedSets = exercise.sets
        .filter(s => s.completed && s.reps > 0)
        .map(s => ({ reps: s.reps, weight: effectiveWeight(exerciseId, s.weight, bodyWeightKg) }))
        .filter(s => s.weight > 0)
      if (completedSets.length === 0) return null
      const bestSet = completedSets.reduce((best, s) =>
        calculateOneRM(s.weight, s.reps) > calculateOneRM(best.weight, best.reps) ? s : best
      )
      return {
        rawDate: w.date,
        label: formatChartLabel(w.date),
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

/** Pace as min:sec per km, e.g. "5:24 /km" */
export function formatPace(distanceKm: number, durationSeconds: number): string {
  if (distanceKm <= 0 || durationSeconds <= 0) return '—'
  const secPerKm = durationSeconds / distanceKm
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

/** Pace as min:sec per 100m, e.g. "1:45 /100m" — the standard swim-pace unit */
export function formatSwimPace(distanceM: number, durationSeconds: number): string {
  if (distanceM <= 0 || durationSeconds <= 0) return '—'
  const secPer100m = durationSeconds / (distanceM / 100)
  const m = Math.floor(secPer100m / 60)
  const s = Math.round(secPer100m % 60)
  return `${m}:${String(s).padStart(2, '0')} /100m`
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

export interface RaceDistance {
  key: string
  label: string
  km: number
}

/** Standard race distances tracked for running PRs */
export const RACE_DISTANCES: RaceDistance[] = [
  { key: '1k', label: '1K', km: 1 },
  { key: '5k', label: '5K', km: 5 },
  { key: '10k', label: '10K', km: 10 },
  { key: 'half', label: 'Half Marathon', km: 21.0975 },
  { key: 'marathon', label: 'Marathon', km: 42.195 },
]

/** Distance options offered when suggesting a route to run — the race distances plus a few extra training distances */
export const ROUTE_SUGGESTION_DISTANCES: RaceDistance[] = [
  ...RACE_DISTANCES,
  { key: '2k', label: '2K', km: 2 },
  { key: '3k', label: '3K', km: 3 },
  { key: '15k', label: '15K', km: 15 },
].sort((a, b) => a.km - b.km)

function getValidCardio(workouts: WorkoutSession[], type: 'run' | 'swim'): WorkoutSession[] {
  return workouts.filter(w => w.type === type && (w.distanceKm ?? 0) > 0 && w.durationSeconds > 0)
}

/** Runs with usable distance/duration data, for any running-stats calculation */
export function getValidRuns(workouts: WorkoutSession[]): WorkoutSession[] {
  return getValidCardio(workouts, 'run')
}

/** Swims with usable distance/duration data, for any swimming-stats calculation */
export function getValidSwims(workouts: WorkoutSession[]): WorkoutSession[] {
  return getValidCardio(workouts, 'swim')
}

export interface RaceBest {
  distanceKm: number
  durationSeconds: number
  date: string
}

/**
 * Best logged run matching each standard race distance. Manually logged runs rarely hit a
 * distance exactly, so each is matched to the nearest standard distance within a tolerance band
 * (tighter for longer races, since a few hundred metres matters less at 1K than at marathon
 * distance), then the fastest-pace run within that band is taken as the PR for that distance.
 */
export function getRaceBests(runs: WorkoutSession[]): Map<string, RaceBest> {
  const bests = new Map<string, RaceBest>()

  for (const race of RACE_DISTANCES) {
    const tolerance = race.km <= 1 ? 0.15 : race.km <= 10 ? 0.1 : 0.05
    let best: WorkoutSession | null = null
    let bestPace = Infinity

    for (const run of runs) {
      const km = run.distanceKm!
      if (Math.abs(km - race.km) / race.km > tolerance) continue
      const pace = run.durationSeconds / km
      if (pace < bestPace) {
        bestPace = pace
        best = run
      }
    }

    if (best) {
      bests.set(race.key, {
        distanceKm: best.distanceKm!,
        durationSeconds: best.durationSeconds,
        date: best.date,
      })
    }
  }

  return bests
}

export interface RunningSummary {
  totalRuns: number
  totalDistanceKm: number
  longestRunKm: number
  bestPaceSecPerKm: number | null
}

/** Lifetime running totals — distance, run count, longest run, and fastest pace ever logged */
export function getRunningSummary(runs: WorkoutSession[]): RunningSummary {
  const totalDistanceKm = runs.reduce((sum, r) => sum + (r.distanceKm ?? 0), 0)
  const longestRunKm = runs.reduce((max, r) => Math.max(max, r.distanceKm ?? 0), 0)
  const bestPaceSecPerKm = runs.length > 0
    ? Math.min(...runs.map(r => r.durationSeconds / (r.distanceKm ?? 1)))
    : null

  return {
    totalRuns: runs.length,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    longestRunKm,
    bestPaceSecPerKm,
  }
}

export interface RunProgressPoint {
  rawDate: string
  label: string
  distanceKm: number
  durationSeconds: number
  paceSecPerKm: number
}

/** Chronological run log for distance/pace-over-time charting */
export function getRunProgress(runs: WorkoutSession[]): RunProgressPoint[] {
  return runs
    .map(w => ({
      rawDate: w.date,
      label: formatChartLabel(w.date),
      distanceKm: w.distanceKm!,
      durationSeconds: w.durationSeconds,
      paceSecPerKm: Math.round((w.durationSeconds / w.distanceKm!) * 10) / 10,
    }))
    .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
}

export interface SwimDistance {
  key: string
  label: string
  m: number
}

/** Standard pool distances tracked for swimming PRs */
export const SWIM_DISTANCES: SwimDistance[] = [
  { key: '100m', label: '100m', m: 100 },
  { key: '200m', label: '200m', m: 200 },
  { key: '400m', label: '400m', m: 400 },
  { key: '800m', label: '800m', m: 800 },
  { key: '1500m', label: '1500m', m: 1500 },
]

export interface SwimBest {
  distanceM: number
  durationSeconds: number
  date: string
}

/**
 * Best logged swim matching each standard pool distance — same nearest-distance matching
 * as getRaceBests, since manual entries rarely hit a distance exactly.
 */
export function getSwimBests(swims: WorkoutSession[]): Map<string, SwimBest> {
  const bests = new Map<string, SwimBest>()

  for (const dist of SWIM_DISTANCES) {
    const tolerance = dist.m <= 200 ? 0.15 : dist.m <= 800 ? 0.1 : 0.05
    let best: WorkoutSession | null = null
    let bestPace = Infinity

    for (const swim of swims) {
      const m = (swim.distanceKm ?? 0) * 1000
      if (Math.abs(m - dist.m) / dist.m > tolerance) continue
      const pace = swim.durationSeconds / m
      if (pace < bestPace) {
        bestPace = pace
        best = swim
      }
    }

    if (best) {
      bests.set(dist.key, {
        distanceM: Math.round((best.distanceKm ?? 0) * 1000),
        durationSeconds: best.durationSeconds,
        date: best.date,
      })
    }
  }

  return bests
}

export interface SwimmingSummary {
  totalSwims: number
  totalDistanceM: number
  longestSwimM: number
  bestPaceSecPer100m: number | null
}

/** Lifetime swimming totals — distance, swim count, longest swim, and fastest pace ever logged */
export function getSwimmingSummary(swims: WorkoutSession[]): SwimmingSummary {
  const distancesM = swims.map(s => (s.distanceKm ?? 0) * 1000)
  const totalDistanceM = distancesM.reduce((sum, m) => sum + m, 0)
  const longestSwimM = distancesM.reduce((max, m) => Math.max(max, m), 0)
  const bestPaceSecPer100m = swims.length > 0
    ? Math.min(...swims.map((s, i) => s.durationSeconds / (distancesM[i] / 100)))
    : null

  return {
    totalSwims: swims.length,
    totalDistanceM: Math.round(totalDistanceM),
    longestSwimM: Math.round(longestSwimM),
    bestPaceSecPer100m,
  }
}

export interface SwimProgressPoint {
  rawDate: string
  label: string
  distanceM: number
  durationSeconds: number
  paceSecPer100m: number
}

/** Chronological swim log for distance/pace-over-time charting */
export function getSwimProgress(swims: WorkoutSession[]): SwimProgressPoint[] {
  return swims
    .map(w => {
      const distanceM = (w.distanceKm ?? 0) * 1000
      return {
        rawDate: w.date,
        label: formatChartLabel(w.date),
        distanceM: Math.round(distanceM),
        durationSeconds: w.durationSeconds,
        paceSecPer100m: Math.round((w.durationSeconds / (distanceM / 100)) * 10) / 10,
      }
    })
    .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
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
  bodyWeightKg: number | null,
  weeks: number = 8
): CategoryVolumePoint[] {
  const buckets = new Map<string, CategoryVolumePoint>()

  for (const workout of workouts) {
    const weekStart = getWeekStartDate(new Date(workout.date))
    const key = toDateKey(weekStart)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = {
        label: formatChartLabel(weekStart),
        rawDate: key,
      }
      buckets.set(key, bucket)
    }

    for (const exercise of workout.exercises) {
      const category = exerciseCategoryMap.get(exercise.exerciseId)
      if (!category) continue
      const volume = exercise.sets.reduce((sum, s) => (s.completed ? sum + effectiveWeight(exercise.exerciseId, s.weight, bodyWeightKg) * s.reps : sum), 0)
      if (volume <= 0) continue
      bucket[category] = ((bucket[category] as number) ?? 0) + volume
    }
  }

  return [...buckets.values()]
    // Drop weeks with no actual category volume (e.g. a week where the only
    // session logged was a run) — otherwise an empty week can displace a real
    // training week out of the last-N-weeks window below.
    .filter(bucket => Object.keys(bucket).some(k => k !== 'label' && k !== 'rawDate'))
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    .slice(-weeks)
}
