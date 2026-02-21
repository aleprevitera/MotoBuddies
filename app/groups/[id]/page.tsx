import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/Navbar"
import { Avatar } from "@/components/ui/avatar"
import { CopyInviteCode } from "@/components/groups/CopyInviteCode"
import { LeaveGroupButton } from "@/components/groups/LeaveGroupButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Bike, Crown } from "lucide-react"

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Profilo utente corrente
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, bike_model")
    .eq("id", user.id)
    .single()

  // Dettagli gruppo
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, created_at")
    .eq("id", id)
    .single()

  if (!group) notFound()

  // Verifica che l'utente sia membro
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single()

  if (!myMembership) redirect("/dashboard")

  // Tutti i membri del gruppo
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at")
    .eq("group_id", id)
    .order("joined_at", { ascending: true })

  const memberIds = members?.map((m) => m.user_id) ?? []
  const { data: memberProfiles } = memberIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, username, avatar_url, bike_model")
        .in("id", memberIds)
    : { data: [] }

  const profileMap: Record<string, { username: string; avatar_url: string | null; bike_model: string | null }> = {}
  memberProfiles?.forEach((p) => {
    profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url, bike_model: p.bike_model }
  })

  // Conta gruppi dell'utente per sapere se è l'ultimo
  const { count: groupCount } = await supabase
    .from("group_members")
    .select("group_id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const isLastGroup = (groupCount ?? 1) <= 1

  return (
    <div className="min-h-screen bg-background">
      <Navbar username={profile?.username} avatarUrl={profile?.avatar_url} bikeModel={profile?.bike_model} userId={user.id} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla dashboard
        </Link>

        {/* Header gruppo */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {members?.length ?? 0} membr{(members?.length ?? 0) === 1 ? "o" : "i"}
            </p>
          </div>
          <LeaveGroupButton
            groupId={group.id}
            groupName={group.name}
            userId={user.id}
            isLastGroup={isLastGroup}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Codice invito */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Codice invito</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Condividi questo codice con altri motociclisti per farli entrare nel gruppo.
              </p>
              <CopyInviteCode code={group.invite_code} />
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informazioni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Creato il{" "}
                {new Date(group.created_at).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p>Il tuo ruolo: <Badge variant="outline" className="ml-1">{myMembership.role}</Badge></p>
            </CardContent>
          </Card>
        </div>

        {/* Lista membri */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Membri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {members?.map((m) => {
                const p = profileMap[m.user_id]
                if (!p) return null
                return (
                  <li key={m.user_id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar username={p.username} avatarUrl={p.avatar_url} bikeModel={p.bike_model} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{p.username}</span>
                          {m.user_id === user.id && (
                            <span className="text-xs text-muted-foreground">(tu)</span>
                          )}
                          {m.role === "admin" && (
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                        {p.bike_model && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Bike className="w-3 h-3" />
                            {p.bike_model}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {m.role}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
