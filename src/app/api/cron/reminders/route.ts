/**
 * POST /api/cron/reminders
 *
 * Triggered by an external cron service (Vercel Cron, Supabase Edge Function,
 * or any scheduler hitting this URL). Runs hourly.
 *
 * What it does:
 * 1. Finds upcoming appointments in the 24h and 30min windows that don't have
 *    a reminder queued yet.
 * 2. Creates reminder rows in `appointment_reminders` with a pre-built wa.me link.
 * 3. If WHATSAPP_API_KEY is configured, sends automatically via the API.
 *    Otherwise, marks status='pending' for the admin to send with one click.
 *
 * Security: protected by CRON_SECRET env var (set the same value in your
 * scheduler's Authorization header).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTextMessage } from '@/lib/whatsapp'
import { formatDate, formatTime } from '@/lib/utils'

const CRON_SECRET = process.env.CRON_SECRET

function buildWaLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

function reminderMessage(
  type: '24h' | '30min',
  clientName: string,
  shopName: string,
  serviceName: string,
  barberName: string,
  startsAt: string
): string {
  const date = formatDate(startsAt)
  const time = formatTime(startsAt)

  if (type === '24h') {
    return [
      `Hola ${clientName} 👋`,
      '',
      `Te recordamos que mañana tienes una cita en *${shopName}*:`,
      `📅 ${date} a las ${time}`,
      `✂️ ${serviceName} con ${barberName}`,
      '',
      'Si necesitas cancelar o cambiar tu cita, comunícate con nosotros.',
    ].join('\n')
  }

  return [
    `¡Hola ${clientName}! 🕐`,
    '',
    `Tu cita en *${shopName}* es en *30 minutos*:`,
    `✂️ ${serviceName} con ${barberName} — ${time}`,
    '',
    '¡Te esperamos!',
  ].join('\n')
}

export async function POST(req: NextRequest) {
  // Fail secure: if CRON_SECRET is not configured, always reject
  if (!CRON_SECRET) {
    console.error('[cron/reminders] CRON_SECRET not set — rejecting request')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now   = new Date()

  // ── Window boundaries ─────────────────────────────────────
  // 24h window: appointments starting between now+23h and now+25h
  const h24lo = new Date(now.getTime() + 23 * 3600 * 1000).toISOString()
  const h24hi = new Date(now.getTime() + 25 * 3600 * 1000).toISOString()

  // 30min window: appointments starting between now+20min and now+40min
  const m30lo = new Date(now.getTime() + 20 * 60 * 1000).toISOString()
  const m30hi = new Date(now.getTime() + 40 * 60 * 1000).toISOString()

  const stats = { queued: 0, sent: 0, skipped: 0, errors: 0 }

  async function processWindow(
    type: '24h' | '30min',
    lo:   string,
    hi:   string
  ) {
    // Fetch upcoming appointments in this window that haven't been reminded yet
    const { data: appts } = await admin
      .from('appointments')
      .select(`
        id, shop_id, starts_at, client_name, client_phone,
        service_name,
        barber:barbers(name),
        shop:shops(name, phone),
        reminder:appointment_reminders(id)
      `)
      .not('status', 'in', '("cancelled","no_show","completed")')
      .gte('starts_at', lo)
      .lte('starts_at', hi)

    for (const a of (appts ?? []) as any[]) {
      // Skip if reminder already exists for this type
      const existing = Array.isArray(a.reminder) ? a.reminder : (a.reminder ? [a.reminder] : [])
      const alreadyQueued = existing.length > 0
      if (alreadyQueued) { stats.skipped++; continue }

      const barberName = Array.isArray(a.barber) ? a.barber[0]?.name : a.barber?.name
      const shopName   = Array.isArray(a.shop)   ? a.shop[0]?.name   : a.shop?.name
      const shopPhone  = Array.isArray(a.shop)   ? a.shop[0]?.phone  : a.shop?.phone

      const message = reminderMessage(
        type,
        a.client_name,
        shopName ?? 'la barbería',
        a.service_name,
        barberName ?? 'tu barbero',
        a.starts_at
      )

      const waLink = buildWaLink(a.client_phone, message)

      let status: 'pending' | 'sent' | 'failed' = 'pending'
      let sentAt: string | null = null

      // Try to send automatically if WhatsApp API is configured
      try {
        const result = await sendTextMessage({ to: a.client_phone, text: message })
        if (result) {
          status  = 'sent'
          sentAt  = new Date().toISOString()
          stats.sent++
        }
      } catch {
        // API not configured or failed — will be sent manually
      }

      if (status === 'pending') stats.queued++

      // Insert reminder record
      const { error } = await admin.from('appointment_reminders').insert({
        appointment_id: a.id,
        shop_id:        a.shop_id,
        type,
        status,
        scheduled_for:  new Date(a.starts_at).toISOString(),
        sent_at:        sentAt,
        wa_link:        waLink,
      })

      if (error) stats.errors++
    }
  }

  await Promise.all([
    processWindow('24h',   h24lo, h24hi),
    processWindow('30min', m30lo, m30hi),
  ])

  return NextResponse.json({ ok: true, stats })
}

// GET intentionally not exposed — cron must use POST with Authorization header
