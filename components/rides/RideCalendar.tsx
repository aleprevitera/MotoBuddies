"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface CalendarRide {
  id: string
  title: string
  date_time: string
  meeting_point_name: string | null
  group_id: string
  groupName: string
  groupColor: { dot: string; text: string; bg: string; border: string }
}

interface RideCalendarProps {
  rides: CalendarRide[]
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

export function RideCalendar({ rides }: RideCalendarProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDate(null)
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDate(null)
  }

  function goToToday() {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    setSelectedDate(null)
  }

  // Mappa date -> giri
  const ridesByDate: Record<string, CalendarRide[]> = {}
  rides.forEach((ride) => {
    const dateKey = new Date(ride.date_time).toDateString()
    if (!ridesByDate[dateKey]) ridesByDate[dateKey] = []
    ridesByDate[dateKey].push(ride)
  })

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const monthLabel = format(new Date(currentYear, currentMonth), "MMMM yyyy", { locale: it })

  // Giri del giorno selezionato
  const selectedRides = selectedDate ? (ridesByDate[selectedDate] ?? []) : []

  return (
    <div className="space-y-4">
      {/* Header mese */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <button
          onClick={goToToday}
          className="text-sm font-semibold capitalize hover:text-primary transition-colors"
        >
          {monthLabel}
        </button>
        <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Griglia calendario */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {/* Header giorni */}
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-muted px-1 py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {/* Celle vuote prima del primo giorno */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-background p-1 min-h-[60px]" />
        ))}

        {/* Giorni del mese */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(currentYear, currentMonth, day)
          const dateKey = date.toDateString()
          const isToday = dateKey === today.toDateString()
          const dayRides = ridesByDate[dateKey] ?? []
          const isSelected = selectedDate === dateKey
          const isPast = date < today && !isToday

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
              className={`bg-background p-1 min-h-[60px] text-left transition-colors relative
                ${isSelected ? "ring-2 ring-primary ring-inset" : ""}
                ${dayRides.length > 0 ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"}
                ${isPast ? "opacity-50" : ""}
              `}
            >
              <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                ${isToday ? "bg-primary text-primary-foreground" : ""}
              `}>
                {day}
              </span>
              {/* Pallini giri */}
              {dayRides.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayRides.slice(0, 3).map((ride) => (
                    <div
                      key={ride.id}
                      className={`w-2 h-2 rounded-full ${ride.groupColor.dot}`}
                      title={ride.title}
                    />
                  ))}
                  {dayRides.length > 3 && (
                    <span className="text-[10px] text-muted-foreground leading-none">+{dayRides.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Dettaglio giorno selezionato */}
      {selectedDate && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold capitalize">
            {format(new Date(selectedDate), "EEEE d MMMM", { locale: it })}
          </h3>
          {selectedRides.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun giro in questa data</p>
          ) : (
            <div className="space-y-2">
              {selectedRides.map((ride) => (
                <Link key={ride.id} href={`/rides/${ride.id}`}>
                  <div className={`flex items-center gap-3 rounded-lg border p-3 hover:shadow-sm transition-shadow border-l-4 ${ride.groupColor.border}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ride.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(ride.date_time), "HH:mm")}
                        </span>
                        {ride.meeting_point_name && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {ride.meeting_point_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${ride.groupColor.text}`}>
                      {ride.groupName}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
