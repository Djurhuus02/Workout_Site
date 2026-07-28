import { calculatePlates, BAR_WEIGHT_KG } from '../utils/plates'

interface Props {
  weightKg: number
  onClose: () => void
}

const PLATE_COLORS: Record<number, string> = {
  25: '#ef4444',
  20: '#3b82f6',
  15: '#eab308',
  10: '#22c55e',
  5: '#f8fafc',
  2.5: '#111827',
  1.25: '#9ca3af',
}

export default function PlateCalculatorModal({ weightKg, onClose }: Props) {
  const { platesPerSide, remainder } = calculatePlates(weightKg)

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
          Plate calculator
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          {weightKg} kg total, {BAR_WEIGHT_KG} kg bar
        </p>

        {platesPerSide.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            Just the bar — no plates needed.
          </p>
        ) : (
          <>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Per side:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: remainder > 0 ? 12 : 0 }}>
              {platesPerSide.map((plate, i) => (
                <div
                  key={i}
                  style={{
                    width: 48, height: 48, borderRadius: 8,
                    background: PLATE_COLORS[plate] ?? '#6b7280',
                    color: plate === 5 || plate === 1.25 ? '#111827' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                    border: '1px solid rgba(0,0,0,0.2)',
                  }}
                >
                  {plate}
                </div>
              ))}
            </div>
          </>
        )}

        {remainder > 0 && (
          <p style={{ margin: 0, fontSize: 12, color: '#F97316' }}>
            {remainder} kg per side can't be made with standard plates.
          </p>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 20, width: '100%', padding: '12px', borderRadius: 12,
            background: 'none', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
