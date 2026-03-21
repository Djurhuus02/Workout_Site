import { Page } from '../types'

interface Props {
  current: Page
  onChange: (page: Page) => void
  hasActive: boolean
}

const tabs: { id: Page; label: string; icon: JSX.Element }[] = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11" />
        <circle cx="3.5" cy="6.5" r="1" />
        <circle cx="3.5" cy="12" r="1" />
        <circle cx="3.5" cy="17.5" r="1" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 'exercises',
    label: 'Exercises',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h8" />
        <path d="M3.5 6.5h0M3.5 12h0M3.5 17.5h0" strokeWidth={3} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
]

export default function Navigation({ current, onChange, hasActive }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = current === tab.id
          const showDot = tab.id === 'workout' && hasActive
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors
                ${isActive ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <div className="relative">
                {tab.icon}
                {showDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400" />
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
