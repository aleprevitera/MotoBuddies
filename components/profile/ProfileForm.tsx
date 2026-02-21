"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, Bike } from "lucide-react"
import { MOTO_BRANDS, parseBikeModel } from "@/lib/brands"

interface ProfileFormProps {
  userId: string
  initialUsername: string
  initialBikeModel: string | null
  initialAvatarUrl: string | null
}

const NO_BRAND = "__none__"

export function ProfileForm({ userId, initialUsername, initialBikeModel, initialAvatarUrl }: ProfileFormProps) {
  const parsed = parseBikeModel(initialBikeModel)
  const [username, setUsername] = useState(initialUsername)
  const [brand, setBrand] = useState(parsed.brand || NO_BRAND)
  const [model, setModel] = useState(parsed.model)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const bikeModelFull = brand && brand !== NO_BRAND
    ? `${brand}${model ? ` ${model}` : ""}`
    : model || null

  const selectedBrand = MOTO_BRANDS.find((b) => b.name === brand)

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
        bike_model: bikeModelFull,
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
          bikeModel={bikeModelFull}
          size="lg"
        />
        <div>
          <p className="text-sm font-medium">{username || "Nome utente"}</p>
          {bikeModelFull && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Bike className="w-3 h-3" />
              {bikeModelFull}
            </p>
          )}
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

        {/* Brand + Modello moto */}
        <div className="space-y-2">
          <Label>La tua moto</Label>
          <div className="grid grid-cols-2 gap-3">
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BRAND}>Nessuna marca</SelectItem>
                {MOTO_BRANDS.map((b) => (
                  <SelectItem key={b.name} value={b.name}>
                    <span className="flex items-center gap-2">
                      <img
                        src={b.logo}
                        alt={b.name}
                        className="w-4 h-4 object-contain"
                      />
                      {b.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Modello (es. MT-07)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          {selectedBrand && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <img src={selectedBrand.logo} alt={selectedBrand.name} className="w-5 h-5 object-contain" />
              Il logo {selectedBrand.name} sarà il tuo avatar
            </div>
          )}
          {!selectedBrand && (
            <p className="text-xs text-muted-foreground">
              Scegli una marca per usare il suo logo come avatar
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatarUrl">URL avatar personalizzato</Label>
          <Input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://esempio.com/foto.jpg"
          />
          <p className="text-xs text-muted-foreground">
            {brand && brand !== NO_BRAND
              ? "Se impostato un brand, il logo ha priorità. Rimuovi la marca per usare questo URL."
              : "Lascia vuoto per usare l'iniziale colorata"}
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
