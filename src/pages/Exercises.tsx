import { useState, useMemo } from 'react'
import { ExerciseCategory } from '../types'
import { exercises, categoryLabels, categoryColors } from '../data/exercises'

const ALL = 'all'

export default function Exercises() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>(ALL)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return exercises.filter(ex => {
      if (category !== ALL && ex.category !== category) return false
      if (q && !ex.name.toLowerCase().includes(q) &&
          !ex.primaryMuscles.join(' ').toLowerCase().includes(q) &&
          !ex.equipment.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, category])

  const grouped = useMemo(() => {
    if (query || category !== ALL) return null
    const map = new Map<string, typeof exercises>()
    for (const ex of filtered) {
      const label = categoryLabels[ex.category]
      const arr = map.get(label) ?? []
      arr.push(ex)
      map.set(label, arr)
    }
    return map
  }, [filtered, query, category])

  const categoryOrder = Object.values(categoryLabels)

  return (
    <div className="pt-6 pb-6">
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-bold text-white mb-4">Exercises</h1>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-700 focus-within:border-orange-500 transition-colors mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500 flex-shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
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
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setCategory(ALL)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
            ${category === ALL ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          All ({exercises.length})
        </button>
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = exercises.filter(e => e.category === key).length
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${category === key ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Results */}
      <div className="px-4">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-600 mt-12">No exercises found</p>
        ) : grouped ? (
          categoryOrder
            .filter(label => grouped.has(label))
            .map(label => {
              const exs = grouped.get(label)!
              const key = Object.entries(categoryLabels).find(([, v]) => v === label)![0]
              return (
                <div key={label} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[key]}`}>
                      {label}
                    </span>
                    <span className="text-xs text-gray-600">{exs.length}</span>
                  </div>
                  <div className="space-y-px">
                    {exs.map(ex => (
                      <ExerciseItem key={ex.id} exercise={ex} />
                    ))}
                  </div>
                </div>
              )
            })
        ) : (
          <div className="space-y-px">
            {filtered.map(ex => <ExerciseItem key={ex.id} exercise={ex} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function ExerciseItem({ exercise }: { exercise: typeof exercises[0] }) {
  const badgeCls = categoryColors[exercise.category] ?? 'bg-gray-700 text-gray-400'
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-800 last:border-0">
      <div className="min-w-0">
        <p className="font-medium text-white text-sm">{exercise.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {exercise.primaryMuscles.join(', ')}
          {exercise.secondaryMuscles.length > 0 && (
            <span className="text-gray-700"> · {exercise.secondaryMuscles.join(', ')}</span>
          )}
        </p>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeCls}`}>
          {categoryLabels[exercise.category as ExerciseCategory]}
        </span>
        <span className="text-xs text-gray-600">{exercise.equipment}</span>
      </div>
    </div>
  )
}
