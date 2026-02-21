"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Bike } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Controlla se l'utente ha gruppi
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: membership } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .limit(1)

      if (!membership || membership.length === 0) {
        router.push("/onboarding")
      } else {
        router.push("/dashboard")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground">
            <Bike className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">MotoBuddy</h1>
          <p className="text-muted-foreground text-sm">Organizza i tuoi giri in moto</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accedi</CardTitle>
            <CardDescription>Inserisci le tue credenziali per entrare</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mario@esempio.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Accesso in corso..." : "Accedi"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Non hai un account?{" "}
                <Link href="/register" className="underline font-medium text-foreground">
                  Registrati
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
