"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { CloudRain, Sun, Cloud, Loader2, AlertTriangle } from "lucide-react"

interface WeatherData {
  temperature: number
  weatherCode: number
  precipitationProbability: number
  windSpeed: number
}

interface WeatherWidgetProps {
  lat: number
  lon: number
  dateTime: string
}

// WMO Weather interpretation codes
function getWeatherDescription(code: number): string {
  if (code === 0) return "Sereno"
  if (code <= 3) return "Parzialmente nuvoloso"
  if (code <= 48) return "Nebbia"
  if (code <= 67) return "Pioggia"
  if (code <= 77) return "Neve"
  if (code <= 82) return "Rovesci"
  if (code <= 99) return "Temporale"
  return "N/D"
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0) return <Sun className={className} />
  if (code <= 3) return <Cloud className={className} />
  return <CloudRain className={className} />
}

export function WeatherWidget({ lat, lon, dateTime }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWeather() {
      try {
        const date = new Date(dateTime)
        const dateStr = date.toISOString().split("T")[0]
        const hour = date.getHours()

        const url = new URL("https://api.open-meteo.com/v1/forecast")
        url.searchParams.set("latitude", lat.toString())
        url.searchParams.set("longitude", lon.toString())
        url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weathercode,windspeed_10m")
        url.searchParams.set("start_date", dateStr)
        url.searchParams.set("end_date", dateStr)
        url.searchParams.set("timezone", "auto")

        const res = await fetch(url.toString())
        if (!res.ok) throw new Error("Errore API meteo")

        const data = await res.json()
        const hourlyData = data.hourly

        setWeather({
          temperature: Math.round(hourlyData.temperature_2m[hour]),
          weatherCode: hourlyData.weathercode[hour],
          precipitationProbability: hourlyData.precipitation_probability[hour] ?? 0,
          windSpeed: Math.round(hourlyData.windspeed_10m[hour]),
        })
      } catch (err) {
        setError("Previsioni non disponibili")
      } finally {
        setLoading(false)
      }
    }

    // Non fare la fetch se la data è troppo lontana (Open-Meteo supporta ~16 giorni)
    const daysUntilRide = (new Date(dateTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysUntilRide > 16) {
      setError("Previsioni disponibili solo fino a 16 giorni")
      setLoading(false)
      return
    }

    fetchWeather()
  }, [lat, lon, dateTime])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento meteo...
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Cloud className="w-4 h-4" />
        {error ?? "Dati meteo non disponibili"}
      </div>
    )
  }

  const isRainy = weather.precipitationProbability > 50

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <WeatherIcon code={weather.weatherCode} className="w-6 h-6 text-sky-500" />
        <div>
          <p className="font-semibold text-lg leading-none">{weather.temperature}°C</p>
          <p className="text-xs text-muted-foreground">{getWeatherDescription(weather.weatherCode)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CloudRain className="w-4 h-4" />
        <span>Pioggia: {weather.precipitationProbability}%</span>
      </div>

      <div className="text-sm text-muted-foreground">
        Vento: {weather.windSpeed} km/h
      </div>

      {isRainy && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Alta probabilità di pioggia
        </Badge>
      )}
    </div>
  )
}
