import { LatLng } from '../types'
import { routeDistanceKm } from '../utils/calculations'

export class RouteSuggestionError extends Error {}

// Free community OSRM instance run by FOSSGIS (the German OSM chapter) — no API key,
// CORS-enabled, foot profile. Fair-use service: we make at most 2 requests per tap.
const OSRM_BASE = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'

/** Point `distKm` away from `origin` along `bearingDeg` (equirectangular approximation — fine at these radii) */
function destinationPoint(origin: LatLng, bearingDeg: number, distKm: number): LatLng {
  const rad = bearingDeg * Math.PI / 180
  const dLat = (distKm * Math.cos(rad)) / 111.32
  const dLng = (distKm * Math.sin(rad)) / (111.32 * Math.cos(origin.lat * Math.PI / 180))
  return { lat: origin.lat + dLat, lng: origin.lng + dLng }
}

/**
 * OSRM only routes point-to-point, so the loop is synthesized: waypoints are placed on a
 * circle whose circumference matches the target distance, with the start on its rim, and
 * OSRM routes through them and back. `radiusScale` lets a retry shrink/grow the circle.
 */
async function fetchLoop(start: LatLng, distanceKm: number, bearingDeg: number, radiusScale: number): Promise<LatLng[]> {
  const radiusKm = (distanceKm / (2 * Math.PI)) * radiusScale
  const center = destinationPoint(start, bearingDeg, radiusKm)
  // Angle from the center back to the start; the other waypoints sit at 90° steps around the circle
  const startAngle = bearingDeg + 180
  const waypoints = [90, 180, 270].map(offset => destinationPoint(center, startAngle + offset, radiusKm))

  const coords = [start, ...waypoints, start].map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';')

  let res: Response
  try {
    res = await fetch(`${OSRM_BASE}/${coords}?overview=full&geometries=geojson`)
  } catch {
    throw new RouteSuggestionError('Could not reach the routing service — check your connection.')
  }

  if (!res.ok) {
    throw new RouteSuggestionError(`The routing service returned an error (${res.status}). Try again in a moment.`)
  }

  let data: { code?: string; routes?: { geometry?: { coordinates?: [number, number][] } }[] }
  try {
    data = await res.json()
  } catch {
    throw new RouteSuggestionError('The routing service returned an unexpected response.')
  }

  const points = data.code === 'Ok' ? data.routes?.[0]?.geometry?.coordinates ?? [] : []
  if (points.length < 2) {
    throw new RouteSuggestionError('No route found near your location — this works best near mapped roads and paths.')
  }

  return points.map(([lng, lat]) => ({ lat, lng }))
}

/**
 * Suggests a loop of roughly `distanceKm` starting and ending at `start`. A random
 * bearing makes each request (and each Regenerate) explore a different direction.
 * Real road networks rarely match the target exactly; one corrective retry rescales
 * the circle if the first attempt lands more than 15% off.
 */
export async function suggestRoute(start: LatLng, distanceKm: number): Promise<LatLng[]> {
  const bearingDeg = Math.random() * 360

  const first = await fetchLoop(start, distanceKm, bearingDeg, 1)
  const firstKm = routeDistanceKm(first)
  if (Math.abs(firstKm - distanceKm) / distanceKm <= 0.15) return first

  const second = await fetchLoop(start, distanceKm, bearingDeg, distanceKm / firstKm)
  const secondKm = routeDistanceKm(second)
  return Math.abs(secondKm - distanceKm) <= Math.abs(firstKm - distanceKm) ? second : first
}
