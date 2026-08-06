import { useState, useRef, useCallback, useEffect } from 'react'
import { RoutePoint } from '../types'

const STORAGE_KEY = 'lift_tracker_active_run'
// Generous — desktop/WiFi-based geolocation and early GPS fixes before satellite
// lock often report 50-100m+ accuracy. The point is filtering out wild outliers,
// not demanding phone-GPS precision.
const MAX_ACCEPTABLE_ACCURACY_M = 75

interface RunDraft {
  route: RoutePoint[]
  elapsedSeconds: number
  startedAt: number | null
}

function loadDraft(): RunDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RunDraft
  } catch {
    return null
  }
}

export type RunStatus = 'idle' | 'tracking' | 'paused'

export function useRunTracking() {
  const [status, setStatus] = useState<RunStatus>(() => (loadDraft()?.route.length ? 'paused' : 'idle'))
  const [route, setRoute] = useState<RoutePoint[]>(() => loadDraft()?.route ?? [])
  const [elapsedSeconds, setElapsedSeconds] = useState(() => loadDraft()?.elapsedSeconds ?? 0)
  const [startedAt, setStartedAt] = useState<number | null>(() => loadDraft()?.startedAt ?? null)
  const [error, setError] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Wall-clock time the current tracking segment resumed, and how much elapsed time
  // was already banked before it — lets pause/resume behave like a stopwatch, not a
  // single continuous watchPosition subscription (which we tear down on pause to save battery).
  const segmentStartRef = useRef(0)
  const baseElapsedRef = useRef(0)

  // Read via refs rather than as effect dependencies below — elapsedSeconds ticks every
  // second, and this draft only needs to survive an accidental reload, not stay
  // perfectly in sync. Keying the write off it too would re-stringify the whole
  // (growing) route array every second for no benefit. A periodic checkpoint (see the
  // tick interval in `start`) bounds how stale the persisted elapsedSeconds can get
  // during a stretch with no accepted GPS fix, instead of only updating on route change.
  const elapsedSecondsRef = useRef(elapsedSeconds)
  const routeRef = useRef(route)
  const startedAtRef = useRef(startedAt)
  const statusRef = useRef(status)
  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds
  }, [elapsedSeconds])
  useEffect(() => {
    routeRef.current = route
  }, [route])
  useEffect(() => {
    startedAtRef.current = startedAt
  }, [startedAt])
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // Reads everything via refs (not the `status`/`route`/etc. state directly) so it's
  // safe to call from the long-lived tick interval's closure below without risking a
  // stale value from whatever render that closure happened to be created in.
  const persistDraft = () => {
    if (statusRef.current === 'idle' && routeRef.current.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        route: routeRef.current,
        elapsedSeconds: elapsedSecondsRef.current,
        startedAt: startedAtRef.current,
      }))
    }
  }

  useEffect(() => {
    persistDraft()
  }, [route, startedAt, status])

  const clearWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported on this device.')
      return
    }
    setError(null)
    baseElapsedRef.current = elapsedSeconds
    segmentStartRef.current = Date.now()
    setStartedAt(prev => prev ?? Date.now())
    setStatus('tracking')

    tickRef.current = setInterval(() => {
      const next = baseElapsedRef.current + Math.floor((Date.now() - segmentStartRef.current) / 1000)
      setElapsedSeconds(next)
      elapsedSecondsRef.current = next
      // Checkpoint the draft every 5s even without a new GPS fix, so a poor-signal
      // stretch can't leave the persisted elapsedSeconds arbitrarily far behind.
      if (next % 5 === 0) persistDraft()
    }, 1000)

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        setRoute(prev => {
          // Always accept the very first fix regardless of accuracy — otherwise a
          // poor initial signal (common indoors/on desktop) leaves the map stuck on
          // "waiting for GPS" forever. Later points still respect the threshold.
          if (prev.length > 0 && pos.coords.accuracy && pos.coords.accuracy > MAX_ACCEPTABLE_ACCURACY_M) {
            return prev
          }
          return [...prev, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            t: baseElapsedRef.current * 1000 + (Date.now() - segmentStartRef.current),
          }]
        })
      },
      err => setError(err.message || 'Unable to access your location.'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    )
  }, [elapsedSeconds])

  const pause = useCallback(() => {
    // Commit the exact elapsed time up to this instant before tearing down the tick
    // interval — otherwise up to ~1s (however stale the last 1Hz tick was) is silently
    // dropped from baseElapsedRef on the next resume, compounding across pauses.
    const finalElapsed = baseElapsedRef.current + Math.floor((Date.now() - segmentStartRef.current) / 1000)
    setElapsedSeconds(finalElapsed)
    elapsedSecondsRef.current = finalElapsed
    clearWatch()
    setStatus('paused')
  }, [])

  const finish = useCallback(() => {
    clearWatch()
    const result = { route, durationSeconds: elapsedSeconds, startedAt }
    setStatus('idle')
    setRoute([])
    setElapsedSeconds(0)
    setStartedAt(null)
    localStorage.removeItem(STORAGE_KEY)
    return result
  }, [route, elapsedSeconds, startedAt])

  const discard = useCallback(() => {
    clearWatch()
    setStatus('idle')
    setRoute([])
    setElapsedSeconds(0)
    setStartedAt(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Tear down any live subscription if the component unmounts mid-run (e.g. navigating away)
  useEffect(() => () => clearWatch(), [])

  return { status, route, elapsedSeconds, error, start, resume: start, pause, finish, discard }
}
