"use client"

import dynamic from "next/dynamic"

const GpxTrackMap = dynamic(
  () => import("./GpxTrackMap").then((m) => m.GpxTrackMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
        Caricamento mappa...
      </div>
    ),
  }
)

interface GpxMapWrapperProps {
  gpxData: string
  startLat: number
  startLon: number
  label?: string
}

export function GpxMapWrapper({ gpxData, startLat, startLon, label }: GpxMapWrapperProps) {
  return <GpxTrackMap gpxData={gpxData} startLat={startLat} startLon={startLon} label={label} />
}
