import { useState, useEffect } from 'react'
import { Page } from './types'
import { useWorkouts } from './hooks/useWorkouts'
import { useActiveWorkout } from './hooks/useActiveWorkout'
import { useUserSettings } from './hooks/useUserSettings'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import ActiveWorkout from './pages/ActiveWorkout'
import History from './pages/History'
import Exercises from './pages/Exercises'
import Progress from './pages/Progress'
import Login from './pages/Login'
import Settings from './pages/Settings'

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard')
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark'
  )
  const { user, loading: authLoading } = useAuth()
  const workoutsHook = useWorkouts()
  const activeHook = useActiveWorkout()
  const settingsHook = useUserSettings()

  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
  }, [theme])

  const handleWorkoutFinish = (notes?: string) => {
    const session = activeHook.finishWorkout(notes)
    if (session) workoutsHook.addWorkout(session)
    setPage('dashboard')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-white">
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
            onFavoriteWorkout={workoutsHook.toggleFavorite}
            onStartTemplate={activeHook.startWorkoutFromTemplate}
            weeklyGoal={settingsHook.weeklyGoal}
            onSaveWeeklyGoal={settingsHook.saveWeeklyGoal}
            user={user}
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
            onFavorite={workoutsHook.toggleFavorite}
          />
        )}
        {page === 'exercises' && <Exercises />}
        {page === 'progress' && (
          <Progress workouts={workoutsHook.workouts} />
        )}
        {page === 'settings' && (
          <Settings onNavigate={setPage} theme={theme} onThemeChange={setTheme} />
        )}
      </div>
      <Navigation current={page} onChange={setPage} hasActive={activeHook.isActive} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
