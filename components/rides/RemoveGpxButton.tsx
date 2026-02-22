"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface RemoveGpxButtonProps {
  rideId: string
  gpxUrl: string
}

export function RemoveGpxButton({ rideId, gpxUrl }: RemoveGpxButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleRemove() {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Estrai il path del file dall'URL pubblico
    // URL formato: .../storage/v1/object/public/gpx-files/{userId}/{timestamp}-{filename}
    const match = gpxUrl.match(/\/gpx-files\/(.+)$/)
    if (match) {
      await supabase.storage.from("gpx-files").remove([match[1]])
    }

    const { error } = await supabase
      .from("rides")
      .update({ gpx_url: null })
      .eq("id", rideId)

    if (error) {
      toast.error("Errore: " + error.message)
    } else {
      toast.success("Traccia GPX rimossa")
      router.refresh()
    }

    setLoading(false)
    setConfirming(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={confirming ? "text-destructive hover:text-destructive" : "text-muted-foreground"}
      onClick={handleRemove}
      disabled={loading}
    >
      <Trash2 className="w-4 h-4 mr-1.5" />
      {confirming ? "Conferma rimozione" : "Rimuovi GPX"}
    </Button>
  )
}
