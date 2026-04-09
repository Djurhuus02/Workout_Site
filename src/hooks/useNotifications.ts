import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    if (!user) return
    const [{ count: fr }, { count: cr }] = await Promise.all([
      supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', user.id)
        .eq('status', 'pending'),
      supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('challenged_id', user.id)
        .eq('status', 'pending'),
    ])
    setCount((fr ?? 0) + (cr ?? 0))
  }, [user])

  useEffect(() => {
    if (!user) return

    fetch()

    // Realtime — instant updates when a row is inserted/updated/deleted
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'friendships',
        filter: `addressee_id=eq.${user.id}`,
      }, fetch)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'challenges',
        filter: `challenged_id=eq.${user.id}`,
      }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetch])

  return count
}
