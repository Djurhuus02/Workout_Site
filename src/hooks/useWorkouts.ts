import { useState, useEffect, useCallback } from 'react'
import { WorkoutSession } from '../types'

const STORAGE_KEY = 'lift_tracker_workouts'

function loadWorkouts(): WorkoutSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WorkoutSession[]
  } catch {
    return []
  }
}

function saveWorkouts(workouts: WorkoutSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(() => loadWorkouts())

  useEffect(() => {
    saveWorkouts(workouts)
  }, [workouts])

  const addWorkout = useCallback((workout: WorkoutSession) => {
    setWorkouts(prev => [workout, ...prev])
  }, [])

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id))
  }, [])

  /** Get the most recent session that contains a specific exercise, excluding the current session */
  const getLastSession = useCallback((exerciseId: string, excludeWorkoutId?: string) => {
    return workouts.find(w =>
      w.id !== excludeWorkoutId &&
      w.exercises.some(e => e.exerciseId === exerciseId)
    ) ?? null
  }, [workouts])

  return { workouts, addWorkout, deleteWorkout, getLastSession }
}
