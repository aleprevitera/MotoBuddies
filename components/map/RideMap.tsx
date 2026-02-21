"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix icone di default di Leaflet con Webpack/Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface RideMapProps {
  lat: number
  lon: number
  label?: string
}

export function RideMap({ lat, lon, label }: RideMapProps) {
  useEffect(() => {
    L.Marker.prototype.options.icon = defaultIcon
  }, [])

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={13}
      style={{ height: "300px", width: "100%", borderRadius: "0.5rem" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lon]} icon={defaultIcon}>
        {label && <Popup>{label}</Popup>}
      </Marker>
    </MapContainer>
  )
}
