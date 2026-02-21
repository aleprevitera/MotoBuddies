import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/Navbar"
import { CreateRideDialog } from "@/components/rides/CreateRideDialog"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Bike } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Profilo utente
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single()

  // Gruppi dell'utente
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, role, groups(id, name, invite_code)")
    .eq("user_id", user.id)

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding")
  }

  const groupIds = memberships.map((m) => m.group_id)

  // Giri dei gruppi, ordinati per data
  const { data: rides } = await supabase
    .from("rides")
    .select(`
      id,
      title,
      description,
      date_time,
      meeting_point_name,
      group_id,
      groups(name)
    `)
    .in("group_id", groupIds)
    .gte("date_time", new Date().toISOString())
    .order("date_time", { ascending: true })

  // Partecipanti per giro (con profili per avatar)
  const rideIds = rides?.map((r) => r.id) ?? []
  const { data: participantsData } = rideIds.length > 0
    ? await supabase
        .from("participants")
        .select("ride_id, user_id, status")
        .in("ride_id", rideIds)
        .eq("status", "attending")
    : { data: [] }

  const countMap: Record<string, number> = {}
  const rideParticipantIds = new Set<string>()
  participantsData?.forEach(({ ride_id, user_id }) => {
    countMap[ride_id] = (countMap[ride_id] ?? 0) + 1
    rideParticipantIds.add(user_id)
  })

  // Profili partecipanti per avatar
  const participantIds = Array.from(rideParticipantIds)
  const { data: participantProfiles } = participantIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", participantIds)
    : { data: [] }

  const profileMap: Record<string, { username: string; avatar_url: string | null }> = {}
  participantProfiles?.forEach((p) => {
    profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url }
  })

  // Mappa ride_id -> lista profili partecipanti
  const rideAttendees: Record<string, { username: string; avatar_url: string | null }[]> = {}
  participantsData?.forEach(({ ride_id, user_id }) => {
    if (!rideAttendees[ride_id]) rideAttendees[ride_id] = []
    const p = profileMap[user_id]
    if (p) rideAttendees[ride_id].push(p)
  })

  const groups = memberships
    .map((m) => m.groups)
    .filter(Boolean) as { id: string; name: string }[]

  return (
    <div className="min-h-screen bg-background">
      <Navbar username={profile?.username} avatarUrl={profile?.avatar_url} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">I prossimi giri</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {rides?.length
                ? `${rides.length} giro${rides.length !== 1 ? "i" : ""} in programma`
                : "Nessun giro in programma"}
            </p>
          </div>
          <CreateRideDialog groups={groups} userId={user.id} />
        </div>

        {/* Gruppi info */}
        <div className="flex flex-wrap gap-2 mb-6">
          {memberships.map((m) => {
            const g = m.groups as { id: string; name: string; invite_code: string } | null
            if (!g) return null
            return (
              <Link
                key={m.group_id}
                href={`/groups/${g.id}`}
                className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-sm hover:bg-muted/80 transition-colors"
              >
                <Users className="w-3 h-3" />
                <span>{g.name}</span>
                <Badge variant="secondary" className="text-xs font-mono ml-1">
                  {g.invite_code}
                </Badge>
                {m.role === "admin" && (
                  <Badge className="text-xs ml-0.5">admin</Badge>
                )}
              </Link>
            )
          })}
        </div>

        {/* Lista giri */}
        {!rides || rides.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Bike className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">Nessun giro in programma</p>
            <p className="text-sm">Crea il primo giro del tuo gruppo!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rides.map((ride) => {
              const rideDate = new Date(ride.date_time)
              const isToday =
                new Date().toDateString() === rideDate.toDateString()
              const g = ride.groups as { name: string } | null

              return (
                <Link key={ride.id} href={`/rides/${ride.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight">{ride.title}</CardTitle>
                        {isToday && (
                          <Badge className="shrink-0 bg-green-500 hover:bg-green-500 text-white">
                            Oggi
                          </Badge>
                        )}
                      </div>
                      {g && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {g.name}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {format(rideDate, "EEEE d MMMM, HH:mm", { locale: it })}
                        </span>
                      </div>
                      {ride.meeting_point_name && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{ride.meeting_point_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {(rideAttendees[ride.id]?.length ?? 0) > 0 ? (
                          <>
                            <div className="flex -space-x-1.5">
                              {rideAttendees[ride.id].slice(0, 4).map((p) => (
                                <Avatar key={p.username} username={p.username} avatarUrl={p.avatar_url} size="sm" />
                              ))}
                            </div>
                            <span>{countMap[ride.id]} partecipanti</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span>0 partecipanti</span>
                          </>
                        )}
                      </div>
                      {ride.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {ride.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
