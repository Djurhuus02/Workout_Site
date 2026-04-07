import { useState, useMemo } from 'react'
import { Exercise, ExerciseCategory } from '../types'
import { exercises, categoryLabels, categoryColors } from '../data/exercises'
import { exerciseImageMap } from '../data/exerciseImages'
import ExerciseImageModal from './ExerciseImageModal'

interface Props {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  exclude?: string[]
}

const ALL = 'all'
const categories = [ALL, ...Object.keys(categoryLabels)] as const

export default function ExercisePicker({ onSelect, onClose, exclude = [] }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>(ALL)
  const [modalExercise, setModalExercise] = useState<Exercise | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return exercises.filter(ex => {
      if (exclude.includes(ex.id)) return false
      if (category !== ALL && ex.category !== category) return false
      if (q && !ex.name.toLowerCase().includes(q) &&
          !ex.primaryMuscles.join(' ').toLowerCase().includes(q)) return false
      return true
    })
  }, [query, category, exclude])

  // Group by first letter
  const grouped = useMemo(() => {
    if (query || category !== ALL) return null
    const map = new Map<string, Exercise[]>()
    for (const ex of filtered) {
      const letter = ex.name[0].toUpperCase()
      const arr = map.get(letter) ?? []
      arr.push(ex)
      map.set(letter, arr)
    }
    return map
  }, [filtered, query, category])

  return (
    <>
      {modalExercise && (
        <ExerciseImageModal exercise={modalExercise} onClose={() => setModalExercise(null)} />
      )}
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white">Add Exercise</h2>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700 focus-within:border-orange-500 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500 flex-shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Search exercises or muscles..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-500 hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${category === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {cat === ALL ? 'All' : categoryLabels[cat as ExerciseCategory]}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-600 mt-12">No exercises found</p>
          ) : grouped ? (
            [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([letter, exs]) => (
              <div key={letter}>
                <div className="sticky top-0 bg-gray-950 py-1 mb-1">
                  <span className="text-xs font-bold text-gray-600">{letter}</span>
                </div>
                {exs.map(ex => (
                  <ExerciseRow key={ex.id} exercise={ex} onSelect={onSelect} onImageClick={setModalExercise} />
                ))}
              </div>
            ))
          ) : (
            filtered.map(ex => (
              <ExerciseRow key={ex.id} exercise={ex} onSelect={onSelect} onImageClick={setModalExercise} />
            ))
          )}
        </div>
      </div>
    </>
  )
}

function ExerciseRow({ exercise, onSelect, onImageClick }: {
  exercise: Exercise
  onSelect: (e: Exercise) => void
  onImageClick: (e: Exercise) => void
}) {
  const badgeCls = categoryColors[exercise.category] ?? 'bg-gray-700 text-gray-400'
  const imgUrl = exerciseImageMap[exercise.id]
  return (
    <button
      onClick={() => onSelect(exercise)}
      className="w-full flex items-center gap-3 py-2.5 border-b border-gray-800 text-left hover:bg-gray-800/50 transition-colors rounded-lg px-2"
    >
      <div
        className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-800 overflow-hidden"
        onClick={e => { e.stopPropagation(); onImageClick(exercise) }}
      >
        {imgUrl ? (
          <img src={imgUrl} alt={exercise.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-600">
              <rect x="2" y="9" width="3" height="6" rx="1" /><rect x="19" y="9" width="3" height="6" rx="1" />
              <rect x="5" y="7" width="2" height="10" rx="0.5" /><rect x="17" y="7" width="2" height="10" rx="0.5" />
              <line x1="7" y1="12" x2="17" y2="12" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white truncate">{exercise.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {exercise.primaryMuscles.join(', ')} · {exercise.equipment}
        </p>
      </div>
      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${badgeCls}`}>
        {categoryLabels[exercise.category as ExerciseCategory]}
      </span>
    </button>
  )
}
