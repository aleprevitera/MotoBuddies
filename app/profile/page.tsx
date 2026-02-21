import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/Navbar"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, bike_model")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  return (
    <div className="min-h-screen bg-background">
      <Navbar username={profile.username} avatarUrl={profile.avatar_url} bikeModel={profile.bike_model} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-8">Il tuo profilo</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Dati personali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              userId={user.id}
              initialUsername={profile.username}
              initialBikeModel={profile.bike_model}
              initialAvatarUrl={profile.avatar_url}
            />
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-6">
          Email: {user.email}
        </p>
      </main>
    </div>
  )
}
