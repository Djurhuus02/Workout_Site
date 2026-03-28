import { forwardRef } from 'react'
import { WorkoutSession } from '../types'
import { totalVolume, formatDuration } from '../utils/calculations'

interface Props {
  workout: WorkoutSession
}

const ShareCard = forwardRef<HTMLDivElement, Props>(({ workout }, ref) => {
  const volume = totalVolume(workout)
  const date = new Date(workout.date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div
      ref={ref}
      style={{
        width: 400,
        background: '#0F1115',
        borderRadius: 20,
        padding: '28px 28px 24px',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        border: '1px solid rgba(249,115,22,0.2)',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(249,115,22,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="12" width="4" height="8" rx="1.5" fill="#F97316" />
            <rect x="6" y="10" width="3" height="12" rx="1" fill="#F97316" opacity="0.8" />
            <rect x="23" y="10" width="3" height="12" rx="1" fill="#F97316" opacity="0.8" />
            <rect x="26" y="12" width="4" height="8" rx="1.5" fill="#F97316" />
            <rect x="9" y="14" width="14" height="4" rx="1" fill="#F97316" opacity="0.6" />
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>LiftTracker</span>
      </div>

      {/* Workout name + date */}
      <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{workout.name}</p>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{date}</p>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20,
      }}>
        {[
          { label: 'Duration', value: formatDuration(workout.durationSeconds) },
          { label: 'Volume', value: `${volume.toLocaleString()} kg` },
          { label: 'Exercises', value: String(workout.exercises.length) },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '10px 12px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: "'Space Mono', monospace" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Exercises */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {workout.exercises.slice(0, 6).map(ex => {
          const best = ex.sets
            .filter(s => s.completed && s.weight > 0 && s.reps > 0)
            .sort((a, b) => b.weight - a.weight)[0]
          const completedSets = ex.sets.filter(s => s.completed).length
          return (
            <div key={ex.id} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '8px 12px',
              background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{ex.exerciseName}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginLeft: 8 }}>
                {completedSets} {completedSets === 1 ? 'set' : 'sets'}{best ? ` · ${best.weight}kg × ${best.reps}` : ''}
              </span>
            </div>
          )
        })}
        {workout.exercises.length > 6 && (
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
            +{workout.exercises.length - 6} more
          </p>
        )}
      </div>

      {/* Notes */}
      {workout.notes && (
        <div style={{
          background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)',
          borderRadius: 10, padding: '10px 12px', marginBottom: 20,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>"{workout.notes}"</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>lifttracker · logged with 🧡</span>
      </div>
    </div>
  )
})

ShareCard.displayName = 'ShareCard'
export default ShareCard
