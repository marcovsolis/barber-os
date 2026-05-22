/**
 * WhatsApp Business API integration (360dialog)
 * Docs: https://docs.360dialog.com/whatsapp-api/whatsapp-api/media
 */

const API_BASE = 'https://waba.360dialog.io/v1'
const API_KEY  = process.env.WHATSAPP_API_KEY!

interface SendTextMessageOptions {
  to: string   // recipient phone with country code, e.g. "5491123456789"
  text: string
}

interface SendTemplateMessageOptions {
  to: string
  templateName: string
  languageCode?: string
  components?: object[]
}

/** Send a plain text WhatsApp message */
export async function sendTextMessage({ to, text }: SendTextMessageOptions) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'D360-API-KEY': API_KEY,
    },
    body: JSON.stringify({
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`)
  }

  return res.json()
}

/** Send a WhatsApp template message (required for outbound after 24h) */
export async function sendTemplateMessage({
  to,
  templateName,
  languageCode = 'es',
  components = [],
}: SendTemplateMessageOptions) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'D360-API-KEY': API_KEY,
    },
    body: JSON.stringify({
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        namespace: process.env.WHATSAPP_PHONE_NUMBER_ID,
        name: templateName,
        language: { policy: 'deterministic', code: languageCode },
        components,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`)
  }

  return res.json()
}

// ── Pre-built notification messages ──────────────────────────

export async function sendAppointmentConfirmation(opts: {
  phone: string
  shopName: string
  clientName: string
  barberName: string
  serviceName: string
  date: string     // formatted date string
  time: string     // formatted time string
}) {
  const { phone, shopName, clientName, barberName, serviceName, date, time } = opts
  const text =
    `✅ ¡Cita confirmada!\n\n` +
    `Hola ${clientName}, tu cita en *${shopName}* quedó reservada:\n\n` +
    `📅 Fecha: ${date}\n` +
    `⏰ Hora: ${time}\n` +
    `✂️ Servicio: ${serviceName}\n` +
    `👤 Barbero: ${barberName}\n\n` +
    `Si necesitas cancelar responde CANCELAR.`

  return sendTextMessage({ to: phone, text })
}

export async function sendAppointmentReminder(opts: {
  phone: string
  shopName: string
  clientName: string
  time: string
  hoursAhead: 24 | 1
}) {
  const { phone, shopName, clientName, time, hoursAhead } = opts
  const text = hoursAhead === 24
    ? `⏰ Recordatorio: mañana a las *${time}* tienes cita en *${shopName}*. ¡Te esperamos, ${clientName}! Si necesitas cancelar responde CANCELAR.`
    : `✂️ Tu cita en *${shopName}* es en 1 hora (${time}). ¡Nos vemos pronto!`

  return sendTextMessage({ to: phone, text })
}

export async function sendPaymentReceipt(opts: {
  phone: string
  shopName: string
  services: string
  total: number
}) {
  const { phone, shopName, services, total } = opts
  const text =
    `🧾 Recibo de *${shopName}*\n\n` +
    `${services}\n\n` +
    `💵 Total: $${total.toFixed(2)}\n\n` +
    `¡Gracias por tu visita! 💈`

  return sendTextMessage({ to: phone, text })
}
