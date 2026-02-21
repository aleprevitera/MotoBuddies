"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle, HelpCircle, XCircle } from "lucide-react"

type RsvpStatus = "attending" | "maybe" | "declined"

interface RsvpButtonsProps {
  rideId: string
  userId: string
  currentStatus: RsvpStatus | null
}

const statusConfig = {
  attending: {
    label: "Partecipo",
    icon: CheckCircle,
    activeClass: "bg-green-500 hover:bg-green-600 text-white",
  },
  maybe: {
    label: "Forse",
    icon: HelpCircle,
    activeClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
  },
  declined: {
    label: "Non vengo",
    icon: XCircle,
    activeClass: "bg-destructive hover:bg-destructive/90 text-white",
  },
} as const

export function RsvpButtons({ rideId, userId, currentStatus }: RsvpButtonsProps) {
  const router = useRouter()
  const [status, setStatus] = useState<RsvpStatus | null>(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleRsvp(newStatus: RsvpStatus) {
    if (loading) return
    setLoading(true)
    const supabase = createClient()

    if (status === newStatus) {
      // Rimuovi partecipazione
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("ride_id", rideId)
        .eq("user_id", userId)

      if (error) {
        toast.error("Errore: " + error.message)
      } else {
        setStatus(null)
        toast.success("Partecipazione rimossa")
        router.refresh()
      }
    } else {
      // Upsert partecipazione
      const { error } = await supabase
        .from("participants")
        .upsert(
          { ride_id: rideId, user_id: userId, status: newStatus, updated_at: new Date().toISOString() },
          { onConflict: "ride_id,user_id" }
        )

      if (error) {
        toast.error("Errore: " + error.message)
      } else {
        setStatus(newStatus)
        toast.success(statusConfig[newStatus].label + "!")
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(["attending", "maybe", "declined"] as RsvpStatus[]).map((s) => {
        const config = statusConfig[s]
        const Icon = config.icon
        const isActive = status === s

        return (
          <Button
            key={s}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={isActive ? config.activeClass : ""}
            onClick={() => handleRsvp(s)}
            disabled={loading}
          >
            <Icon className="w-4 h-4 mr-1.5" />
            {config.label}
          </Button>
        )
      })}
    </div>
  )
}
