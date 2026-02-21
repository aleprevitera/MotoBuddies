import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

// Service-role client: bypassa RLS per scrivere notifiche per conto di altri utenti
function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { groupId, rideId, exceptUserId, type, title, body, link } = await req.json()

    if (!type || !title || !body || !exceptUserId) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 })
    }

    const supabase = createServiceClient()
    let userIds: string[] = []

    if (groupId) {
      // Notifica a tutti i membri del gruppo (eccetto chi ha fatto l'azione)
      const { data: members, error } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .neq("user_id", exceptUserId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      userIds = members?.map((m) => m.user_id) ?? []
    } else if (rideId) {
      // Notifica al creatore del giro (per RSVP)
      const { data: ride, error } = await supabase
        .from("rides")
        .select("created_by")
        .eq("id", rideId)
        .single()

      if (error || !ride) {
        return NextResponse.json({ error: "Giro non trovato" }, { status: 404 })
      }

      // Non notificare se il creatore è chi ha fatto l'azione
      if (ride.created_by !== exceptUserId) {
        userIds = [ride.created_by]
      }
    }

    if (userIds.length === 0) {
      return NextResponse.json({ ok: true, count: 0 })
    }

    const notifications = userIds.map((user_id) => ({
      user_id,
      type: type as Database["public"]["Tables"]["notifications"]["Row"]["type"],
      title,
      body,
      link: link ?? null,
    }))

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, count: userIds.length })
  } catch {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
