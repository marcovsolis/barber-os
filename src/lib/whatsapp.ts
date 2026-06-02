/**
 * WhatsApp Business API integration (360dialog)
 *
 * Two levels of configuration:
 * 1. Per-shop: each barbershop can configure their own API key in Settings.
 *    Stored in shops.whatsapp_api_key + shops.whatsapp_phone_id.
 * 2. Platform-wide fallback: WHATSAPP_API_KEY env var (optional).
 *
 * If neither is configured, all send functions return null silently.
 *
 * WHATSAPP_APP_SECRET env var is used ONLY for webhook signature verification
 * (a single value per Meta app, not per shop).
 */

const API_BASE = 'https://waba.360dialog.io/v1'

// ── Key resolution ────────────────────────────────────────────

/** Returns the API key to use: per-shop first, env fallback second */
function resolveApiKey(shopApiKey?: string | null): string | null {
  if (shopApiKey && shopApiKey.length > 0) return shopApiKey
  const env = process.env.WHATSAPP_API_KEY
  return env && env.length > 0 ? env : null
}

// ── Core send functions ───────────────────────────────────────

interface SendTextOptions {
  to:        string   // phone with country code, e.g. "50688218799"
  text:      string
  apiKey?:   string | null   // shop-specific key (optional)
}

/** Send a plain text WhatsApp message. Returns null if not configured. */
export async function sendTextMessage({ to, text, apiKey }: SendTextOptions) {
  const key = resolveApiKey(apiKey)
  if (!key) return null

  const res = await fetch(`${API_BASE}/messages`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'D360-API-KEY': key },
    body: JSON.stringify({
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`)
  }

  return res.json()
}

interface SendTemplateOptions {
  to:           string
  templateName: string
  languageCode?: string
  components?:   object[]
  apiKey?:       string | null
}

/** Send a WhatsApp template message. Returns null if not configured. */
export async function sendTemplateMessage({
  to, templateName, languageCode = 'es', components = [], apiKey,
}: SendTemplateOptions) {
  const key = resolveApiKey(apiKey)
  if (!key) return null

  const res = await fetch(`${API_BASE}/messages`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'D360-API-KEY': key },
    body: JSON.stringify({
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        namespace: process.env.WHATSAPP_PHONE_NUMBER_ID,
        name:      templateName,
        language:  { policy: 'deterministic', code: languageCode },
        components,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`)
  }

  return res.json()
}

// ── Pre-built notification messages ──────────────────────────

export async function sendAppointmentConfirmation(opts: {
  phone:       string
  shopName:    string
  clientName:  string
  barberName:  string
  serviceName: string
  date:        string
  time:        string
  shopApiKey?: string | null
}) {
  const { phone, shopName, clientName, barberName, serviceName, date, time, shopApiKey } = opts
  const text =
    `✅ ¡Cita confirmada!\n\n` +
    `Hola ${clientName}, tu cita en *${shopName}* quedó reservada:\n\n` +
    `📅 Fecha: ${date}\n` +
    `⏰ Hora: ${time}\n` +
    `✂️ Servicio: ${serviceName}\n` +
    `👤 Barbero: ${barberName}\n\n` +
    `Si necesitas cancelar comunícate con nosotros.`

  return sendTextMessage({ to: phone, text, apiKey: shopApiKey })
}

export async function sendAppointmentReminder(opts: {
  phone:       string
  shopName:    string
  clientName:  string
  time:        string
  hoursAhead:  24 | 1
  shopApiKey?: string | null
}) {
  const { phone, shopName, clientName, time, hoursAhead, shopApiKey } = opts
  const text = hoursAhead === 24
    ? `⏰ Recordatorio: mañana a las *${time}* tienes cita en *${shopName}*. ¡Te esperamos, ${clientName}!`
    : `✂️ Tu cita en *${shopName}* es en 1 hora (${time}). ¡Nos vemos pronto!`

  return sendTextMessage({ to: phone, text, apiKey: shopApiKey })
}

export async function sendPaymentReceipt(opts: {
  phone:       string
  shopName:    string
  services:    string
  total:       number
  shopApiKey?: string | null
}) {
  const { phone, shopName, services, total, shopApiKey } = opts
  const text =
    `🧾 Recibo de *${shopName}*\n\n` +
    `${services}\n\n` +
    `💵 Total: $${total.toFixed(2)}\n\n` +
    `¡Gracias por tu visita! 💈`

  return sendTextMessage({ to: phone, text, apiKey: shopApiKey })
}
