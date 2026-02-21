"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, LogIn, Users } from "lucide-react"
import { notifyGroupMembers } from "@/lib/notifications"
import type { Database } from "@/lib/supabase/types"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

interface JoinGroupDialogProps {
  userId: string
  username: string
}

export function JoinGroupDialog({ userId, username }: JoinGroupDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"join" | "create">("join")
  const [inviteCode, setInviteCode] = useState("")
  const [groupName, setGroupName] = useState("")

  function reset() {
    setInviteCode("")
    setGroupName("")
    setTab("join")
    setLoading(false)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

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

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: userId, role: "member" })

    if (error) {
      if (error.code === "23505") {
        toast.error("Sei già membro di questo gruppo")
      } else {
        toast.error("Errore nell'iscrizione: " + error.message)
      }
      setLoading(false)
      return
    }

    toast.success(`Ti sei unito a "${group.name}"!`)

    // Notifica ai membri esistenti del gruppo
    notifyGroupMembers(
      group.id,
      userId,
      "new_member",
      "Nuovo membro",
      `${username} si è unito a "${group.name}"`,
      `/groups/${group.id}`
    )

    reset()
    setOpen(false)
    router.refresh()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const code = generateInviteCode()

    const insertResult = await supabase
      .from("groups")
      .insert({ name: groupName, invite_code: code })
      .select("id")
      .single()

    if (insertResult.error) {
      toast.error("Errore nella creazione: " + insertResult.error.message)
      setLoading(false)
      return
    }

    const groupId = (insertResult.data as Pick<GroupRow, "id">).id

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: userId, role: "admin" })

    if (error) {
      toast.error("Errore: " + error.message)
      setLoading(false)
      return
    }

    toast.success(`Gruppo "${groupName}" creato! Codice: ${code}`)
    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Aggiungi gruppo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi gruppo</DialogTitle>
          <DialogDescription>
            Unisciti a un gruppo esistente o creane uno nuovo
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setTab("join")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "join" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Unisciti
          </button>
          <button
            type="button"
            onClick={() => setTab("create")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "create" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Crea nuovo
          </button>
        </div>

        {tab === "join" ? (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="joinCode">Codice invito</Label>
              <Input
                id="joinCode"
                placeholder="es. ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                maxLength={6}
                className="uppercase tracking-widest font-mono text-center text-lg"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Iscrizione..." : "Unisciti"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newGroupName">Nome del gruppo</Label>
              <Input
                id="newGroupName"
                placeholder="es. Lupi della Strada"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creazione..." : "Crea gruppo"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
