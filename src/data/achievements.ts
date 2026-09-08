import { WorkoutSession, PersonalRecord } from '../types'
import { totalVolume } from '../utils/calculations'

export interface AchievementContext {
  workouts: WorkoutSession[]
  prs: Map<string, PersonalRecord>
  currentStreak: number
  longestStreak: number
  bodyWeightKg: number | null
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  isUnlocked: (ctx: AchievementContext) => boolean
}

export const achievements: Achievement[] = [
  {
    id: 'first_workout',
    name: 'First Rep',
    description: 'Log your first workout',
    icon: '🏁',
    isUnlocked: ctx => ctx.workouts.length >= 1,
  },
  {
    id: 'workouts_10',
    name: 'Getting Started',
    description: 'Log 10 workouts',
    icon: '💪',
    isUnlocked: ctx => ctx.workouts.length >= 10,
  },
  {
    id: 'workouts_50',
    name: 'Half Century',
    description: 'Log 50 workouts',
    icon: '🔥',
    isUnlocked: ctx => ctx.workouts.length >= 50,
  },
  {
    id: 'workouts_100',
    name: 'Centurion',
    description: 'Log 100 workouts',
    icon: '💯',
    isUnlocked: ctx => ctx.workouts.length >= 100,
  },
  {
    id: 'streak_7',
    name: 'One Week Strong',
    description: 'Hit a 7-day workout streak',
    icon: '📅',
    isUnlocked: ctx => ctx.longestStreak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Iron Habit',
    description: 'Hit a 30-day workout streak',
    icon: '⚡',
    isUnlocked: ctx => ctx.longestStreak >= 30,
  },
  {
    id: 'first_pr',
    name: 'New Record',
    description: 'Set your first personal record',
    icon: '🏆',
    isUnlocked: ctx => ctx.prs.size >= 1,
  },
  {
    id: 'pr_10',
    name: 'Record Breaker',
    description: 'Set personal records in 10 different exercises',
    icon: '🥇',
    isUnlocked: ctx => ctx.prs.size >= 10,
  },
  {
    id: 'volume_session_10k',
    name: '10-Ton Club',
    description: 'Lift 10,000kg total volume in a single session',
    icon: '🏋️',
    isUnlocked: ctx => ctx.workouts.some(w => totalVolume(w, ctx.bodyWeightKg) >= 10000),
  },
  {
    id: 'volume_lifetime_100k',
    name: '100k Lifetime',
    description: 'Lift 100,000kg total across all workouts',
    icon: '🚛',
    isUnlocked: ctx => ctx.workouts.reduce((sum, w) => sum + totalVolume(w, ctx.bodyWeightKg), 0) >= 100000,
  },
  {
    id: 'marathon_session',
    name: 'Marathon Session',
    description: 'Complete a 90+ minute workout',
    icon: '⏱️',
    isUnlocked: ctx => ctx.workouts.some(w => w.durationSeconds >= 90 * 60),
  },
  {
    id: 'well_rounded_20',
    name: 'Well Rounded',
    description: 'Log 20 different exercises',
    icon: '🌐',
    isUnlocked: ctx => new Set(ctx.workouts.flatMap(w => w.exercises.map(e => e.exerciseId))).size >= 20,
  },
]
