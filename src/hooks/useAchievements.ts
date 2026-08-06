import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'
import { WorkoutSession } from '../types'
import { achievements, Achievement, AchievementContext } from '../data/achievements'
import { getPersonalRecords, getCurrentStreak, getLongestStreak } from '../utils/calculations'
import { loadUnlocked, saveUnlocked } from '../lib/achievementStorage'

export function useAchievements(workouts: WorkoutSession[], loading: boolean) {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(() => loadUnlocked())
  const [justUnlocked, setJustUnlocked] = useState<Achievement[]>([])
  // True once the initial workout history has been fetched at least once —
  // achievements found true against that first full history are reconciled
  // silently (no toast/confetti), since they weren't just earned right now.
  const hasHydrated = useRef(false)

  const ctx: AchievementContext = useMemo(() => ({
    workouts,
    prs: getPersonalRecords(workouts),
    currentStreak: getCurrentStreak(workouts),
    longestStreak: getLongestStreak(workouts),
  }), [workouts])

  useEffect(() => {
    if (loading) return
    const isInitialSync = !hasHydrated.current
    hasHydrated.current = true

    setUnlockedIds(prevUnlocked => {
      const newlyUnlocked = achievements.filter(a => !prevUnlocked.has(a.id) && a.isUnlocked(ctx))
      if (newlyUnlocked.length === 0) return prevUnlocked

      const next = new Set(prevUnlocked)
      newlyUnlocked.forEach(a => next.add(a.id))
      saveUnlocked(next)

      if (!isInitialSync) {
        setJustUnlocked(prev => [...prev, ...newlyUnlocked])
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#a855f7', '#F97316', '#22c55e', '#ffffff'],
        })
      }
      return next
    })
  }, [ctx, loading])

  const dismissJustUnlocked = useCallback((id: string) => {
    setJustUnlocked(prev => prev.filter(a => a.id !== id))
  }, [])

  return { achievements, unlockedIds, justUnlocked, dismissJustUnlocked }
}
