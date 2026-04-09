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

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  requester?: Profile
  addressee?: Profile
}

export interface Challenge {
  id: string
  challenger_id: string
  challenged_id: string
  goal: number
  week_start: string
  status: 'active' | 'completed'
  created_at: string
  challenger?: Profile
  challenged?: Profile
  my_count?: number
  their_count?: number
}

export type Page = 'dashboard' | 'workout' | 'history' | 'exercises' | 'progress' | 'settings' | 'friends'
