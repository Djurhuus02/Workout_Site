import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const [friendRequests, setFriendRequests] = useState(0)
  const [challengeRequests, setChallengeRequests] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetch = async () => {
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
      setFriendRequests(fr ?? 0)
      setChallengeRequests(cr ?? 0)
    }

    fetch()

    // Re-check every 30 seconds
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [user])

  return friendRequests + challengeRequests
}
