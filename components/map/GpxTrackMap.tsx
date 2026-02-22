"use client"

import { useEffect, useMemo } from "react"
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

interface GpxTrackMapProps {
  gpxData: string
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

function parseGpx(gpxData: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const GpxParser = require("gpxparser").default ?? require("gpxparser")
  const gpx = new GpxParser()
  gpx.parse(gpxData)

  if (gpx.tracks.length === 0) return null

  const track = gpx.tracks[0]
  const positions: [number, number][] = track.points.map(
    (p: { lat: number; lon: number }) => [p.lat, p.lon] as [number, number]
  )

  return {
    positions,
    distance: track.distance.total / 1000,
    elevationGain: track.elevation.pos ?? 0,
    elevationLoss: Math.abs(track.elevation.neg ?? 0),
  }
}

export function GpxTrackMap({ gpxData, startLat, startLon, label }: GpxTrackMapProps) {
  useEffect(() => {
    L.Marker.prototype.options.icon = defaultIcon
  }, [])

  const parsed = useMemo(() => parseGpx(gpxData), [gpxData])

  if (!parsed || parsed.positions.length === 0) {
    return (
      <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
        Nessuna traccia trovata nel file GPX
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
          positions={parsed.positions}
          pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.8 }}
        />
        <Marker position={[startLat, startLon]} icon={defaultIcon}>
          {label && <Popup>{label}</Popup>}
        </Marker>
        <FitBounds positions={parsed.positions} />
      </MapContainer>

      <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
        <span>Distanza: <strong className="text-foreground">{parsed.distance.toFixed(1)} km</strong></span>
        <span>Dislivello +: <strong className="text-foreground">{Math.round(parsed.elevationGain)} m</strong></span>
        <span>Dislivello −: <strong className="text-foreground">{Math.round(parsed.elevationLoss)} m</strong></span>
      </div>
    </div>
  )
}
