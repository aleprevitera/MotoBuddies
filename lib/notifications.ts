import type { Database } from "@/lib/supabase/types"

type NotificationType = Database["public"]["Tables"]["notifications"]["Row"]["type"]

export async function notifyGroupMembers(
  groupId: string,
  exceptUserId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupId, exceptUserId, type, title, body, link }),
  })
}

export async function notifyRideCreator(
  rideId: string,
  exceptUserId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rideId, exceptUserId, type, title, body, link }),
  })
}
