"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Upload, MapPin } from "lucide-react"

interface Group {
  id: string
  name: string
}

interface CreateRideDialogProps {
  groups: Group[]
  userId: string
}

export function CreateRideDialog({ groups, userId }: CreateRideDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dateTime, setDateTime] = useState("")
  const [startLat, setStartLat] = useState("")
  const [startLon, setStartLon] = useState("")
  const [meetingPointName, setMeetingPointName] = useState("")
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id ?? "")
  const [gpxFile, setGpxFile] = useState<File | null>(null)

  function resetForm() {
    setTitle("")
    setDescription("")
    setDateTime("")
    setStartLat("")
    setStartLon("")
    setMeetingPointName("")
    setSelectedGroup(groups[0]?.id ?? "")
    setGpxFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const lat = parseFloat(startLat)
    const lon = parseFloat(startLon)
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error("Coordinate non valide. Lat: -90/90, Lon: -180/180")
      return
    }

    setLoading(true)
    const supabase = createClient()
    let gpxUrl: string | null = null

    // Upload GPX se presente
    if (gpxFile) {
      const fileName = `${userId}/${Date.now()}-${gpxFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("gpx-files")
        .upload(fileName, gpxFile)

      if (uploadError) {
        toast.error("Errore upload GPX: " + uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from("gpx-files")
        .getPublicUrl(uploadData.path)
      gpxUrl = urlData.publicUrl
    }

    const { error } = await supabase.from("rides").insert({
      group_id: selectedGroup,
      created_by: userId,
      title,
      description: description || null,
      date_time: new Date(dateTime).toISOString(),
      start_lat: lat,
      start_lon: lon,
      meeting_point_name: meetingPointName || null,
      gpx_url: gpxUrl,
    })

    if (error) {
      toast.error("Errore nella creazione del giro: " + error.message)
      setLoading(false)
      return
    }

    toast.success("Giro creato con successo!")
    resetForm()
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo giro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea un nuovo giro</DialogTitle>
          <DialogDescription>
            Compila i dettagli del giro e condividilo con il tuo gruppo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Gruppo */}
          {groups.length > 1 && (
            <div className="space-y-2">
              <Label>Gruppo</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona gruppo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Titolo */}
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              placeholder="es. Giro sul Passo dello Stelvio"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              placeholder="Dettagli sul percorso, durata prevista, equipaggiamento consigliato..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Data e ora */}
          <div className="space-y-2">
            <Label htmlFor="dateTime">Data e ora *</Label>
            <Input
              id="dateTime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
          </div>

          {/* Punto di ritrovo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Punto di ritrovo
            </Label>
            <Input
              placeholder="es. Parcheggio Autogrill A1 Nord"
              value={meetingPointName}
              onChange={(e) => setMeetingPointName(e.target.value)}
            />
          </div>

          {/* Coordinate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitudine *</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                placeholder="es. 46.5297"
                value={startLat}
                onChange={(e) => setStartLat(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lon">Longitudine *</Label>
              <Input
                id="lon"
                type="number"
                step="any"
                placeholder="es. 10.4536"
                value={startLon}
                onChange={(e) => setStartLon(e.target.value)}
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Trova le coordinate su{" "}
            <span className="font-medium">Google Maps</span>: click destro sul punto → "Cosa c&apos;è qui?"
          </p>

          {/* Upload GPX */}
          <div className="space-y-2">
            <Label htmlFor="gpx">Traccia GPX</Label>
            <div className="flex items-center gap-2">
              <Input
                id="gpx"
                type="file"
                accept=".gpx"
                onChange={(e) => setGpxFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
              />
            </div>
            {gpxFile && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Upload className="w-3 h-3" />
                {gpxFile.name}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creazione..." : "Crea giro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
