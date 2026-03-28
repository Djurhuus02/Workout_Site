import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { WorkoutSession, Page } from '../types'
import WorkoutCard from '../components/WorkoutCard'
import { totalVolume } from '../utils/calculations'

const TEMPLATES = [
  {
    name: 'Push Day', icon: '💪',
    exercises: [
      { exerciseId: 'bench_press', exerciseName: 'Bench Press' },
      { exerciseId: 'incline_db_bench_press', exerciseName: 'Incline Dumbbell Bench Press' },
      { exerciseId: 'barbell_ohp', exerciseName: 'Overhead Press' },
      { exerciseId: 'lateral_raise', exerciseName: 'Lateral Raise' },
      { exerciseId: 'tricep_pushdown_rope', exerciseName: 'Tricep Pushdown (Rope)' },
    ],
  },
  {
    name: 'Pull Day', icon: '🏋️',
    exercises: [
      { exerciseId: 'barbell_row', exerciseName: 'Barbell Row' },
      { exerciseId: 'lat_pulldown', exerciseName: 'Lat Pulldown' },
      { exerciseId: 'cable_row', exerciseName: 'Seated Cable Row' },
      { exerciseId: 'face_pull', exerciseName: 'Face Pull' },
      { exerciseId: 'barbell_curl', exerciseName: 'Barbell Curl' },
      { exerciseId: 'hammer_curl', exerciseName: 'Hammer Curl' },
    ],
  },
  {
    name: 'Leg Day', icon: '🦵',
    exercises: [
      { exerciseId: 'back_squat', exerciseName: 'Back Squat' },
      { exerciseId: 'leg_press', exerciseName: 'Leg Press' },
      { exerciseId: 'romanian_deadlift', exerciseName: 'Romanian Deadlift' },
      { exerciseId: 'leg_curl_lying', exerciseName: 'Leg Curl (Lying)' },
      { exerciseId: 'leg_extension', exerciseName: 'Leg Extension' },
      { exerciseId: 'calf_raise_standing', exerciseName: 'Standing Calf Raise' },
    ],
  },
]

const DumbbellIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="2" y="12" width="4" height="8" rx="1.5" fill={color} />
    <rect x="6" y="10" width="3" height="12" rx="1" fill={color} opacity="0.8" />
    <rect x="23" y="10" width="3" height="12" rx="1" fill={color} opacity="0.8" />
    <rect x="26" y="12" width="4" height="8" rx="1.5" fill={color} />
    <rect x="9" y="14" width="14" height="4" rx="1" fill={color} opacity="0.6" />
  </svg>
)

const FlameIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 1C8 1 3 6 3 9.5C3 12.5 5.2 15 8 15C10.8 15 13 12.5 13 9.5C13 6 8 1 8 1ZM8 13C6.3 13 5 11.7 5 10C5 8.3 8 4 8 4C8 4 11 8.3 11 10C11 11.7 9.7 13 8 13Z" fill="#F97316" />
  </svg>
)

function StatCard({ label, value, unit, icon, accent }: {
  label: string; value: string; unit: string; icon?: React.ReactNode; accent?: boolean
}) {
  return (
    <div style={{
      background: accent ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.03)',
      border: accent ? '1px solid rgba(249,115,22,0.15)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <p style={{
          margin: 0, fontSize: 10,
          color: accent ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500,
        }}>{label}</p>
        {icon}
      </div>
      <p style={{
        margin: '6px 0 0', fontSize: 24, fontWeight: 700,
        color: accent ? '#F97316' : 'rgba(255,255,255,0.9)',
        fontFamily: "'Space Mono', monospace", letterSpacing: '-0.02em', lineHeight: 1,
      }}>{value}</p>
      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{unit}</p>
    </div>
  )
}

interface Props {
  workouts: WorkoutSession[]
  isActive: boolean
  onNavigate: (page: Page) => void
  onDeleteWorkout: (id: string) => void
  onStartTemplate: (name: string, exercises: { exerciseId: string; exerciseName: string }[]) => void
  signOut: () => void
  user?: User | null
}

export default function Dashboard({ workouts, isActive, onNavigate, onDeleteWorkout, onStartTemplate, signOut, user }: Props) {
  const [mounted, setMounted] = useState(false)
  const [hoveredTemplate, setHoveredTemplate] = useState<number | null>(null)

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  const thisWeek = workouts.filter(w => new Date(w.date) >= weekStart)
  const weekVolume = thisWeek.reduce((sum, w) => sum + totalVolume(w), 0)

  const streak = (() => {
    if (workouts.length === 0) return 0
    const uniqueDays = [...new Set(workouts.map(w => {
      const d = new Date(w.date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }))].sort((a, b) => b - a)
    let count = 0
    const check = new Date()
    check.setHours(0, 0, 0, 0)
    for (const dayTs of uniqueDays) {
      if (dayTs === check.getTime()) {
        count++
        check.setDate(check.getDate() - 1)
      } else {
        break
      }
    }
    return count
  })()

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? null

  const greet = () => {
    const h = today.getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const volumeDisplay = weekVolume >= 1000
    ? `${(weekVolume / 1000).toFixed(1)}t`
    : `${weekVolume}`

  const hasWorkouts = workouts.length > 0
  const transition = (delay = 0) =>
    `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -80, right: -60, width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        padding: '20px 24px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
        transition: transition(0),
        position: 'relative', zIndex: 1,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 400, letterSpacing: '0.02em' }}>
            {greet()}{firstName ? `, ${firstName}` : ''}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <DumbbellIcon size={28} color="#F97316" />
            <h1 style={{
              margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.75) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>LiftTracker</h1>
          </div>
        </div>
        <button
          onClick={signOut}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 14px',
            fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', marginTop: 4,
          }}
        >Sign out</button>
      </div>

      {/* Stats */}
      <div style={{
        padding: '20px 24px 0',
        display: 'grid', gridTemplateColumns: hasWorkouts ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(15px)',
        transition: transition(0.1),
        position: 'relative', zIndex: 1,
      }}>
        {hasWorkouts ? (
          <>
            <StatCard label="This week" value={String(thisWeek.length)} unit={thisWeek.length === 1 ? 'workout' : 'workouts'} />
            <StatCard label="Volume" value={volumeDisplay} unit="kg lifted" />
            <StatCard label="Streak" value={String(streak)} unit="days" icon={<FlameIcon />} accent />
          </>
        ) : (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>This week</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No workouts yet</p>
            </div>
            <div style={{
              background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(249,115,22,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Weekly goal</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#F97316' }}>Set a target →</p>
            </div>
          </>
        )}
      </div>

      {/* CTA Button */}
      <div style={{
        padding: '20px 24px 0',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(15px)',
        transition: transition(0.2),
        position: 'relative', zIndex: 1,
      }}>
        {isActive ? (
          <button
            onClick={() => onNavigate('workout')}
            style={{
              width: '100%', padding: '16px 24px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none', borderRadius: 14, color: 'white', fontSize: 16,
              fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 24px rgba(34,197,94,0.25)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'white', opacity: 0.9 }} />
            Resume Workout
          </button>
        ) : (
          <button
            onClick={() => onNavigate('workout')}
            style={{
              width: '100%', padding: '16px 24px',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              border: 'none', borderRadius: 14, color: 'white', fontSize: 16,
              fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 24px rgba(249,115,22,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 300 }}>+</span>
            Start Workout
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{
        padding: '24px 24px 100px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(15px)',
        transition: transition(0.3),
        position: 'relative', zIndex: 1,
      }}>
        {hasWorkouts ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Recent Workouts</h2>
              {workouts.length > 3 && (
                <span onClick={() => onNavigate('history')} style={{ fontSize: 13, color: '#F97316', cursor: 'pointer' }}>
                  View all →
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workouts.slice(0, 3).map(w => (
                <WorkoutCard key={w.id} workout={w} onDelete={() => onDeleteWorkout(w.id)} />
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Quick Start</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Pick a template or start from scratch</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TEMPLATES.map((t, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredTemplate(i)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  onClick={() => { onStartTemplate(t.name, t.exercises); onNavigate('workout') }}
                  style={{
                    background: hoveredTemplate === i ? 'rgba(249,115,22,0.06)' : 'rgba(255,255,255,0.03)',
                    border: hoveredTemplate === i ? '1px solid rgba(249,115,22,0.15)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                    transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', gap: 14,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(249,115,22,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  }}>{t.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{t.name}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{t.exercises.map(e => e.exerciseName).join(' · ')}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                    <path d="M6 3l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 20, padding: '16px 18px',
              background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.03) 100%)',
              border: '1px solid rgba(249,115,22,0.1)', borderRadius: 14, textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 20 }}>🎯</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                Your first workout is the hardest
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                After that, it's just showing up
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
