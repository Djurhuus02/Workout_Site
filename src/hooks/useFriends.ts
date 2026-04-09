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

    // Load own profile — create if missing (existing users pre-trigger)
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

    // Load friendships with both profiles
    const { data: fs } = await supabase
      .from('friendships')
      .select('*, requester:profiles!requester_id(id,username,display_name), addressee:profiles!addressee_id(id,username,display_name)')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    if (fs) {
      setFriends((fs as Friendship[]).filter(f => f.status === 'accepted'))
      setPendingIncoming((fs as Friendship[]).filter(f => f.status === 'pending' && f.addressee_id === user.id))
      setPendingSent((fs as Friendship[]).filter(f => f.status === 'pending' && f.requester_id === user.id))
    }

    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateUsername = useCallback(async (username: string) => {
    if (!user) return
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: clean })
    if (!error) setProfile(p => p ? { ...p, username: clean } : p)
    return error
  }, [user])

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !user) { setSearchResults([]); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .neq('id', user.id)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10)
    setSearchResults((data as Profile[]) ?? [])
  }, [user])

  const sendRequest = useCallback(async (addresseeId: string) => {
    if (!user) return
    await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: 'pending',
    })
    await fetchAll()
  }, [user, fetchAll])

  const acceptRequest = useCallback(async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
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

  // Get the friend's profile from a friendship record
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
