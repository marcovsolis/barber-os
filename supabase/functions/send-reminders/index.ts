/**
 * Supabase Edge Function: send-reminders
 *
 * Called by Supabase's pg_cron every hour. Hits the Next.js API route
 * to queue and/or send WhatsApp reminders for upcoming appointments.
 *
 * Deploy:  supabase functions deploy send-reminders
 * Cron:    supabase functions schedule send-reminders "0 * * * *"
 *
 * Required env vars in Supabase Dashboard → Edge Functions → Secrets:
 *   APP_URL      — your deployed Next.js URL, e.g. https://your-app.vercel.app
 *   CRON_SECRET  — must match CRON_SECRET in your Next.js environment
 */

Deno.serve(async () => {
  const appUrl      = Deno.env.get('APP_URL')      ?? ''
  const cronSecret  = Deno.env.get('CRON_SECRET')  ?? ''

  if (!appUrl) {
    console.error('APP_URL env var is not set')
    return new Response('APP_URL missing', { status: 500 })
  }

  const res = await fetch(`${appUrl}/api/cron/reminders`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${cronSecret}`,
      'Content-Type':  'application/json',
    },
  })

  const body = await res.text()
  console.log(`Reminders cron: ${res.status}`, body)

  return new Response(body, { status: res.status })
})
