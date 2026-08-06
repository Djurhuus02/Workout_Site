import { LatLng } from '../types'

const ORS_KEY = import.meta.env.VITE_ORS_KEY as string | undefined

export class RouteSuggestionError extends Error {}

/**
 * Asks OpenRouteService's round-trip routing for a loop of roughly `distanceKm`
 * starting and ending at `start`. Real road/path networks rarely allow an exact
 * match, so the returned route's actual length can be off by ~10-20%.
 */
export async function suggestRoute(start: LatLng, distanceKm: number): Promise<LatLng[]> {
  if (!ORS_KEY) {
    throw new RouteSuggestionError('Route suggestions need a free OpenRouteService API key — add VITE_ORS_KEY to your .env file.')
  }

  let res: Response
  try {
    // api.heigit.org returns proper CORS headers on error responses (unlike
    // api.openrouteservice.org, whose errors get silently hidden from JS by the
    // browser) — see https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912
    res = await fetch('https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson', {
      method: 'POST',
      headers: {
        Authorization: ORS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [[start.lng, start.lat]],
        options: {
          round_trip: {
            length: Math.round(distanceKm * 1000),
            points: 4,
            seed: Math.floor(Math.random() * 1_000_000),
          },
        },
      }),
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new RouteSuggestionError(`Could not reach the routing service (${detail}). Check the browser console for a CORS error.`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new RouteSuggestionError(`Couldn't generate a route (${res.status}). ${body.slice(0, 200)}`)
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new RouteSuggestionError('The routing service returned an unexpected response.')
  }

  const coords: [number, number][] =
    (data as { features?: { geometry?: { coordinates?: [number, number][] } }[] })?.features?.[0]?.geometry?.coordinates ?? []
  if (coords.length === 0) {
    throw new RouteSuggestionError('No route found for that distance near your location.')
  }

  return coords.map(([lng, lat]) => ({ lat, lng }))
}
