'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'

const schema = z.object({
  appointmentId: z.string().uuid(),
  amount:        z.coerce.number().positive('El monto debe ser mayor a 0'),
  method:        z.enum(['cash', 'card', 'transfer', 'other']),
  discountAmount: z.coerce.number().min(0).default(0),
  sendReceipt:   z.coerce.boolean().default(false),
  notes:         z.string().optional(),
})

export type PaymentFormState = {
  error?:       string
  success?:     boolean
  waLink?:      string   // wa.me link to send receipt via WhatsApp
  clientPhone?: string
  shopName?:    string
  serviceName?: string
  amount?:      number
}

export async function registerPaymentAction(
  _prev: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const supabase = await createClient()
  const admin    = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const parsed = schema.safeParse({
    appointmentId:  formData.get('appointmentId'),
    amount:         formData.get('amount'),
    method:         formData.get('method'),
    discountAmount: formData.get('discountAmount') || '0',
    sendReceipt:    formData.get('sendReceipt') === 'true',
    notes:          formData.get('notes'),
  })

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: first ?? 'Datos inválidos.' }
  }

  const { appointmentId, amount, method, discountAmount, sendReceipt, notes } = parsed.data

  // Fetch appointment
  const { data: appt } = await admin
    .from('appointments')
    .select('shop_id, barber_id, service_name, service_price, client_name, client_phone, status')
    .eq('id', appointmentId)
    .single()

  if (!appt) return { error: 'Cita no encontrada.' }

  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (appt.shop_id !== profile?.shop_id) return { error: 'No autorizado.' }

  // Insert payment
  const { error: payErr } = await admin
    .from('payments')
    .insert({
      shop_id:         appt.shop_id,
      appointment_id:  appointmentId,
      barber_id:       appt.barber_id,
      amount,
      method,
      status:          'paid',
      discount_amount: discountAmount,
      notes:           notes || null,
      paid_at:         new Date().toISOString(),
    })

  if (payErr) return { error: 'No se pudo registrar el pago.' }

  // Mark appointment as completed
  await admin.from('appointments').update({ status: 'completed' }).eq('id', appointmentId)

  // Update client last_visit_at
  await admin
    .from('clients')
    .update({ last_visit_at: new Date().toISOString() })
    .eq('shop_id', appt.shop_id)
    .eq('phone', appt.client_phone)

  // Build wa.me link for sending receipt (no API key needed)
  const shopData = await admin.from('shops').select('name, phone').eq('id', appt.shop_id).single()
  const shopName = shopData.data?.name ?? 'la barbería'
  const cleanPhone = appt.client_phone.replace(/\D/g, '')
  const lines = [
    `*Recibo de ${shopName}*`,
    '',
    `Servicio: ${appt.service_name}`,
    ...(discountAmount > 0 ? [`Descuento: -${formatCurrency(discountAmount)}`] : []),
    `Total: *${formatCurrency(amount)}*`,
    '',
    'Gracias por tu visita!',
  ]
  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`

  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard')
  return {
    success:     true,
    waLink:      sendReceipt ? waLink : undefined,
    clientPhone: appt.client_phone,
    shopName:    shopData.data?.name,
    serviceName: appt.service_name,
    amount,
  }
}
