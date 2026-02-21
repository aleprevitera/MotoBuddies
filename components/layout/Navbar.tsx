"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { toast } from "sonner"
import { Bike, LogOut, LayoutDashboard } from "lucide-react"

interface NavbarProps {
  username?: string
  avatarUrl?: string | null
  bikeModel?: string | null
  userId?: string
}

export function Navbar({ username, avatarUrl, bikeModel, userId }: NavbarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Disconnesso")
    router.push("/login")
  }

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Bike className="w-5 h-5" />
            MotoBuddies
          </Link>
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {userId && <NotificationBell userId={userId} />}
          {username && (
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar username={username} avatarUrl={avatarUrl} bikeModel={bikeModel} size="sm" />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {username}
              </span>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" />
            Esci
          </Button>
        </div>
      </div>
    </header>
  )
}
