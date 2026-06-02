'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAvailableSlots, type TimeSlot, type BarberBlock } from '@/lib/slots'
import { sendAppointmentConfirmation } from '@/lib/whatsapp'
import { formatDate, formatTime } from '@/lib/utils'

// ── Public: get available slots (no auth needed) ──────────────
// barberId can be a UUID or 'any' (= first available barber)

export async function getPublicSlotsAction(
  shopId:    string,
  barberId:  string,   // UUID | 'any'
  serviceId: string,
  date:      string    // "YYYY-MM-DD"
): Promise<{ slots: TimeSlot[]; error?: string }> {
  const admin = createAdminClient()

  const { data: shop } = await admin
    .from('shops')
    .select('timezone')
    .eq('id', shopId)
    .single()

  const timezone  = shop?.timezone ?? 'America/Mexico_City'
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay()

  const { data: service } = await admin
    .from('services')
    .select('duration, break_after')
    .eq('id', serviceId)
    .single()

  if (!service) return { slots: [], error: 'Servicio no encontrado.' }

  // Fetch shop-wide blocks (apply to any/all barbers)
  const { data: shopBlocks } = await admin
    .from('barber_blocks')
    .select('barber_id, is_full_day, start_time, end_time')
    .eq('shop_id', shopId)
    .eq('date', date)

  // ── "Any barber" path: union of slots across all active barbers ──
  if (barberId === 'any') {
    const { data: barbers } = await admin
      .from('barbers')
      .select('id')
      .eq('shop_id', shopId)
      .eq('is_active', true)

    if (!barbers?.length) return { slots: [], error: 'No hay barberos disponibles.' }

    // For each barber, generate their slots in parallel
    const perBarber = await Promise.all(
      barbers.map(async b => {
        const { data: schedule } = await admin
          .from('barber_schedules')
          .select('start_time, end_time')
          .eq('barber_id', b.id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)
          .maybeSingle()

        if (!schedule) return []

        const { data: existing } = await admin
          .from('appointments')
          .select('starts_at, ends_at')
          .eq('barber_id', b.id)
          .not('status', 'in', '("cancelled","no_show")')
          .gte('starts_at', `${date}T00:00:00Z`)
          .lt('starts_at',  `${date}T23:59:59Z`)

        const blocks: BarberBlock[] = (shopBlocks ?? [])
          .filter(bl => bl.barber_id === b.id || bl.barber_id === null)
          .map(bl => ({
            is_full_day: bl.is_full_day,
            start_time:  bl.start_time ? (bl.start_time as string).slice(0, 5) : null,
            end_time:    bl.end_time   ? (bl.end_time   as string).slice(0, 5) : null,
          }))

        return generateAvailableSlots(
          date,
          schedule.start_time.slice(0, 5),
          schedule.end_time.slice(0, 5),
          service.duration,
          existing ?? [],
          timezone,
          service.break_after ?? 0,
          blocks
        )
      })
    )

    // Union: deduplicate by startsAt, keeping earliest per slot
    const seen = new Map<string, TimeSlot>()
    for (const slots of perBarber) {
      for (const slot of slots) {
        if (!seen.has(slot.startsAt)) seen.set(slot.startsAt, slot)
      }
    }
    const merged = Array.from(seen.values()).sort((a, b) =>
      a.startsAt.localeCompare(b.startsAt)
    )

    return { slots: merged }
  }

  // ── Specific barber path (original logic) ──────────────────
  const { data: schedule } = await admin
    .from('barber_schedules')
    .select('start_time, end_time')
    .eq('barber_id', barberId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .maybeSingle()

  if (!schedule) return { slots: [], error: 'El barbero no trabaja ese día.' }

  const [{ data: existing }, { data: rawBlocks }] = await Promise.all([
    admin
      .from('appointments')
      .select('starts_at, ends_at')
      .eq('barber_id', barberId)
      .not('status', 'in', '("cancelled","no_show")')
      .gte('starts_at', `${date}T00:00:00Z`)
      .lt('starts_at',  `${date}T23:59:59Z`),
    admin
      .from('barber_blocks')
      .select('is_full_day, start_time, end_time')
      .eq('shop_id', shopId)
      .eq('date', date)
      .or(`barber_id.eq.${barberId},barber_id.is.null`),
  ])

  const blocks: BarberBlock[] = (rawBlocks ?? []).map(b => ({
    is_full_day: b.is_full_day,
    start_time:  b.start_time ? (b.start_time as string).slice(0, 5) : null,
    end_time:    b.end_time   ? (b.end_time   as string).slice(0, 5) : null,
  }))

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

// ── Public: book appointment ──────────────────────────────────

const bookSchema = z.object({
  shopId:      z.string().uuid(),
  barberId:    z.union([z.string().uuid(), z.literal('any')]),
  serviceId:   z.string().uuid(),
  startsAt:    z.string().datetime(),
  endsAt:      z.string().datetime(),
  clientName:  z.string().min(2,  'Ingresa tu nombre completo'),
  clientPhone: z.string().min(7,  'Teléfono inválido'),
  notes:       z.string().optional(),
})

export type BookState = {
  error?:         string
  fieldErrors?:   Record<string, string[]>
  success?:       boolean
  appointmentId?: string
  shopPhone?:     string  // shop WhatsApp number for wa.me link
  shopName?:      string
}

export async function bookAppointmentAction(
  _prev: BookState,
  formData: FormData
): Promise<BookState> {
  const admin = createAdminClient()

  const parsed = bookSchema.safeParse({
    shopId:      formData.get('shopId'),
    barberId:    formData.get('barberId'),
    serviceId:   formData.get('serviceId'),
    startsAt:    formData.get('startsAt'),
    endsAt:      formData.get('endsAt'),
    clientName:  formData.get('clientName'),
    clientPhone: formData.get('clientPhone'),
    notes:       formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { shopId, barberId, serviceId, startsAt, endsAt,
          clientName, clientPhone, notes } = parsed.data

  // Verify shop is active
  const { data: shop } = await admin
    .from('shops')
    .select('id, name, timezone, phone')
    .eq('id', shopId)
    .eq('is_active', true)
    .single()

  if (!shop) return { error: 'Barbería no disponible.' }

  // ── Auto-assign barber when "any" was selected ──────────────
  let resolvedBarberId = barberId

  if (barberId === 'any') {
    // Find all active barbers for this shop
    const { data: activeBarbers } = await admin
      .from('barbers')
      .select('id')
      .eq('shop_id', shopId)
      .eq('is_active', true)

    if (!activeBarbers?.length) {
      return { error: 'No hay profesionales disponibles en este momento.' }
    }

    // Pick the first barber who has no conflict for this slot
    let assigned: string | null = null
    for (const b of activeBarbers) {
      const { data: conflict } = await admin
        .from('appointments')
        .select('id')
        .eq('barber_id', b.id)
        .not('status', 'in', '("cancelled","no_show")')
        .lt('starts_at', endsAt)
        .gt('ends_at', startsAt)
        .maybeSingle()

      if (!conflict) { assigned = b.id; break }
    }

    if (!assigned) {
      return { error: 'Ese horario ya fue reservado. Elige otro.' }
    }
    resolvedBarberId = assigned
  } else {
    // Specific barber conflict check
    const { data: conflict } = await admin
      .from('appointments')
      .select('id')
      .eq('barber_id', resolvedBarberId)
      .not('status', 'in', '("cancelled","no_show")')
      .lt('starts_at', endsAt)
      .gt('ends_at', startsAt)
      .maybeSingle()

    if (conflict) {
      return { error: 'Ese horario acaba de ser reservado. Elige otro.' }
    }
  }

  // Service info
  const { data: service } = await admin
    .from('services')
    .select('name, price, duration')
    .eq('id', serviceId)
    .single()

  if (!service) return { error: 'Servicio no encontrado.' }

  // Barber name
  const { data: barber } = await admin
    .from('barbers')
    .select('name')
    .eq('id', resolvedBarberId)
    .single()

  // Upsert client — match by phone + name so different people sharing
  // a phone each get their own record
  let clientId: string | null = null

  const { data: existing } = await admin
    .from('clients')
    .select('id')
    .eq('shop_id', shopId)
    .eq('phone', clientPhone)
    .ilike('full_name', clientName)
    .maybeSingle()

  if (existing) {
    clientId = existing.id
  } else {
    const { data: newClient } = await admin
      .from('clients')
      .insert({ shop_id: shopId, full_name: clientName, phone: clientPhone })
      .select('id')
      .single()
    clientId = newClient?.id ?? null
  }

  // Insert appointment
  const { data: appt, error: insertError } = await admin
    .from('appointments')
    .insert({
      shop_id:       shopId,
      barber_id:     resolvedBarberId,
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
      created_via:   'booking_page',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[bookAppointment]', insertError)
    return { error: 'No se pudo crear la cita. Intenta de nuevo.' }
  }

  // WhatsApp confirmation (best-effort)
  try {
    await sendAppointmentConfirmation({
      phone:       clientPhone,
      shopName:    shop.name,
      clientName,
      barberName:  barber?.name ?? 'Tu barbero',
      serviceName: service.name,
      date:        formatDate(startsAt),
      time:        formatTime(startsAt),
    })
  } catch (e) {
    console.warn('[WhatsApp skipped]', e)
  }

  return {
    success:       true,
    appointmentId: appt?.id,
    shopPhone:     shop.phone ?? undefined,
    shopName:      shop.name,
  }
}
