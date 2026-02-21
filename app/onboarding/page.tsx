"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Users, Plus, LogIn, Bike } from "lucide-react"
import type { Database } from "@/lib/supabase/types"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export default function OnboardingPage() {
  const router = useRouter()
  const [groupName, setGroupName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const code = generateInviteCode()

    const insertResult = await supabase
      .from("groups")
      .insert({ name: groupName, invite_code: code })
      .select("id")
      .single()

    if (insertResult.error) {
      toast.error("Errore nella creazione del gruppo: " + insertResult.error.message)
      setLoading(false)
      return
    }

    const groupId = (insertResult.data as Pick<GroupRow, "id">).id

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: user.id, role: "admin" })

    if (memberError) {
      toast.error("Errore nell'iscrizione al gruppo: " + memberError.message)
      setLoading(false)
      return
    }

    toast.success(`Gruppo "${groupName}" creato! Codice invito: ${code}`)
    router.push("/dashboard")
  }

  async function handleJoinGroup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const findResult = await supabase
      .from("groups")
      .select("id, name")
      .eq("invite_code", inviteCode.toUpperCase())
      .single()

    if (findResult.error || !findResult.data) {
      toast.error("Codice invito non valido")
      setLoading(false)
      return
    }

    const group = findResult.data as Pick<GroupRow, "id" | "name">

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "member" })

    if (memberError) {
      if (memberError.code === "23505") {
        toast.error("Sei già membro di questo gruppo")
      } else {
        toast.error("Errore nell'iscrizione: " + memberError.message)
      }
      setLoading(false)
      return
    }

    toast.success(`Ti sei unito al gruppo "${group.name}"!`)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground">
            <Bike className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Benvenuto su MotoBuddies!</h1>
          <p className="text-muted-foreground text-sm text-center">
            Inizia creando un gruppo o unendoti a uno esistente
          </p>
        </div>

        <div className="space-y-6">
          {/* Crea gruppo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Crea un nuovo gruppo
              </CardTitle>
              <CardDescription>
                Crea il tuo gruppo e condividi il codice invito con i tuoi compagni di viaggio
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateGroup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Nome del gruppo</Label>
                  <Input
                    id="groupName"
                    placeholder="es. Lupi della Strada"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Users className="w-4 h-4 mr-2" />
                  Crea gruppo
                </Button>
              </CardContent>
            </form>
          </Card>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-sm">oppure</span>
            <Separator className="flex-1" />
          </div>

          {/* Unisciti a gruppo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Unisciti a un gruppo
              </CardTitle>
              <CardDescription>
                Hai ricevuto un codice invito? Inseriscilo qui sotto
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleJoinGroup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Codice invito</Label>
                  <Input
                    id="inviteCode"
                    placeholder="es. ABC123"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    maxLength={6}
                    className="uppercase tracking-widest font-mono"
                    required
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Unisciti
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
