import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTextMessage } from '@/lib/whatsapp'

/**
 * GET — WhatsApp webhook verification (required by Meta)
 */
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

/**
 * POST — Receive incoming WhatsApp messages
 */
export async function POST(req: NextRequest) {
  const body = await req.json()

  try {
    const entry   = body?.entry?.[0]
    const change  = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]

    if (!message) {
      return NextResponse.json({ status: 'no_message' })
    }

    const from = message.from as string
    const text = (message.text?.body as string ?? '').toLowerCase().trim()

    // Basic intent detection
    if (text.includes('agendar') || text.includes('cita') || text.includes('turno')) {
      await handleBookingIntent(from)
    } else if (text === 'cancelar') {
      await handleCancelIntent(from)
    } else {
      // Default greeting
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

async function handleBookingIntent(phone: string) {
  // TODO: Implement full booking flow (multi-step conversation state)
  await sendTextMessage({
    to: phone,
    text:
      '✂️ ¡Con gusto te ayudo a agendar!\n\n' +
      'Por favor visita nuestro portal para elegir barbero, servicio y horario:\n' +
      `${process.env.NEXT_PUBLIC_APP_URL}/book/mi-barberia\n\n` +
      '¿Necesitas más ayuda? Escríbenos aquí.',
  })
}

async function handleCancelIntent(phone: string) {
  const supabase = await createClient()

  // Find most recent upcoming appointment for this phone
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, starts_at, service_name, barber:barbers(name)')
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

  // Cancel the appointment
  await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointment.id)

  await sendTextMessage({
    to: phone,
    text:
      `❌ Tu cita de *${appointment.service_name}* fue cancelada.\n\n` +
      `¿Quieres reagendar? Escribe AGENDAR o visita nuestro portal.`,
  })
}
