import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/Navbar"
import { CreateRideDialog } from "@/components/rides/CreateRideDialog"
import { JoinGroupDialog } from "@/components/groups/JoinGroupDialog"
import { DashboardViews } from "@/components/rides/DashboardViews"
import { RideCalendar } from "@/components/rides/RideCalendar"
import { Avatar, getGroupColor } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Bike, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Profilo utente
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, bike_model")
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
        .select("id, username, avatar_url, bike_model")
        .in("id", participantIds)
    : { data: [] }

  type ParticipantProfile = { username: string; avatar_url: string | null; bike_model: string | null }
  const profileMap: Record<string, ParticipantProfile> = {}
  participantProfiles?.forEach((p) => {
    profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url, bike_model: p.bike_model }
  })

  // Mappa ride_id -> lista profili partecipanti
  const rideAttendees: Record<string, ParticipantProfile[]> = {}
  participantsData?.forEach(({ ride_id, user_id }) => {
    if (!rideAttendees[ride_id]) rideAttendees[ride_id] = []
    const p = profileMap[user_id]
    if (p) rideAttendees[ride_id].push(p)
  })

  const groups = memberships
    .map((m) => m.groups)
    .filter(Boolean) as { id: string; name: string }[]

  // Raggruppa i giri per gruppo
  const ridesByGroup: Record<string, typeof rides> = {}
  rides?.forEach((ride) => {
    if (!ridesByGroup[ride.group_id]) ridesByGroup[ride.group_id] = []
    ridesByGroup[ride.group_id]!.push(ride)
  })

  // Mappa group_id -> { name, color } per il calendario
  const groupInfoMap: Record<string, { name: string; color: ReturnType<typeof getGroupColor> }> = {}
  memberships.forEach((m) => {
    const g = m.groups as { id: string; name: string } | null
    if (g) groupInfoMap[g.id] = { name: g.name, color: getGroupColor(g.id) }
  })

  // Dati per il calendario
  const calendarRides = (rides ?? []).map((ride) => {
    const info = groupInfoMap[ride.group_id]
    return {
      id: ride.id,
      title: ride.title,
      date_time: ride.date_time,
      meeting_point_name: ride.meeting_point_name,
      group_id: ride.group_id,
      groupName: info?.name ?? "",
      groupColor: info?.color ?? getGroupColor(ride.group_id),
    }
  })

  // Vista lista (server-rendered)
  const listView = (
    <div className="space-y-10">
      {memberships.map((m) => {
        const g = m.groups as { id: string; name: string; invite_code: string } | null
        if (!g) return null
        const color = getGroupColor(g.id)
        const groupRides = ridesByGroup[g.id] ?? []

        return (
          <section key={g.id}>
            <Link href={`/groups/${g.id}`} className="group">
              <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 mb-4 transition-shadow hover:shadow-md ${color.bg} ${color.border}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${color.dot}`} />
                  <span className={`font-semibold ${color.text}`}>{g.name}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {g.invite_code}
                  </Badge>
                  {m.role === "admin" && (
                    <Badge className="text-xs">admin</Badge>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {groupRides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Nessun giro in programma per questo gruppo</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupRides.map((ride) => {
                  const rideDate = new Date(ride.date_time)
                  const isToday = new Date().toDateString() === rideDate.toDateString()

                  return (
                    <Link key={ride.id} href={`/rides/${ride.id}`}>
                      <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full border-l-4 ${color.border}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base leading-tight">{ride.title}</CardTitle>
                            {isToday && (
                              <Badge className="shrink-0 bg-green-500 hover:bg-green-500 text-white">
                                Oggi
                              </Badge>
                            )}
                          </div>
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
                                    <Avatar key={p.username} username={p.username} avatarUrl={p.avatar_url} bikeModel={p.bike_model} size="sm" />
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
          </section>
        )
      })}
    </div>
  )

  const calendarView = (
    <Card>
      <CardContent className="pt-6">
        <RideCalendar rides={calendarRides} />
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar username={profile?.username} avatarUrl={profile?.avatar_url} bikeModel={profile?.bike_model} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {memberships.length} gruppo{memberships.length !== 1 ? "i" : ""} · {rides?.length ?? 0} gir{(rides?.length ?? 0) !== 1 ? "i" : "o"} in programma
            </p>
          </div>
          <div className="flex items-center gap-2">
            <JoinGroupDialog userId={user.id} />
            <CreateRideDialog groups={groups} userId={user.id} />
          </div>
        </div>

        <DashboardViews listView={listView} calendarView={calendarView} />
      </main>
    </div>
  )
}
