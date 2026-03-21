import { useState, useEffect, useCallback } from 'react'
import { WorkoutExercise, WorkoutSet, WorkoutSession } from '../types'

const STORAGE_KEY = 'lift_tracker_active_workout'

function genId() {
  return Math.random().toString(36).slice(2, 11)
}

interface ActiveWorkout {
  id: string
  name: string
  startTime: number
  exercises: WorkoutExercise[]
}

function load(): ActiveWorkout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ActiveWorkout
  } catch {
    return null
  }
}

export function useActiveWorkout() {
  const [active, setActive] = useState<ActiveWorkout | null>(() => load())

  useEffect(() => {
    if (active) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [active])

  const startWorkout = useCallback((name?: string) => {
    const now = new Date()
    const defaultName = `Workout – ${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`
    setActive({
      id: genId(),
      name: name ?? defaultName,
      startTime: Date.now(),
      exercises: [],
    })
  }, [])

  const addExercise = useCallback((exerciseId: string, exerciseName: string) => {
    const defaultSet: WorkoutSet = { id: genId(), weight: 0, reps: 0, completed: false }
    const entry: WorkoutExercise = {
      id: genId(),
      exerciseId,
      exerciseName,
      sets: [defaultSet],
    }
    setActive(prev => prev ? { ...prev, exercises: [...prev.exercises, entry] } : prev)
  }, [])

  const removeExercise = useCallback((entryId: string) => {
    setActive(prev => prev
      ? { ...prev, exercises: prev.exercises.filter(e => e.id !== entryId) }
      : prev
    )
  }, [])

  const addSet = useCallback((entryId: string, previousSet?: WorkoutSet) => {
    const newSet: WorkoutSet = {
      id: genId(),
      weight: previousSet?.weight ?? 0,
      reps: previousSet?.reps ?? 0,
      completed: false,
    }
    setActive(prev => prev
      ? {
          ...prev,
          exercises: prev.exercises.map(e =>
            e.id === entryId ? { ...e, sets: [...e.sets, newSet] } : e
          ),
        }
      : prev
    )
  }, [])

  const removeSet = useCallback((entryId: string, setId: string) => {
    setActive(prev => prev
      ? {
          ...prev,
          exercises: prev.exercises.map(e =>
            e.id === entryId
              ? { ...e, sets: e.sets.filter(s => s.id !== setId) }
              : e
          ),
        }
      : prev
    )
  }, [])

  const updateSet = useCallback((entryId: string, setId: string, patch: Partial<WorkoutSet>) => {
    setActive(prev => prev
      ? {
          ...prev,
          exercises: prev.exercises.map(e =>
            e.id === entryId
              ? { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, ...patch } : s) }
              : e
          ),
        }
      : prev
    )
  }, [])

  const updateWorkoutName = useCallback((name: string) => {
    setActive(prev => prev ? { ...prev, name } : prev)
  }, [])

  const finishWorkout = useCallback((): WorkoutSession | null => {
    if (!active) return null
    const session: WorkoutSession = {
      id: active.id,
      date: new Date(active.startTime).toISOString(),
      name: active.name,
      exercises: active.exercises,
      durationSeconds: Math.round((Date.now() - active.startTime) / 1000),
    }
    setActive(null)
    return session
  }, [active])

  const discardWorkout = useCallback(() => {
    setActive(null)
  }, [])

  return {
    active,
    isActive: active !== null,
    startWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    updateWorkoutName,
    finishWorkout,
    discardWorkout,
  }
}
