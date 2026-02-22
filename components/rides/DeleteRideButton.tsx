"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface DeleteRideButtonProps {
  rideId: string
  gpxUrl: string | null
}

export function DeleteRideButton({ rideId, gpxUrl }: DeleteRideButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setLoading(true)
    const supabase = createClient()

    // 1. Elimina partecipanti
    const { error: partError } = await supabase
      .from("participants")
      .delete()
      .eq("ride_id", rideId)

    if (partError) {
      toast.error("Errore eliminazione partecipanti: " + partError.message)
      setLoading(false)
      setConfirming(false)
      return
    }

    // 2. Elimina file GPX dallo storage (se presente)
    if (gpxUrl) {
      const match = gpxUrl.match(/\/gpx-files\/(.+)$/)
      if (match) {
        await supabase.storage.from("gpx-files").remove([match[1]])
      }
    }

    // 3. Elimina il giro
    const { error: rideError } = await supabase
      .from("rides")
      .delete()
      .eq("id", rideId)

    if (rideError) {
      toast.error("Errore eliminazione giro: " + rideError.message)
      setLoading(false)
      setConfirming(false)
      return
    }

    toast.success("Giro eliminato")
    router.push("/dashboard")
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={confirming ? "text-destructive hover:text-destructive" : "text-muted-foreground"}
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="w-4 h-4 mr-1.5" />
      {confirming ? "Conferma eliminazione" : "Elimina giro"}
    </Button>
  )
}
