import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTextMessage } from '@/lib/whatsapp'
import crypto from 'crypto'

// ── Signature verification ─────────────────────────────────────
// Meta signs every POST with HMAC-SHA256 using the app secret.
// We MUST verify this before trusting any payload.

async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    // If secret is not configured, reject all requests — fail secure
    console.error('[webhook] WHATSAPP_APP_SECRET not set — rejecting request')
    return false
  }

  const signature = req.headers.get('x-hub-signature-256') ?? ''
  if (!signature.startsWith('sha256=')) return false

  const expected = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex')

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  } catch {
    return false
  }
}

// ── GET — WhatsApp webhook verification (required by Meta) ────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_SECRET) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// ── POST — Receive incoming WhatsApp messages ─────────────────

export async function POST(req: NextRequest) {
  try {
    // Read raw body first (needed for signature check)
    const rawBody = await req.text()

    // Verify signature before ANY processing
    const valid = await verifySignature(req, rawBody)
    if (!valid) {
      console.warn('[webhook] Invalid signature — request rejected')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body   = JSON.parse(rawBody)
    const entry  = body?.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]

    if (!message) {
      return NextResponse.json({ status: 'no_message' })
    }

    const from = message.from as string
    const text = (message.text?.body as string ?? '').toLowerCase().trim()

    if (text.includes('agendar') || text.includes('cita') || text.includes('turno')) {
      await handleBookingIntent(from)
    } else if (text === 'cancelar') {
      await handleCancelIntent(from)
    } else {
      await sendTextMessage({
        to: from,
        text:
          '¡Hola! 💈 Soy el asistente de BarberOS.\n\n' +
          '¿En qué puedo ayudarte?\n' +
          '• Escribe *AGENDAR* para reservar una cita\n' +
          '• Escribe *CANCELAR* para cancelar tu cita',
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[WhatsApp webhook]', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

// ── Intent handlers ───────────────────────────────────────────

async function handleBookingIntent(phone: string) {
  await sendTextMessage({
    to: phone,
    text:
      '✂️ ¡Con gusto te ayudo a agendar!\n\n' +
      'Por favor visita nuestro portal para elegir barbero, servicio y horario:\n' +
      `${process.env.NEXT_PUBLIC_APP_URL}/book\n\n` +
      '¿Necesitas más ayuda? Escríbenos aquí.',
  })
}

async function handleCancelIntent(phone: string) {
  // Use admin client for server-side operations (no user session in webhook)
  const admin = createAdminClient()

  const { data: appointment } = await admin
    .from('appointments')
    .select('id, starts_at, service_name, shop_id')
    .eq('client_phone', phone)
    .in('status', ['pending', 'confirmed'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .single()

  if (!appointment) {
    await sendTextMessage({
      to: phone,
      text: 'No encontré citas próximas en tu número. ¿Quieres agendar una? Escribe AGENDAR.',
    })
    return
  }

  await admin
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointment.id)

  await sendTextMessage({
    to: phone,
    text:
      `❌ Tu cita de *${appointment.service_name}* fue cancelada.\n\n` +
      `¿Quieres reagendar? Escribe AGENDAR.`,
  })
}
