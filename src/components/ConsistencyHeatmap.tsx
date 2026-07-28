import { WorkoutSession } from '../types'
import { getWorkoutDateSet, getWeekStartDate, toDateKey } from '../utils/calculations'

interface Props {
  workouts: WorkoutSession[]
  weeks?: number
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ConsistencyHeatmap({ workouts, weeks = 12 }: Props) {
  const dateSet = getWorkoutDateSet(workouts)
  const currentWeekStart = getWeekStartDate()

  const columns = Array.from({ length: weeks }, (_, i) => {
    const weekStart = new Date(currentWeekStart)
    weekStart.setDate(weekStart.getDate() - (weeks - 1 - i) * 7)
    return Array.from({ length: 7 }, (_, d) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + d)
      return { date, active: dateSet.has(toDateKey(date)) }
    })
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '14px 16px',
    }}>
      <p style={{
        margin: '0 0 10px', fontSize: 11, color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500,
      }}>Consistency</p>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
        {columns.map((col, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {col.map(({ date, active }, d) => {
              const isFuture = date.getTime() > today.getTime()
              return (
                <div
                  key={d}
                  title={date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: isFuture
                      ? 'transparent'
                      : active
                        ? '#F97316'
                        : 'rgba(255,255,255,0.06)',
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {DAY_LABELS.filter((_, i) => i === 0 || i === 3 || i === 6).map(label => (
          <span key={label} style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{label}</span>
        ))}
      </div>
    </div>
  )
}
