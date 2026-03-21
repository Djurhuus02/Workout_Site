import { useState } from 'react'
import { Page } from './types'
import { useWorkouts } from './hooks/useWorkouts'
import { useActiveWorkout } from './hooks/useActiveWorkout'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import ActiveWorkout from './pages/ActiveWorkout'
import History from './pages/History'
import Exercises from './pages/Exercises'
import Progress from './pages/Progress'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')

  const workoutsHook = useWorkouts()
  const activeHook = useActiveWorkout()

  const handleWorkoutFinish = () => {
    const session = activeHook.finishWorkout()
    if (session) workoutsHook.addWorkout(session)
    setPage('dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div
        className="max-w-lg mx-auto overflow-y-auto"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
          minHeight: '100dvh',
        }}
      >
        {page === 'dashboard' && (
          <Dashboard
            workouts={workoutsHook.workouts}
            isActive={activeHook.isActive}
            onNavigate={setPage}
            onDeleteWorkout={workoutsHook.deleteWorkout}
          />
        )}

        {page === 'workout' && (
          <ActiveWorkout
            active={activeHook.active}
            isActive={activeHook.isActive}
            onStart={activeHook.startWorkout}
            onAddExercise={activeHook.addExercise}
            onRemoveExercise={activeHook.removeExercise}
            onAddSet={activeHook.addSet}
            onRemoveSet={activeHook.removeSet}
            onUpdateSet={activeHook.updateSet}
            onUpdateName={activeHook.updateWorkoutName}
            onFinish={handleWorkoutFinish}
            onDiscard={activeHook.discardWorkout}
            getLastSession={workoutsHook.getLastSession}
          />
        )}

        {page === 'history' && (
          <History
            workouts={workoutsHook.workouts}
            onDelete={workoutsHook.deleteWorkout}
          />
        )}

        {page === 'exercises' && <Exercises />}

        {page === 'progress' && (
          <Progress workouts={workoutsHook.workouts} />
        )}
      </div>

      <Navigation
        current={page}
        onChange={setPage}
        hasActive={activeHook.isActive}
      />
    </div>
  )
}
