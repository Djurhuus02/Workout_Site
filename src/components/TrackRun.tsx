import { useState, useMemo, useRef } from 'react'
import { useRunTracking } from '../hooks/useRunTracking'
import { WorkoutSession, LatLng } from '../types'
import { formatDuration, formatPace, routeDistanceKm, ROUTE_SUGGESTION_DISTANCES } from '../utils/calculations'
import { suggestRoute, RouteSuggestionError } from '../lib/routeSuggestion'
import RouteMap from './RouteMap'

interface Props {
  onSave: (session: WorkoutSession) => void
  onClose: () => void
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 })
  })
}

export default function TrackRun({ onSave, onClose }: Props) {
  const { status, route, elapsedSeconds, error, lastGapSeconds, start, resume, pause, finish, discard, dismissGap } = useRunTracking()
  const [saving, setSaving] = useState(false)

  const [suggestedRoute, setSuggestedRoute] = useState<LatLng[] | null>(null)
  const [requestedDistance, setRequestedDistance] = useState<{ key: string; km: number } | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  // Bumped on every new request and on Clear — a response only gets applied if it's
  // still the most recent one, so double-tapping Regenerate or clearing mid-request
  // can't have a stale/in-flight response silently overwrite the current state.
  const suggestionTokenRef = useRef(0)

  const distanceKm = useMemo(() => Math.round(routeDistanceKm(route) * 100) / 100, [route])
  const suggestedDistanceKm = useMemo(
    () => suggestedRoute ? Math.round(routeDistanceKm(suggestedRoute) * 100) / 100 : null,
    [suggestedRoute]
  )

  const handleSuggest = async (key: string, km: number) => {
    const token = ++suggestionTokenRef.current
    setIsSuggesting(true)
    setSuggestionError(null)
    setRequestedDistance({ key, km })
    try {
      const pos = await getCurrentPosition()
      const points = await suggestRoute({ lat: pos.coords.latitude, lng: pos.coords.longitude }, km)
      if (token !== suggestionTokenRef.current) return
      setSuggestedRoute(points)
    } catch (err) {
      if (token !== suggestionTokenRef.current) return
      setSuggestionError(err instanceof RouteSuggestionError ? err.message : 'Could not get a route suggestion — check location access.')
    } finally {
      if (token === suggestionTokenRef.current) setIsSuggesting(false)
    }
  }

  const clearSuggestion = () => {
    suggestionTokenRef.current++
    setSuggestedRoute(null)
    setSuggestionError(null)
    setIsSuggesting(false)
  }

  const handleClose = () => {
    if (status === 'idle') {
      onClose()
      return
    }
    if (confirm('Discard this run? Your recorded route will be lost.')) {
      discard()
      onClose()
    }
  }

  const handleFinish = () => {
    const result = finish()
    if (result.route.length < 2 || result.durationSeconds < 5) {
      onClose()
      return
    }
    setSaving(true)
    const finalDistanceKm = Math.round(routeDistanceKm(result.route) * 100) / 100
    onSave({
      id: crypto.randomUUID(),
      date: new Date(result.startedAt ?? Date.now()).toISOString(),
      name: 'Run',
      type: 'run',
      exercises: [],
      durationSeconds: result.durationSeconds,
      distanceKm: finalDistanceKm,
      route: result.route,
    })
  }

  const btnStyle = (bg: string) => ({
    flex: 1, padding: '16px 0', borderRadius: 14, border: 'none',
    color: 'white', fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
    cursor: 'pointer', background: bg,
  })

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-950" style={{ zIndex: 200 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <h1 className="text-lg font-bold text-white">
          <span className="no-invert">🏃</span> Track Run
        </h1>
        <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Suggest a route — picking a new distance only makes sense before you've started */}
      {status === 'idle' && (
        <div className="px-4 mb-3">
          <p className="text-xs text-gray-500 mb-2">Suggest a loop route</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {ROUTE_SUGGESTION_DISTANCES.map(d => {
              const isActive = requestedDistance?.key === d.key && (isSuggesting || suggestedRoute)
              return (
                <button
                  key={d.key}
                  onClick={() => handleSuggest(d.key, d.km)}
                  disabled={isSuggesting}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                    ${isActive ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}
                    ${isSuggesting && !isActive ? 'opacity-40' : ''}`}
                >
                  {isSuggesting && requestedDistance?.key === d.key ? '…' : d.label}
                </button>
              )
            })}
          </div>
          {suggestionError && (
            <p className="text-xs text-red-400 mt-2">{suggestionError}</p>
          )}
        </div>
      )}

      {/* Suggested-route info stays reachable for the whole run, not just before starting,
          so there's always a way to clear the guide overlay once one's been picked. */}
      {suggestedRoute && (
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="text-xs" style={{ color: '#38bdf8' }}>~{suggestedDistanceKm} km loop suggested</p>
          <div className="flex gap-3">
            {status === 'idle' && (
              <button
                onClick={() => requestedDistance && handleSuggest(requestedDistance.key, requestedDistance.km)}
                disabled={isSuggesting}
                className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40"
              >
                Regenerate
              </button>
            )}
            <button onClick={clearSuggestion} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="px-4 mb-3" style={{ flex: '1 1 auto', minHeight: 0 }}>
        <RouteMap route={route} guideRoute={suggestedRoute ?? undefined} height="100%" live={status === 'tracking'} />
      </div>

      {error && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {lastGapSeconds !== null && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3">
          <p className="text-xs text-amber-400">
            Tracking gap of ~{formatDuration(lastGapSeconds)} — switching apps or locking your screen pauses GPS, so distance for that stretch is likely underestimated.
          </p>
          <button onClick={dismissGap} className="text-amber-400/70 hover:text-amber-400 flex-shrink-0 text-xs">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-3 px-4 mb-4">
        <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
          <p className="text-xs text-gray-500">Distance</p>
          <p className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>{distanceKm} km</p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
          <p className="text-xs text-gray-500">Duration</p>
          <p className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>{formatDuration(elapsedSeconds)}</p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
          <p className="text-xs text-gray-500">Pace</p>
          <p className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>{formatPace(distanceKm, elapsedSeconds)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-6 flex gap-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        {status === 'idle' && (
          <button onClick={start} disabled={saving} style={btnStyle('linear-gradient(135deg, #F97316 0%, #EA580C 100%)')}>
            Start Run
          </button>
        )}
        {status === 'tracking' && (
          <>
            <button onClick={pause} style={btnStyle('rgba(255,255,255,0.08)')}>Pause</button>
            <button onClick={handleFinish} disabled={saving} style={btnStyle('linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}>
              {saving ? 'Saving…' : 'Finish'}
            </button>
          </>
        )}
        {status === 'paused' && (
          <>
            <button onClick={resume} style={btnStyle('linear-gradient(135deg, #F97316 0%, #EA580C 100%)')}>Resume</button>
            <button onClick={handleFinish} disabled={saving} style={btnStyle('linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}>
              {saving ? 'Saving…' : 'Finish'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
