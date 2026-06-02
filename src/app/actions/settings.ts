'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Shared auth helper ────────────────────────────────────────

async function getOwnerShopId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { shopId: null, supabase, error: 'No autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') {
    return { shopId: null, supabase, error: 'Sin permisos.' }
  }

  return { shopId: profile.shop_id as string, supabase, error: null }
}

// ── Barbers ───────────────────────────────────────────────────

const barberSchema = z.object({
  name:           z.string().min(2, 'Mínimo 2 caracteres'),
  bio:            z.string().optional(),
  color:          z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#4f6ef7'),
  avatar_url:     z.string().url('URL inválida').optional().or(z.literal('')),
  commission_pct: z.coerce.number().int().min(0).max(100).default(50),
})

export type SettingsState = { error?: string; success?: boolean }

export async function upsertBarberAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { shopId, supabase, error } = await getOwnerShopId()
  if (error || !shopId) return { error: error! }

  const id = formData.get('id') as string | null

  const parsed = barberSchema.safeParse({
    name:           formData.get('name'),
    bio:            formData.get('bio') || undefined,
    color:          formData.get('color') || '#4f6ef7',
    avatar_url:     formData.get('avatar_url') || undefined,
    commission_pct: formData.get('commission_pct') ?? 50,
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.name?.[0] ?? 'Datos inválidos.' }
  }

  if (id) {
    const { error: err } = await supabase
      .from('barbers')
      .update({ ...parsed.data })
      .eq('id', id)
      .eq('shop_id', shopId)
    if (err) return { error: 'No se pudo actualizar.' }
  } else {
    const { error: err } = await supabase
      .from('barbers')
      .insert({ shop_id: shopId, ...parsed.data })
    if (err) return { error: 'No se pudo crear el barbero.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function toggleBarberAction(id: string, isActive: boolean) {
  const { shopId, supabase, error } = await getOwnerShopId()
  if (error || !shopId) return { error }

  await supabase.from('barbers').update({ is_active: isActive }).eq('id', id).eq('shop_id', shopId)
  revalidatePath('/dashboard/settings')
}

export async function deleteBarberAction(id: string): Promise<{ error?: string }> {
  const { shopId, error } = await getOwnerShopId()
  if (error || !shopId) return { error: error! }

  const admin = createAdminClient()

  // Check if the barber has any non-cancelled appointments
  const { count } = await admin
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('barber_id', id)
    .not('status', 'in', '("cancelled","no_show")')

  if (count && count > 0) {
    return { error: `Este barbero tiene ${count} cita(s) activa(s). Desactívalo en lugar de eliminarlo.` }
  }

  // Delete all their appointments (cancelled/no_show only at this point)
  await admin.from('appointments').delete().eq('barber_id', id)
  // Schedules cascade automatically (ON DELETE CASCADE)
  const { error: err } = await admin
    .from('barbers')
    .delete()
    .eq('id', id)
    .eq('shop_id', shopId)

  if (err) return { error: 'No se pudo eliminar el barbero.' }
  revalidatePath('/dashboard/settings')
  return {}
}

// ── Services ──────────────────────────────────────────────────

const serviceSchema = z.object({
  name:        z.string().min(2, 'Mínimo 2 caracteres'),
  price:       z.coerce.number().positive('Precio inválido'),
  duration:    z.coerce.number().int().positive('Duración inválida'),
  break_after: z.coerce.number().int().min(0).default(0),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#e94560'),
  description: z.string().optional(),
})

export async function upsertServiceAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { shopId, supabase, error } = await getOwnerShopId()
  if (error || !shopId) return { error: error! }

  const id = formData.get('id') as string | null

  const parsed = serviceSchema.safeParse({
    name:        formData.get('name'),
    price:       formData.get('price'),
    duration:    formData.get('duration'),
    break_after: formData.get('break_after') || '0',
    color:       formData.get('color') || '#e94560',
    description: formData.get('description') || undefined,
  })
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: first ?? 'Datos inválidos.' }
  }

  if (id) {
    const { error: err } = await supabase
      .from('services')
      .update({ ...parsed.data })
      .eq('id', id)
      .eq('shop_id', shopId)
    if (err) return { error: 'No se pudo actualizar.' }
  } else {
    const { error: err } = await supabase
      .from('services')
      .insert({ shop_id: shopId, ...parsed.data })
    if (err) return { error: 'No se pudo crear el servicio.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function duplicateServiceAction(id: string): Promise<SettingsState> {
  const { shopId, supabase, error } = await getOwnerShopId()
  if (error || !shopId) return { error: error! }

  // Fetch original
  const { data: orig } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('shop_id', shopId)
    .single()

  if (!orig) return { error: 'Servicio no encontrado.' }

  const { error: err } = await supabase
    .from('services')
    .insert({
      shop_id:     shopId,
      name:        `${orig.name} (copia)`,
      description: orig.description,
      price:       orig.price,
      duration:    orig.duration,
      break_after: orig.break_after ?? 0,
      color:       orig.color,
      is_active:   false,   // start inactive so owner reviews before activating
    })

  if (err) return { error: 'No se pudo duplicar el servicio.' }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function toggleServiceAction(id: string, isActive: boolean) {
  const { shopId, supabase, error } = await getOwnerShopId()
  if (error || !shopId) return { error }

  await supabase.from('services').update({ is_active: isActive }).eq('id', id).eq('shop_id', shopId)
  revalidatePath('/dashboard/settings')
}

// ── Barber schedules ─────────────────────────────────────────

export async function upsertScheduleAction(
  barberId:   string,
  dayOfWeek:  number,
  startTime:  string,
  endTime:    string,
  isActive:   boolean
) {
  const { shopId, error } = await getOwnerShopId()
  if (error || !shopId) return { error }

  const admin = createAdminClient()
  await admin
    .from('barber_schedules')
    .upsert(
      { barber_id: barberId, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, is_active: isActive },
      { onConflict: 'barber_id,day_of_week' }
    )

  revalidatePath('/dashboard/settings')
}

/** Save all 7 days at once for a barber */
export async function upsertAllSchedulesAction(
  barberId: string,
  schedules: { day: number; start: string; end: string; active: boolean }[]
): Promise<{ error?: string }> {
  const { shopId, error } = await getOwnerShopId()
  if (error || !shopId) return { error: error! }

  const admin = createAdminClient()
  const rows = schedules.map(s => ({
    barber_id:   barberId,
    day_of_week: s.day,
    start_time:  s.start,
    end_time:    s.end,
    is_active:   s.active,
  }))

  const { error: err } = await admin
    .from('barber_schedules')
    .upsert(rows, { onConflict: 'barber_id,day_of_week' })

  if (err) return { error: 'No se pudo guardar el horario.' }
  revalidatePath('/dashboard/settings')
  return {}
}

// ── Shop info ─────────────────────────────────────────────────

export async function updateShopAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { shopId, supabase, error } = await getOwnerShopId()
  if (error || !shopId) return { error: error! }

  // brand_color: radio preset takes precedence over custom color picker
  const brandColorRadio  = formData.get('brand_color')        as string | null
  const brandColorCustom = formData.get('brand_color_custom') as string | null
  const brandColor = brandColorRadio || brandColorCustom || '#e94560'

  const { error: err } = await supabase
    .from('shops')
    .update({
      name:        formData.get('name')        as string,
      phone:       formData.get('phone')       as string || null,
      address:     formData.get('address')     as string || null,
      city:        formData.get('city')        as string || null,
      description: formData.get('description') as string || null,
      logo_url:             formData.get('logo_url')            as string || null,
      brand_color:          brandColor,
      country:              formData.get('country')             as string || null,
      currency:             formData.get('currency')            as string || null,
      timezone:             formData.get('timezone')            as string || null,
      whatsapp_api_key:     formData.get('whatsapp_api_key')    as string || null,
      whatsapp_phone_id:    formData.get('whatsapp_phone_id')   as string || null,
    })
    .eq('id', shopId)

  if (err) return { error: 'No se pudo actualizar la información.' }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ── Invite barber (creates auth account + links to barber record) ──────────

export async function inviteBarberAction(
  barberId: string,
  email:    string
): Promise<SettingsState> {
  const { shopId, error } = await getOwnerShopId()
  if (error || !shopId) return { error: error! }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Email inválido.' }
  }

  const admin = createAdminClient()

  // Verify barber belongs to this shop
  const { data: barber } = await admin
    .from('barbers')
    .select('id, name, profile_id')
    .eq('id', barberId)
    .eq('shop_id', shopId)
    .single()

  if (!barber) return { error: 'Barbero no encontrado.' }
  if (barber.profile_id) return { error: 'Este barbero ya tiene una cuenta activa.' }

  // Create Supabase auth user (they receive a magic-link / password reset email)
  const { data: authData, error: authErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: barber.name },
  })

  if (authErr) return { error: authErr.message }

  const newUserId = authData.user.id

  // Create profile linked to shop as barber role
  const { error: profileErr } = await admin
    .from('profiles')
    .insert({
      id:        newUserId,
      shop_id:   shopId,
      role:      'barber',
      full_name: barber.name,
    })

  if (profileErr) return { error: 'Cuenta creada pero no se pudo crear el perfil.' }

  // Link the barber record to the new profile
  await admin.from('barbers').update({ profile_id: newUserId }).eq('id', barberId)

  revalidatePath('/dashboard/settings')
  return { success: true }
}
