import { useState, useEffect, useCallback } from 'react'
import { Challenge } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(now)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

export function useChallenges() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChallenges = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data } = await supabase
      .from('challenges')
      .select('*, challenger:profiles!challenger_id(id,username,display_name), challenged:profiles!challenged_id(id,username,display_name)')
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    // Fetch workout counts for each challenge participant
    const weekStart = getWeekStart()
    const enriched = await Promise.all((data as Challenge[]).map(async c => {
      const friendId = c.challenger_id === user.id ? c.challenged_id : c.challenger_id

      const [myRes, theirRes] = await Promise.all([
        supabase.rpc('get_weekly_workout_count', { target_user_id: user.id, week_start_date: c.week_start }),
        supabase.rpc('get_weekly_workout_count', { target_user_id: friendId, week_start_date: c.week_start }),
      ])

      // If challenge week has passed, mark as completed
      const weekEnd = new Date(c.week_start)
      weekEnd.setDate(weekEnd.getDate() + 7)
      if (new Date() >= weekEnd) {
        supabase.from('challenges').update({ status: 'completed' }).eq('id', c.id)
      }

      return {
        ...c,
        my_count: (myRes.data as number) ?? 0,
        their_count: (theirRes.data as number) ?? 0,
      }
    }))

    // Only keep challenges from current week
    setChallenges(enriched.filter(c => c.week_start === weekStart || new Date(c.week_start) > new Date(weekStart)))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchChallenges() }, [fetchChallenges])

  const createChallenge = useCallback(async (friendId: string, goal: number) => {
    if (!user) return
    const weekStart = getWeekStart()

    // Don't create duplicate for same friend same week
    const existing = challenges.find(c =>
      c.week_start === weekStart &&
      ((c.challenger_id === user.id && c.challenged_id === friendId) ||
       (c.challenged_id === user.id && c.challenger_id === friendId))
    )
    if (existing) return

    await supabase.from('challenges').insert({
      challenger_id: user.id,
      challenged_id: friendId,
      goal,
      week_start: weekStart,
      status: 'active',
    })
    await fetchChallenges()
  }, [user, challenges, fetchChallenges])

  return { challenges, loading, createChallenge, refetch: fetchChallenges }
}
