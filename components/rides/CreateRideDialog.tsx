"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Upload, MapPin, Search, Loader2, X, Clock, Calendar } from "lucide-react"

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

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
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [startLat, setStartLat] = useState("")
  const [startLon, setStartLon] = useState("")
  const [meetingPointName, setMeetingPointName] = useState("")
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id ?? "")
  const [gpxFile, setGpxFile] = useState<File | null>(null)

  // Ricerca luogo
  const [locationQuery, setLocationQuery] = useState("")
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([])
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  function resetForm() {
    setTitle("")
    setDescription("")
    setDate("")
    setTime("")
    setStartLat("")
    setStartLon("")
    setMeetingPointName("")
    setSelectedGroup(groups[0]?.id ?? "")
    setGpxFile(null)
    setLocationQuery("")
    setLocationResults([])
    setShowResults(false)
  }

  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 3) {
      setLocationResults([])
      setShowResults(false)
      return
    }
    setSearchingLocation(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=it,ch,at,fr,de,si,hr`,
        { headers: { "Accept-Language": "it" } }
      )
      const data: NominatimResult[] = await res.json()
      setLocationResults(data)
      setShowResults(data.length > 0)
    } catch {
      setLocationResults([])
    } finally {
      setSearchingLocation(false)
    }
  }, [])

  function handleLocationInput(value: string) {
    setLocationQuery(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchLocation(value), 400)
  }

  function selectLocation(result: NominatimResult) {
    const parts = result.display_name.split(", ")
    const shortName = parts.slice(0, 3).join(", ")
    setMeetingPointName(shortName)
    setStartLat(parseFloat(result.lat).toFixed(6))
    setStartLon(parseFloat(result.lon).toFixed(6))
    setLocationQuery(shortName)
    setShowResults(false)
    setLocationResults([])
  }

  function clearLocation() {
    setLocationQuery("")
    setMeetingPointName("")
    setStartLat("")
    setStartLon("")
    setLocationResults([])
    setShowResults(false)
  }

  // Chiudi risultati se click fuori
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const lat = parseFloat(startLat)
    const lon = parseFloat(startLon)
    if (isNaN(lat) || isNaN(lon)) {
      toast.error("Seleziona un punto di ritrovo dalla ricerca")
      return
    }

    if (!date || !time) {
      toast.error("Inserisci data e ora")
      return
    }

    setLoading(true)
    const supabase = createClient()
    let gpxUrl: string | null = null

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
      date_time: new Date(`${date}T${time}`).toISOString(),
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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo giro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo giro</DialogTitle>
          <DialogDescription>
            Organizza un&apos;uscita con il tuo gruppo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Label htmlFor="title">Titolo</Label>
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
              placeholder="Dettagli, durata prevista, equipaggiamento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Data e ora - affiancati */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Ora
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Ricerca luogo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Punto di ritrovo
            </Label>
            <div className="relative" ref={resultsRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca un luogo..."
                  value={locationQuery}
                  onChange={(e) => handleLocationInput(e.target.value)}
                  onFocus={() => locationResults.length > 0 && setShowResults(true)}
                  className="pl-9 pr-9"
                  required
                />
                {searchingLocation && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {!searchingLocation && locationQuery && (
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Risultati ricerca */}
              {showResults && locationResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg overflow-hidden">
                  {locationResults.map((r) => (
                    <button
                      key={r.place_id}
                      type="button"
                      onClick={() => selectLocation(r)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-b-0 flex items-start gap-2"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {startLat && startLon && (
              <p className="text-xs text-muted-foreground">
                {meetingPointName} ({startLat}, {startLon})
              </p>
            )}
          </div>

          {/* Upload GPX */}
          <div className="space-y-2">
            <Label htmlFor="gpx">Traccia GPX</Label>
            {!gpxFile ? (
              <label
                htmlFor="gpx"
                className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-4 px-3 cursor-pointer text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <Upload className="w-4 h-4" />
                Carica file .gpx
                <input
                  id="gpx"
                  type="file"
                  accept=".gpx"
                  onChange={(e) => setGpxFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between gap-2 border rounded-lg py-2.5 px-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground truncate">
                  <Upload className="w-4 h-4 shrink-0" />
                  {gpxFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setGpxFile(null)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm() }}>
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
