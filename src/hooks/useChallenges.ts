import { useState, useEffect, useCallback } from 'react'
import { Challenge, Profile } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

export function useChallenges() {
  const { user } = useAuth()
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([])
  const [pendingIncoming, setPendingIncoming] = useState<Challenge[]>([])
  const [pendingSent, setPendingSent] = useState<Challenge[]>([])
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChallenges = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // Fetch all challenges (active/pending + completed)
    const [{ data, error }, { data: completedData }] = await Promise.all([
      supabase
        .from('challenges')
        .select('*')
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .neq('status', 'completed')
        .order('created_at', { ascending: false }),
      supabase
        .from('challenges')
        .select('*')
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    if (error) { console.error('challenges fetch error:', error); setLoading(false); return }

    // Collect all participant IDs across active + completed
    const allData = [...(data ?? []), ...(completedData ?? [])]
    const otherIds = [...new Set(allData.map(c =>
      c.challenger_id === user.id ? c.challenged_id : c.challenger_id
    ))]

    const { data: profileData } = otherIds.length > 0
      ? await supabase.from('profiles').select('id, username, display_name').in('id', otherIds)
      : { data: [] }
    const profileMap = new Map((profileData ?? []).map(p => [p.id, p as Profile]))

    // Enrich completed challenges with profiles
    const enrichedCompleted = (completedData ?? []).map(c => ({
      ...c,
      challenger: profileMap.get(c.challenger_id),
      challenged: profileMap.get(c.challenged_id),
    }))
    setCompletedChallenges(enrichedCompleted)

    if (!data || data.length === 0) {
      setActiveChallenges([]); setPendingIncoming([]); setPendingSent([])
      setLoading(false); return
    }

    // Split into pending and active
    const pending = data.filter(c => c.status === 'pending')
    const active = data.filter(c => c.status === 'active')

    // Enrich pending with profiles
    const enrichedPending = pending.map(c => ({
      ...c,
      challenger: profileMap.get(c.challenger_id),
      challenged: profileMap.get(c.challenged_id),
    }))
    setPendingIncoming(enrichedPending.filter(c => c.challenged_id === user.id))
    setPendingSent(enrichedPending.filter(c => c.challenger_id === user.id))

    // Enrich active challenges with workout counts
    const enrichedActive = await Promise.all(active.map(async c => {
      const friendId = c.challenger_id === user.id ? c.challenged_id : c.challenger_id

      // If week has passed — determine winner and mark completed
      const weekEnd = new Date(c.week_start)
      weekEnd.setDate(weekEnd.getDate() + 7)
      if (new Date() >= weekEnd) {
        const [myRes, theirRes] = await Promise.all([
          supabase.rpc('get_weekly_workout_count', { target_user_id: user.id, week_start_date: c.week_start }),
          supabase.rpc('get_weekly_workout_count', { target_user_id: friendId, week_start_date: c.week_start }),
        ])
        const myCount = (myRes.data as number) ?? 0
        const theirCount = (theirRes.data as number) ?? 0
        const winnerId = myCount > theirCount ? user.id : theirCount > myCount ? friendId : null
        await supabase.from('challenges').update({ status: 'completed', winner_id: winnerId }).eq('id', c.id)
        return null
      }

      const [myRes, theirRes] = await Promise.all([
        supabase.rpc('get_weekly_workout_count', { target_user_id: user.id, week_start_date: c.week_start }),
        supabase.rpc('get_weekly_workout_count', { target_user_id: friendId, week_start_date: c.week_start }),
      ])

      return {
        ...c,
        challenger: profileMap.get(c.challenger_id),
        challenged: profileMap.get(c.challenged_id),
        my_count: (myRes.data as number) ?? 0,
        their_count: (theirRes.data as number) ?? 0,
      }
    }))

    setActiveChallenges(enrichedActive.filter(Boolean) as Challenge[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchChallenges() }, [fetchChallenges])

  const createChallenge = useCallback(async (friendId: string, goal: number) => {
    if (!user) return
    const weekStart = getWeekStart()
    const duplicate = [...activeChallenges, ...pendingSent, ...pendingIncoming].find(c =>
      (c.challenger_id === friendId || c.challenged_id === friendId)
    )
    if (duplicate) return

    const { error } = await supabase.from('challenges').insert({
      challenger_id: user.id,
      challenged_id: friendId,
      goal,
      week_start: weekStart,
      status: 'pending',
    })
    if (error) console.error('createChallenge error:', error)
    else await fetchChallenges()
  }, [user, activeChallenges, pendingSent, pendingIncoming, fetchChallenges])

  const acceptChallenge = useCallback(async (challengeId: string) => {
    const { error } = await supabase.from('challenges').update({ status: 'active' }).eq('id', challengeId)
    if (error) console.error('acceptChallenge error:', error)
    else await fetchChallenges()
  }, [fetchChallenges])

  const declineChallenge = useCallback(async (challengeId: string) => {
    await supabase.from('challenges').delete().eq('id', challengeId)
    await fetchChallenges()
  }, [fetchChallenges])

  const quitChallenge = useCallback(async (challengeId: string) => {
    await supabase.from('challenges').delete().eq('id', challengeId)
    await fetchChallenges()
  }, [fetchChallenges])

  const hasPendingOrActive = useCallback((friendId: string) => {
    return [...activeChallenges, ...pendingSent, ...pendingIncoming].some(c =>
      c.challenger_id === friendId || c.challenged_id === friendId
    )
  }, [activeChallenges, pendingSent, pendingIncoming])

  return {
    activeChallenges, pendingIncoming, pendingSent, completedChallenges, loading,
    createChallenge, acceptChallenge, declineChallenge, quitChallenge, hasPendingOrActive,
    refetch: fetchChallenges,
  }
}
