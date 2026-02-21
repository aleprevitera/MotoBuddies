"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

interface LeaveGroupButtonProps {
  groupId: string
  groupName: string
  userId: string
  isLastGroup: boolean
}

export function LeaveGroupButton({ groupId, groupName, userId, isLastGroup }: LeaveGroupButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLeave() {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId)

    if (error) {
      toast.error("Errore nell'uscita dal gruppo")
      setLoading(false)
      return
    }

    toast.success(`Hai lasciato "${groupName}"`)
    setOpen(false)

    if (isLastGroup) {
      router.push("/onboarding")
    } else {
      router.push("/dashboard")
    }
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <LogOut className="w-4 h-4 mr-1" />
          Lascia gruppo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lasciare &quot;{groupName}&quot;?</DialogTitle>
          <DialogDescription>
            {isLastGroup
              ? "Questo è il tuo unico gruppo. Se esci, dovrai crearne o unirti a uno nuovo."
              : "Non vedrai più i giri di questo gruppo. Potrai rientrare con il codice invito."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={loading}>
            {loading ? "Uscita..." : "Lascia gruppo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
