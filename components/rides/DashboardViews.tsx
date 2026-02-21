"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarDays, List } from "lucide-react"

interface DashboardViewsProps {
  listView: React.ReactNode
  calendarView: React.ReactNode
}

export function DashboardViews({ listView, calendarView }: DashboardViewsProps) {
  const [view, setView] = useState<"list" | "calendar">("list")

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "list" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="w-4 h-4" />
          Lista
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "calendar" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Calendario
        </button>
      </div>

      {/* Contenuto */}
      {view === "list" ? listView : calendarView}
    </div>
  )
}
