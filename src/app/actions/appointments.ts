'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAvailableSlots, type TimeSlot, type BarberBlock } from '@/lib/slots'
import { sendAppointmentConfirmation } from '@/lib/whatsapp'
import { formatDate, formatTime } from '@/lib/utils'

// ── Schema ────────────────────────────────────────────────────

const createAppointmentSchema = z.object({
  barberId:    z.string().uuid(),
  serviceId:   z.string().uuid(),
  startsAt:    z.string().datetime(),
  endsAt:      z.string().datetime(),
  clientName:  z.string().min(2, 'Ingresa el nombre del cliente'),
  clientPhone: z.string().min(7, 'Teléfono inválido'),
  notes:       z.string().optional(),
})

export type AppointmentFormState = {
  error?:       string
  fieldErrors?: Record<string, string[]>
  success?:     boolean
}

// ── Create appointment ────────────────────────────────────────

export async function createAppointmentAction(
  _prev: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  // Auth via regular client; all DB ops via admin client (bypass RLS)
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) return { error: 'Barbería no configurada.' }

  const raw = {
    barberId:    formData.get('barberId')    as string,
    serviceId:   formData.get('serviceId')   as string,
    startsAt:    formData.get('startsAt')    as string,
    endsAt:      formData.get('endsAt')      as string,
    clientName:  formData.get('clientName')  as string,
    clientPhone: formData.get('clientPhone') as string,
    notes:       formData.get('notes')       as string | undefined,
  }

  const parsed = createAppointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { barberId, serviceId, startsAt, endsAt,
          clientName, clientPhone, notes } = parsed.data

  // ── Conflict check ───────────────────────────────────────
  const { data: conflict } = await admin
    .from('appointments')
    .select('id')
    .eq('barber_id', barberId)
    .not('status', 'in', '("cancelled","no_show")')
    .lt('starts_at', endsAt)
    .gt('ends_at',   startsAt)
    .maybeSingle()

  if (conflict) {
    return { error: 'Ese horario ya fue reservado. Elige otro.' }
  }

  // ── Fetch service details ────────────────────────────────
  const { data: service } = await admin
    .from('services')
    .select('name, price, duration')
    .eq('id', serviceId)
    .single()

  if (!service) return { error: 'Servicio no encontrado.' }

  // ── Fetch barber name ────────────────────────────────────
  const { data: barber } = await admin
    .from('barbers')
    .select('name')
    .eq('id', barberId)
    .single()

  // ── Upsert client ─────────────────────────────────────────
  // Match by phone AND name so different people sharing a phone
  // (e.g. family members, test data) each get their own record.
  let clientId: string | null = null

  const { data: existingClient } = await admin
    .from('clients')
    .select('id')
    .eq('shop_id', profile.shop_id)
    .eq('phone', clientPhone)
    .ilike('full_name', clientName)   // case-insensitive name match
    .maybeSingle()

  if (existingClient) {
    clientId = existingClient.id
  } else {
    const { data: newClient } = await admin
      .from('clients')
      .insert({ shop_id: profile.shop_id, full_name: clientName, phone: clientPhone })
      .select('id')
      .single()
    clientId = newClient?.id ?? null
  }

  // ── Create appointment ───────────────────────────────────
  const { error: insertError } = await admin
    .from('appointments')
    .insert({
      shop_id:       profile.shop_id,
      barber_id:     barberId,
      service_id:    serviceId,
      client_id:     clientId,
      client_name:   clientName,
      client_phone:  clientPhone,
      service_name:  service.name,
      service_price: service.price,
      duration:      service.duration,
      starts_at:     startsAt,
      ends_at:       endsAt,
      status:        'confirmed',
      notes:         notes || null,
      created_via:   'dashboard',
    })

  if (insertError) {
    console.error('[createAppointment]', insertError)
    return { error: 'No se pudo crear la cita. Intenta de nuevo.' }
  }

  // ── WhatsApp confirmation (best-effort) ──────────────────
  try {
    const { data: shop } = await admin
      .from('shops')
      .select('name, timezone')
      .eq('id', profile.shop_id)
      .single()

    if (shop) {
      await sendAppointmentConfirmation({
        phone:       clientPhone,
        shopName:    shop.name,
        clientName,
        barberName:  barber?.name ?? 'Tu barbero',
        serviceName: service.name,
        date:        formatDate(startsAt),
        time:        formatTime(startsAt),
      })
    }
  } catch (e) {
    console.warn('[WhatsApp confirmation skipped]', e)
  }

  revalidatePath('/dashboard/appointments')
  return { success: true }
}

// ── Update appointment status ─────────────────────────────────

export async function updateAppointmentStatusAction(
  id:     string,
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { error } = await admin
    .from('appointments')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/appointments')
  return {}
}

// ── Edit appointment ──────────────────────────────────────────

const editAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  barberId:      z.string().uuid(),
  serviceId:     z.string().uuid(),
  startsAt:      z.string().datetime(),
  endsAt:        z.string().datetime(),
  clientName:    z.string().min(2, 'Ingresa el nombre del cliente'),
  clientPhone:   z.string().min(7, 'Teléfono inválido'),
  notes:         z.string().optional(),
})

export async function editAppointmentAction(
  _prev: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const raw = {
    appointmentId: formData.get('appointmentId') as string,
    barberId:      formData.get('barberId')       as string,
    serviceId:     formData.get('serviceId')      as string,
    startsAt:      formData.get('startsAt')       as string,
    endsAt:        formData.get('endsAt')         as string,
    clientName:    formData.get('clientName')     as string,
    clientPhone:   formData.get('clientPhone')    as string,
    notes:         formData.get('notes')          as string | undefined,
  }

  const parsed = editAppointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { appointmentId, barberId, serviceId, startsAt, endsAt,
          clientName, clientPhone, notes } = parsed.data

  // Conflict check (exclude the appointment being edited)
  const { data: conflict } = await admin
    .from('appointments')
    .select('id')
    .eq('barber_id', barberId)
    .not('status', 'in', '("cancelled","no_show")')
    .neq('id', appointmentId)
    .lt('starts_at', endsAt)
    .gt('ends_at',   startsAt)
    .maybeSingle()

  if (conflict) {
    return { error: 'Ese horario ya fue reservado. Elige otro.' }
  }

  const { data: service } = await admin
    .from('services')
    .select('name, price, duration')
    .eq('id', serviceId)
    .single()

  if (!service) return { error: 'Servicio no encontrado.' }

  const { error: updateError } = await admin
    .from('appointments')
    .update({
      barber_id:     barberId,
      service_id:    serviceId,
      client_name:   clientName,
      client_phone:  clientPhone,
      service_name:  service.name,
      service_price: service.price,
      duration:      service.duration,
      starts_at:     startsAt,
      ends_at:       endsAt,
      notes:         notes || null,
    })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[editAppointment]', updateError)
    return { error: 'No se pudo actualizar la cita.' }
  }

  revalidatePath('/dashboard/appointments')
  return { success: true }
}

// ── Get available slots ───────────────────────────────────────

export async function getAvailableSlotsAction(
  barberId:   string,
  serviceId:  string,
  date:       string,    // "YYYY-MM-DD"
  excludeId?: string     // appointment ID to exclude from conflict check (when editing)
): Promise<{ slots: TimeSlot[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { slots: [], error: 'No autenticado.' }

  // Use admin client to bypass RLS for schedule/service reads
  const admin = createAdminClient()

  // Get shop timezone
  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id, shops(timezone)')
    .eq('id', user.id)
    .single()

  const timezone = (profile?.shops as any)?.timezone ?? 'America/Mexico_City'

  // Get barber schedule for this day of week
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay()  // 0=Sun

  const { data: schedule } = await admin
    .from('barber_schedules')
    .select('start_time, end_time')
    .eq('barber_id', barberId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .maybeSingle()

  if (!schedule) {
    return { slots: [], error: 'El barbero no trabaja ese día.' }
  }

  // Get service duration + break
  const { data: service } = await admin
    .from('services')
    .select('duration, break_after')
    .eq('id', serviceId)
    .single()

  if (!service) return { slots: [], error: 'Servicio no encontrado.' }

  // Get existing appointments for that barber on that date
  let existingQuery = admin
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('barber_id', barberId)
    .not('status', 'in', '("cancelled","no_show")')
    .gte('starts_at', `${date}T00:00:00Z`)
    .lt('starts_at',  `${date}T23:59:59Z`)

  // When editing, exclude the current appointment so its slot shows as available
  if (excludeId) existingQuery = existingQuery.neq('id', excludeId)

  const shopId = (profile as any)?.shop_id as string | undefined

  const [{ data: existing }, { data: rawBlocks }] = await Promise.all([
    existingQuery,
    shopId
      ? admin
          .from('barber_blocks')
          .select('is_full_day, start_time, end_time')
          .eq('shop_id', shopId)
          .eq('date', date)
          .or(`barber_id.eq.${barberId},barber_id.is.null`)
      : Promise.resolve({ data: [] }),
  ])

  const blocks: BarberBlock[] = (rawBlocks ?? []).map((b: any) => ({
    is_full_day: b.is_full_day,
    start_time:  b.start_time ? (b.start_time as string).slice(0, 5) : null,
    end_time:    b.end_time   ? (b.end_time   as string).slice(0, 5) : null,
  }))

  // PostgreSQL returns time as "HH:mm:ss" — slice to "HH:mm" for slot generator
  const slots = generateAvailableSlots(
    date,
    schedule.start_time.slice(0, 5),
    schedule.end_time.slice(0, 5),
    service.duration,
    existing ?? [],
    timezone,
    service.break_after ?? 0,
    blocks
  )

  return { slots }
}
