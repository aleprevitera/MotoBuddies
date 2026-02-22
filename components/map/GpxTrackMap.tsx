"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface TrackStats {
  distance: number // km
  elevationGain: number
  elevationLoss: number
}

interface GpxTrackMapProps {
  gpxUrl: string
  startLat: number
  startLon: number
  label?: string
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lon]) => [lat, lon]))
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [map, positions])
  return null
}

export function GpxTrackMap({ gpxUrl, startLat, startLon, label }: GpxTrackMapProps) {
  const [positions, setPositions] = useState<[number, number][]>([])
  const [stats, setStats] = useState<TrackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    L.Marker.prototype.options.icon = defaultIcon
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadGpx() {
      try {
        const res = await fetch(gpxUrl)
        if (!res.ok) throw new Error("Impossibile scaricare il file GPX")
        const text = await res.text()

        const gpxParser = (await import("gpxparser")).default
        const gpx = new gpxParser()
        gpx.parse(text)

        if (cancelled) return

        if (gpx.tracks.length === 0) {
          setError("Nessuna traccia trovata nel file GPX")
          setLoading(false)
          return
        }

        const track = gpx.tracks[0]
        const pts: [number, number][] = track.points.map(
          (p: { lat: number; lon: number }) => [p.lat, p.lon] as [number, number]
        )

        setPositions(pts)
        setStats({
          distance: track.distance.total / 1000,
          elevationGain: track.elevation.pos ?? 0,
          elevationLoss: Math.abs(track.elevation.neg ?? 0),
        })
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Errore nel caricamento GPX")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadGpx()
    return () => { cancelled = true }
  }, [gpxUrl])

  if (loading) {
    return (
      <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
        Caricamento traccia GPX...
      </div>
    )
  }

  if (error || positions.length === 0) {
    return (
      <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
        {error ?? "Nessuna traccia trovata"}
      </div>
    )
  }

  return (
    <div>
      <MapContainer
        center={[startLat, startLon]}
        zoom={13}
        style={{ height: "300px", width: "100%", borderRadius: "0.5rem" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={positions}
          pathOptions={{ color: "hsl(var(--primary))", weight: 4, opacity: 0.8 }}
        />
        <Marker position={[startLat, startLon]} icon={defaultIcon}>
          {label && <Popup>{label}</Popup>}
        </Marker>
        <FitBounds positions={positions} />
      </MapContainer>

      {stats && (
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
          <span>Distanza: <strong className="text-foreground">{stats.distance.toFixed(1)} km</strong></span>
          <span>Dislivello +: <strong className="text-foreground">{Math.round(stats.elevationGain)} m</strong></span>
          <span>Dislivello −: <strong className="text-foreground">{Math.round(stats.elevationLoss)} m</strong></span>
        </div>
      )}
    </div>
  )
}
