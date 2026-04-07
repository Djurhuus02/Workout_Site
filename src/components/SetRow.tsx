import { WorkoutSet } from '../types'

interface Props {
  set: WorkoutSet
  index: number
  previous?: { weight: number; reps: number } | null
  onUpdate: (patch: Partial<WorkoutSet>) => void
  onDelete: () => void
  isBodyweight?: boolean
  bodyWeightKg?: number | null
}

export default function SetRow({ set, index, previous, onUpdate, onDelete, isBodyweight, bodyWeightKg }: Props) {
  const handleWeight = (delta: number) => {
    const next = Math.max(0, Math.round((set.weight + delta) * 4) / 4)
    onUpdate({ weight: next })
  }

  const prevLabel = previous
    ? isBodyweight
      ? `BW${previous.weight > 0 ? `+${previous.weight}` : ''}×${previous.reps}`
      : `${previous.weight}×${previous.reps}`
    : '–'

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
      ${set.completed ? 'bg-green-500/10' : 'bg-gray-800'}`}>

      {/* Set number */}
      <span className="w-5 text-center text-xs font-bold text-gray-500">{index + 1}</span>

      {/* Previous hint */}
      <span className="w-16 text-center text-xs text-gray-600 truncate">{prevLabel}</span>

      {isBodyweight ? (
        /* ── Bodyweight mode ── */
        <div className="flex items-center gap-1.5 flex-1">
          <span className="px-2.5 py-1 rounded bg-gray-700 text-orange-400 text-xs font-bold tracking-wide">
            BW{bodyWeightKg ? ` ${bodyWeightKg}kg` : ''}
          </span>
          <button
            onClick={() => handleWeight(-2.5)}
            className="w-7 h-7 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center justify-center text-lg leading-none"
          >
            −
          </button>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.25}
            value={set.weight || ''}
            placeholder="0"
            onChange={e => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
            className="w-12 text-center bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white text-sm focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={() => handleWeight(2.5)}
            className="w-7 h-7 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center justify-center text-lg leading-none"
          >
            +
          </button>
          <span className="text-xs text-gray-500">+kg</span>
        </div>
      ) : (
        /* ── Weighted mode ── */
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => handleWeight(-2.5)}
            className="w-7 h-7 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center justify-center text-lg leading-none"
          >
            −
          </button>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.25}
            value={set.weight || ''}
            placeholder="0"
            onChange={e => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
            className="w-16 text-center bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white text-sm focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={() => handleWeight(2.5)}
            className="w-7 h-7 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center justify-center text-lg leading-none"
          >
            +
          </button>
          <span className="text-xs text-gray-500 ml-0.5">kg</span>
        </div>
      )}

      {/* Reps */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={set.reps || ''}
          placeholder="0"
          onChange={e => onUpdate({ reps: parseInt(e.target.value) || 0 })}
          className="w-12 text-center bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white text-sm focus:outline-none focus:border-orange-500"
        />
        <span className="text-xs text-gray-500">reps</span>
      </div>

      {/* Complete toggle */}
      <button
        onClick={() => onUpdate({ completed: !set.completed })}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
          ${set.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-600 text-transparent hover:border-green-500'}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  )
}
