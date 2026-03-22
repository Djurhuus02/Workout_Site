import { useState, useEffect, useCallback } from 'react'
import { WorkoutSession } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function ensureWorkoutId(workout: WorkoutSession): WorkoutSession {
  if (isUuid(workout.id)) return workout

  return {
    ...workout,
    id: crypto.randomUUID(),
  }
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Load workouts from Supabase
  useEffect(() => {
    if (!user) {
      setWorkouts([])
      setLoading(false)
      return
    }

    const fetchWorkouts = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching workouts:', error)
      } else if (data) {
        setWorkouts(data.map(row => row.data as WorkoutSession))
      }

      setLoading(false)
    }

    fetchWorkouts()
  }, [user])

  const addWorkout = useCallback(async (workout: WorkoutSession) => {
    if (!user) return

    const workoutToSave = ensureWorkoutId(workout)

    setWorkouts(prev => [workoutToSave, ...prev])

    const { error } = await supabase
      .from('workouts')
      .insert({
        id: workoutToSave.id,
        user_id: user.id,
        data: workoutToSave,
      })

    if (error) {
      console.error('Error saving workout:', error)
      setWorkouts(prev => prev.filter(w => w.id !== workoutToSave.id))
    }
  }, [user])

  const deleteWorkout = useCallback(async (id: string) => {
    if (!user) return

    const previous = workouts
    setWorkouts(prev => prev.filter(w => w.id !== id))

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting workout:', error)
      setWorkouts(previous)
    }
  }, [user, workouts])

  const getLastSession = useCallback((exerciseId: string, excludeWorkoutId?: string) => {
    return workouts.find(w =>
      w.id !== excludeWorkoutId &&
      w.exercises.some(e => e.exerciseId === exerciseId)
    ) ?? null
  }, [workouts])

  return { workouts, loading, addWorkout, deleteWorkout, getLastSession }
}