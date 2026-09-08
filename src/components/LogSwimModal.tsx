import { useState } from 'react'
import { WorkoutSession } from '../types'
import { formatSwimPace } from '../utils/calculations'

interface Props {
  onSave: (session: WorkoutSession) => void
  onClose: () => void
}

function todayInputValue() {
  const now = new Date()
  const tz = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tz).toISOString().slice(0, 10)
}

export default function LogSwimModal({ onSave, onClose }: Props) {
  const [distanceM, setDistanceM] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [date, setDate] = useState(todayInputValue())
  const [notes, setNotes] = useState('')

  const distanceMeters = parseFloat(distanceM) || 0
  const durationSeconds = (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0)
  const canSave = distanceMeters > 0 && durationSeconds > 0

  const handleSave = () => {
    if (!canSave) return
    // The native date input can be cleared to '' (its own "x" button, or select-all+delete),
    // which would otherwise produce an Invalid Date and throw on .toISOString() below.
    const parsedDate = new Date(`${date || todayInputValue()}T12:00:00`)
    const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()
    onSave({
      id: crypto.randomUUID(),
      date: isoDate,
      name: 'Swim',
      type: 'swim',
      exercises: [],
      durationSeconds,
      distanceKm: distanceMeters / 1000,
      notes: notes.trim() || undefined,
    })
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    color: 'rgba(255,255,255,0.9)', fontSize: 15, padding: '12px 14px',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = { margin: '0 0 6px', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)', zIndex: 200,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1d24', borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '24px 24px 40px', width: '100%', maxWidth: 512,
        }}
      >
        <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
          <span className="no-invert">🏊</span> Log a Swim
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Distance and time — counts toward your training too.
        </p>

        <div style={{ marginBottom: 16 }}>
          <p style={labelStyle}>Distance (m)</p>
          <input
            type="number" inputMode="decimal" min={0} step={25}
            value={distanceM} onChange={e => setDistanceM(e.target.value)}
            placeholder="1500" autoFocus style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={labelStyle}>Duration</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="number" inputMode="numeric" min={0}
              value={minutes} onChange={e => setMinutes(e.target.value)}
              placeholder="30" style={inputStyle}
            />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>min</span>
            <input
              type="number" inputMode="numeric" min={0} max={59}
              value={seconds} onChange={e => setSeconds(e.target.value)}
              placeholder="00" style={inputStyle}
            />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>sec</span>
          </div>
          {distanceMeters > 0 && durationSeconds > 0 && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#F97316' }}>
              Pace: {formatSwimPace(distanceMeters, durationSeconds)}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={labelStyle}>Date</p>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={labelStyle}>Notes (optional)</p>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Freestyle intervals, felt strong..."
            rows={2}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: '100%', padding: '14px',
            background: canSave ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 12, color: canSave ? 'white' : 'rgba(255,255,255,0.3)',
            fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >
          Save Swim
        </button>
        <button
          onClick={onClose}
          style={{
            marginTop: 10, width: '100%', padding: '12px',
            background: 'none', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, color: 'rgba(255,255,255,0.35)',
            fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
