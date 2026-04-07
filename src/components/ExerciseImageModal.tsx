import { useEffect } from 'react'
import { Exercise, ExerciseCategory } from '../types'
import { categoryLabels, categoryColors } from '../data/exercises'
import { exerciseImageMap } from '../data/exerciseImages'

interface Props {
  exercise: Exercise
  onClose: () => void
}

export default function ExerciseImageModal({ exercise, onClose }: Props) {
  const imgUrl = exerciseImageMap[exercise.id]
  const badgeCls = categoryColors[exercise.category] ?? 'bg-gray-700 text-gray-400'

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-gray-900 rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full bg-gray-800" style={{ height: 260 }}>
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={exercise.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-16 h-16 text-gray-600">
                <rect x="2" y="9" width="3" height="6" rx="1" /><rect x="19" y="9" width="3" height="6" rx="1" />
                <rect x="5" y="7" width="2" height="10" rx="0.5" /><rect x="17" y="7" width="2" height="10" rx="0.5" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </svg>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="px-5 pt-4 pb-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-white leading-tight">{exercise.name}</h2>
            <span className={`flex-shrink-0 mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeCls}`}>
              {categoryLabels[exercise.category as ExerciseCategory]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500 flex-shrink-0">
              <rect x="2" y="9" width="3" height="6" rx="1" /><rect x="19" y="9" width="3" height="6" rx="1" />
              <rect x="5" y="7" width="2" height="10" rx="0.5" /><rect x="17" y="7" width="2" height="10" rx="0.5" />
              <line x1="7" y1="12" x2="17" y2="12" />
            </svg>
            <span className="text-sm text-gray-400">{exercise.equipment}</span>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Primary muscles</p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.primaryMuscles.map(m => (
                  <span key={m} className="px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 text-xs font-medium">{m}</span>
                ))}
              </div>
            </div>

            {exercise.secondaryMuscles.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Secondary muscles</p>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.secondaryMuscles.map(m => (
                    <span key={m} className="px-2.5 py-1 rounded-full bg-gray-700 text-gray-400 text-xs font-medium">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
