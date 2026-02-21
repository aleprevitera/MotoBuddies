// Supabase Edge Function: invia email promemoria giri via Resend
// Deploy: supabase functions deploy send-email --no-verify-jwt
// Trigger: Database Webhook su INSERT nella tabella notifications WHERE type = 'ride_reminder'
//          oppure invocazione manuale via cron/API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

interface WebhookPayload {
  type: "INSERT"
  table: string
  record: {
    id: string
    user_id: string
    type: string
    title: string
    body: string
    link: string | null
  }
}

serve(async (req) => {
  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY non configurata" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const payload: WebhookPayload = await req.json()

    // Processa solo notifiche di tipo ride_reminder
    if (payload.record.type !== "ride_reminder") {
      return new Response(
        JSON.stringify({ ok: true, skipped: true }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Recupera email dell'utente da Supabase Auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const userRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${payload.record.user_id}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    )

    if (!userRes.ok) {
      return new Response(
        JSON.stringify({ error: "Utente non trovato" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const user = await userRes.json()
    const email = user.email

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email utente non disponibile" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Invia email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MotoBuddies <noreply@yourdomain.com>",
        to: [email],
        subject: payload.record.title,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">${payload.record.title}</h2>
            <p style="color: #555; font-size: 16px;">${payload.record.body}</p>
            ${
              payload.record.link
                ? `<a href="${Deno.env.get("SITE_URL") ?? "http://localhost:3000"}${payload.record.link}"
                    style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">
                    Vedi dettagli
                  </a>`
                : ""
            }
            <p style="color: #999; font-size: 12px; margin-top: 32px;">
              — MotoBuddies
            </p>
          </div>
        `,
      }),
    })

    const emailData = await emailRes.json()

    return new Response(
      JSON.stringify({ ok: true, emailId: emailData.id }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
