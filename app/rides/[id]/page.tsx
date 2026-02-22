import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/Navbar"
import { MapWrapper } from "@/components/map/MapWrapper"
import { GpxMapWrapper } from "@/components/map/GpxMapWrapper"
import { WeatherWidget } from "@/components/weather/WeatherWidget"
import { RsvpButtons } from "@/components/rides/RsvpButtons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, FileText, Download, ArrowLeft, CheckCircle, HelpCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import type { Database } from "@/lib/supabase/types"

type RideRow = Database["public"]["Tables"]["rides"]["Row"]
type ParticipantRow = Database["public"]["Tables"]["participants"]["Row"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

const statusIcon = {
  attending: <CheckCircle className="w-4 h-4 text-green-500" />,
  maybe: <HelpCircle className="w-4 h-4 text-yellow-500" />,
  declined: <XCircle className="w-4 h-4 text-destructive" />,
}

const statusLabel = {
  attending: "Partecipa",
  maybe: "Forse",
  declined: "Non viene",
}

export default async function RidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Recupera giro
  const { data: rideData } = await supabase
    .from("rides")
    .select("*")
    .eq("id", id)
    .single()

  if (!rideData) notFound()
  const ride = rideData as RideRow

  // Recupera nome gruppo
  const { data: groupData } = await supabase
    .from("groups")
    .select("name")
    .eq("id", ride.group_id)
    .single()
  const groupName = (groupData as { name: string } | null)?.name ?? null

  // Recupera username del creatore
  const { data: creatorData } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", ride.created_by)
    .single()
  const creatorUsername = (creatorData as Pick<ProfileRow, "username"> | null)?.username ?? null

  // Profilo utente corrente
  const { data: profileData } = await supabase
    .from("profiles")
    .select("username, avatar_url, bike_model")
    .eq("id", user.id)
    .single()
  const currentProfile = profileData as Pick<ProfileRow, "username" | "avatar_url" | "bike_model"> | null
  const currentUsername = currentProfile?.username
  const currentAvatarUrl = currentProfile?.avatar_url
  const currentBikeModel = currentProfile?.bike_model

  // Partecipanti
  const { data: participantsData } = await supabase
    .from("participants")
    .select("ride_id, user_id, status, updated_at")
    .eq("ride_id", id)
    .order("updated_at", { ascending: true })

  const participants = (participantsData ?? []) as ParticipantRow[]

  // Profili dei partecipanti
  const participantUserIds = participants.map((p) => p.user_id)
  const { data: participantProfilesData } = participantUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, username, avatar_url, bike_model")
        .in("id", participantUserIds)
    : { data: [] }

  const profileMap: Record<string, Pick<ProfileRow, "username" | "avatar_url" | "bike_model">> = {}
  ;(participantProfilesData ?? []).forEach((p) => {
    const profile = p as ProfileRow
    profileMap[profile.id] = { username: profile.username, avatar_url: profile.avatar_url, bike_model: profile.bike_model }
  })

  // Stato RSVP dell'utente corrente
  const myParticipation = participants.find((p) => p.user_id === user.id)
  const myStatus = myParticipation?.status as "attending" | "maybe" | "declined" | undefined

  const rideDate = new Date(ride.date_time)
  const isPast = rideDate < new Date()

  const attendingCount = participants.filter((p) => p.status === "attending").length
  const maybeCount = participants.filter((p) => p.status === "maybe").length

  return (
    <div className="min-h-screen bg-background">
      <Navbar username={currentUsername} avatarUrl={currentAvatarUrl} bikeModel={currentBikeModel} userId={user.id} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla dashboard
        </Link>

        {/* Titolo e info principali */}
        <div className="mb-6">
          <div className="flex flex-wrap items-start gap-3 mb-2">
            <h1 className="text-3xl font-bold leading-tight">{ride.title}</h1>
            {isPast && <Badge variant="secondary">Passato</Badge>}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
            {groupName && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {groupName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(rideDate, "EEEE d MMMM yyyy, HH:mm", { locale: it })}
            </span>
            {ride.meeting_point_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {ride.meeting_point_name}
              </span>
            )}
            {creatorUsername && (
              <span className="text-muted-foreground">
                Creato da <span className="font-medium text-foreground">{creatorUsername}</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Colonna sinistra (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Descrizione */}
            {ride.description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Descrizione
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{ride.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Mappa */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {ride.gpx_url ? "Percorso" : "Punto di ritrovo"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ride.gpx_url ? (
                  <GpxMapWrapper
                    gpxUrl={ride.gpx_url}
                    startLat={ride.start_lat}
                    startLon={ride.start_lon}
                    label={ride.meeting_point_name ?? "Punto di ritrovo"}
                  />
                ) : (
                  <MapWrapper
                    lat={ride.start_lat}
                    lon={ride.start_lon}
                    label={ride.meeting_point_name ?? "Punto di ritrovo"}
                  />
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Coordinate: {ride.start_lat.toFixed(5)}, {ride.start_lon.toFixed(5)}
                </p>
                {ride.gpx_url && (
                  <a
                    href={ride.gpx_url}
                    download
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Scarica traccia GPX
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonna destra (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meteo */}
            {!isPast && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Previsioni meteo</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeatherWidget
                    lat={ride.start_lat}
                    lon={ride.start_lon}
                    dateTime={ride.date_time}
                  />
                </CardContent>
              </Card>
            )}

            {/* RSVP */}
            {!isPast && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">La tua risposta</CardTitle>
                </CardHeader>
                <CardContent>
                  <RsvpButtons
                    rideId={ride.id}
                    userId={user.id}
                    username={currentUsername ?? "Utente"}
                    rideTitle={ride.title}
                    currentStatus={myStatus ?? null}
                  />
                </CardContent>
              </Card>
            )}

            {/* Partecipanti */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Partecipanti
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {attendingCount} sì · {maybeCount} forse
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessuna risposta ancora</p>
                ) : (
                  <ul className="space-y-2">
                    {participants.map((p) => {
                      const pp = profileMap[p.user_id]
                      const st = p.status as "attending" | "maybe" | "declined"
                      return (
                        <li key={p.user_id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {statusIcon[st]}
                            <span className="text-sm font-medium truncate">
                              {pp?.username ?? "Utente"}
                              {p.user_id === user.id && (
                                <span className="text-muted-foreground font-normal"> (tu)</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {pp?.bike_model && (
                              <span className="text-xs text-muted-foreground">{pp.bike_model}</span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {statusLabel[st]}
                            </Badge>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
