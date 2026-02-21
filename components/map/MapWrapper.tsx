"use client"

import dynamic from "next/dynamic"

const RideMap = dynamic(() => import("./RideMap").then((m) => m.RideMap), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
      Caricamento mappa...
    </div>
  ),
})

interface MapWrapperProps {
  lat: number
  lon: number
  label?: string
}

export function MapWrapper({ lat, lon, label }: MapWrapperProps) {
  return <RideMap lat={lat} lon={lon} label={label} />
}
