"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Save } from "lucide-react"

interface ProfileFormProps {
  userId: string
  initialUsername: string
  initialBikeModel: string | null
  initialAvatarUrl: string | null
}

export function ProfileForm({ userId, initialUsername, initialBikeModel, initialAvatarUrl }: ProfileFormProps) {
  const [username, setUsername] = useState(initialUsername)
  const [bikeModel, setBikeModel] = useState(initialBikeModel ?? "")
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!username.trim()) {
      toast.error("Il nome utente è obbligatorio")
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        bike_model: bikeModel.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", userId)

    if (error) {
      toast.error("Errore nel salvataggio del profilo")
      setLoading(false)
      return
    }

    toast.success("Profilo aggiornato!")
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Anteprima avatar */}
      <div className="flex items-center gap-4">
        <Avatar
          username={username || "?"}
          avatarUrl={avatarUrl || null}
          size="lg"
        />
        <div>
          <p className="text-sm font-medium">{username || "Nome utente"}</p>
          {bikeModel && <p className="text-xs text-muted-foreground">{bikeModel}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Nome utente</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Il tuo nome utente"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bikeModel">Modello moto</Label>
          <Input
            id="bikeModel"
            value={bikeModel}
            onChange={(e) => setBikeModel(e.target.value)}
            placeholder="es. Yamaha MT-07"
          />
          <p className="text-xs text-muted-foreground">Visibile agli altri membri del gruppo</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatarUrl">URL avatar</Label>
          <Input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://esempio.com/foto.jpg"
          />
          <p className="text-xs text-muted-foreground">
            Lascia vuoto per usare l&apos;iniziale colorata
          </p>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        <Save className="w-4 h-4 mr-1" />
        {loading ? "Salvataggio..." : "Salva profilo"}
      </Button>
    </form>
  )
}
