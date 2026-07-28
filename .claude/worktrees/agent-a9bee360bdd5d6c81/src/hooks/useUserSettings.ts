import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useUserSettings() {
  const { user } = useAuth()
  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return

    supabase
      .from('user_settings')
      .select('weekly_goal')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setWeeklyGoal(data?.weekly_goal ?? null)
      })
  }, [user])

  const saveWeeklyGoal = useCallback(async (goal: number | null) => {
    if (!user) return

    setWeeklyGoal(goal)

    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, weekly_goal: goal, updated_at: new Date().toISOString() })
  }, [user])

  return { weeklyGoal, saveWeeklyGoal }
}
