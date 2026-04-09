import { useState, useEffect, useCallback } from 'react'
import { Profile, Friendship } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useFriends() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [friends, setFriends] = useState<Friendship[]>([])
  const [pendingIncoming, setPendingIncoming] = useState<Friendship[]>([])
  const [pendingSent, setPendingSent] = useState<Friendship[]>([])
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // Own profile — create if missing (users who signed up before the trigger)
    let { data: prof } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('id', user.id)
      .single()

    if (!prof) {
      const displayName =
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split('@')[0] ?? 'User'
      await supabase.from('profiles').upsert({ id: user.id, display_name: displayName })
      prof = { id: user.id, username: null, display_name: displayName }
    }
    setProfile(prof as Profile)

    // Load raw friendships (no join — FK points to auth.users not profiles)
    const { data: fs, error: fsError } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    if (fsError) console.error('friendships fetch error:', fsError)

    if (!fs || fs.length === 0) {
      setFriends([])
      setPendingIncoming([])
      setPendingSent([])
      setLoading(false)
      return
    }

    // Collect the other users' IDs and fetch their profiles separately
    const otherIds = [...new Set(
      fs.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)
    )]

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', otherIds)

    const profileMap = new Map((profileData ?? []).map(p => [p.id, p as Profile]))

    // Enrich friendships with profile objects
    const enriched: Friendship[] = fs.map(f => ({
      ...f,
      requester: profileMap.get(f.requester_id),
      addressee: profileMap.get(f.addressee_id),
    }))

    setFriends(enriched.filter(f => f.status === 'accepted'))
    setPendingIncoming(enriched.filter(f => f.status === 'pending' && f.addressee_id === user.id))
    setPendingSent(enriched.filter(f => f.status === 'pending' && f.requester_id === user.id))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateUsername = useCallback(async (username: string) => {
    if (!user) return null
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: clean })
    if (!error) setProfile(p => p ? { ...p, username: clean } : p)
    return error ?? null
  }, [user])

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !user) { setSearchResults([]); return }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .neq('id', user.id)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10)
    if (error) console.error('search error:', error)
    setSearchResults((data as Profile[]) ?? [])
  }, [user])

  const sendRequest = useCallback(async (addresseeId: string): Promise<string | null> => {
    if (!user) return 'Not logged in'
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: 'pending',
    })
    if (error) {
      console.error('sendRequest error:', error)
      return error.message
    }
    await fetchAll()
    return null
  }, [user, fetchAll])

  const acceptRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    if (error) console.error('acceptRequest error:', error)
    await fetchAll()
  }, [fetchAll])

  const declineRequest = useCallback(async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await fetchAll()
  }, [fetchAll])

  const removeFriend = useCallback(async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await fetchAll()
  }, [fetchAll])

  const getFriendProfile = useCallback((f: Friendship): Profile | undefined => {
    if (!user) return undefined
    return f.requester_id === user.id ? f.addressee : f.requester
  }, [user])

  return {
    profile, friends, pendingIncoming, pendingSent, searchResults, loading,
    updateUsername, searchUsers, sendRequest, acceptRequest, declineRequest,
    removeFriend, getFriendProfile, refetch: fetchAll,
  }
}
