export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'olympic'
  | 'full_body'

export type Equipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Cable'
  | 'Machine'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'EZ-Bar'
  | 'Smith Machine'
  | 'Bands'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: Equipment
}

export interface WorkoutSet {
  id: string
  weight: number
  reps: number
  completed: boolean
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  exerciseName: string
  sets: WorkoutSet[]
  notes?: string
}

export interface WorkoutSession {
  id: string
  date: string
  name: string
  exercises: WorkoutExercise[]
  durationSeconds: number
  favorited?: boolean
  notes?: string
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  weight: number
  reps: number
  estimatedOneRM: number
  date: string
}

export interface BodyWeightLog {
  id: string
  weight_kg: number
  logged_at: string
}

export type Page = 'dashboard' | 'workout' | 'history' | 'exercises' | 'progress' | 'settings'
