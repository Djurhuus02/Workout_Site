import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { LatLng } from '../types'

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined

interface Props {
  route: LatLng[]
  /** A suggested/planned route to overlay as a dashed guide underneath the live route */
  guideRoute?: LatLng[]
  height?: number | string
  /** Live tracking view — keeps the map centred on the current position */
  live?: boolean
}

function AutoPan({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.panTo(center, { animate: true })
  }, [center, map])
  return null
}

function FitToRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1) map.fitBounds(positions, { padding: [24, 24] })
  }, [positions, map])
  return null
}

const emptyStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.04)', borderRadius: 12,
  padding: 16, textAlign: 'center' as const,
}

export default function RouteMap({ route, guideRoute, height = 220, live = false }: Props) {
  // Memoized on the route/guideRoute prop identity so a parent re-render that doesn't
  // actually add a new point (e.g. the once-a-second elapsed-time tick) doesn't produce
  // a fresh array/tuple reference — which would otherwise re-trigger AutoPan every render.
  const positions = useMemo<[number, number][]>(() => route.map(p => [p.lat, p.lng]), [route])
  const guidePositions = useMemo<[number, number][]>(() => (guideRoute ?? []).map(p => [p.lat, p.lng]), [guideRoute])

  if (!MAPTILER_KEY) {
    return (
      <div style={{ ...emptyStyle, height }}>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          Map needs a free MapTiler API key — add VITE_MAPTILER_KEY to your .env file.
        </p>
      </div>
    )
  }

  const hasRoute = route.length > 0
  const hasGuide = !!guideRoute && guideRoute.length > 0

  if (!hasRoute && !hasGuide) {
    return (
      <div style={{ ...emptyStyle, height }}>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Waiting for GPS signal…</p>
      </div>
    )
  }

  const center = hasRoute ? positions[positions.length - 1] : guidePositions[0]

  return (
    <div style={{ height, borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url={`https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {hasGuide && (
          <Polyline positions={guidePositions} pathOptions={{ color: '#38bdf8', weight: 3, dashArray: '6 8' }} />
        )}

        {hasRoute && <Polyline positions={positions} pathOptions={{ color: '#F97316', weight: 4 }} />}

        {hasRoute && live && (
          <>
            <AutoPan center={positions[positions.length - 1]} />
            <CircleMarker center={positions[positions.length - 1]} radius={6} pathOptions={{ color: 'white', weight: 2, fillColor: '#F97316', fillOpacity: 1 }} />
          </>
        )}

        {hasRoute && !live && (
          <>
            <CircleMarker center={positions[0]} radius={5} pathOptions={{ color: 'white', weight: 2, fillColor: '#22c55e', fillOpacity: 1 }} />
            <CircleMarker center={positions[positions.length - 1]} radius={5} pathOptions={{ color: 'white', weight: 2, fillColor: '#ef4444', fillOpacity: 1 }} />
          </>
        )}

        {!hasRoute && hasGuide && <FitToRoute positions={guidePositions} />}
      </MapContainer>
    </div>
  )
}
