import { useEffect } from 'react'
import { Achievement } from '../data/achievements'

interface Props {
  justUnlocked: Achievement[]
  onDismiss: (id: string) => void
}

export default function AchievementToast({ justUnlocked, onDismiss }: Props) {
  const current = justUnlocked[0]

  useEffect(() => {
    if (!current) return
    const timer = setTimeout(() => onDismiss(current.id), 4000)
    return () => clearTimeout(timer)
  }, [current, onDismiss])

  if (!current) return null

  return (
    <div
      style={{
        position: 'fixed', top: 'calc(env(safe-area-inset-top) + 12px)',
        left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)', maxWidth: 480,
        background: '#1a1d24', border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: 16, padding: '12px 16px', zIndex: 300,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
      onClick={() => onDismiss(current.id)}
    >
      <span style={{ fontSize: 28 }} className="no-invert">{current.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Achievement unlocked
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
          {current.name}
        </p>
      </div>
    </div>
  )
}
