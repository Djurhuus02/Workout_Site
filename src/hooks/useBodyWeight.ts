import { useState, useEffect, useCallback } from 'react'
import { BodyWeightLog } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useBodyWeight() {
  const [logs, setLogs] = useState<BodyWeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLogs([])
      setLoading(false)
      return
    }

    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('body_weight_logs')
        .select('id, weight_kg, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(90)

      if (!error && data) setLogs(data as BodyWeightLog[])
      setLoading(false)
    }

    fetch()
  }, [user])

  const addLog = useCallback(async (weight_kg: number) => {
    if (!user) return

    const optimistic: BodyWeightLog = {
      id: crypto.randomUUID(),
      weight_kg,
      logged_at: new Date().toISOString(),
    }

    setLogs(prev => [optimistic, ...prev])

    const { error } = await supabase
      .from('body_weight_logs')
      .insert({ id: optimistic.id, user_id: user.id, weight_kg })

    if (error) {
      console.error('Error saving body weight:', error)
      setLogs(prev => prev.filter(l => l.id !== optimistic.id))
    }
  }, [user])

  const deleteLog = useCallback(async (id: string) => {
    if (!user) return
    const prev = logs
    setLogs(p => p.filter(l => l.id !== id))
    const { error } = await supabase
      .from('body_weight_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) setLogs(prev)
  }, [user, logs])

  const latest = logs[0]?.weight_kg ?? null

  return { logs, loading, latest, addLog, deleteLog }
}
