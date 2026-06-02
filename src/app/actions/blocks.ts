'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Auth helper ───────────────────────────────────────────────

async function getOwnerShopId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { shopId: null, error: 'No autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') {
    return { shopId: null, error: 'Sin permisos.' }
  }

  return { shopId: profile.shop_id as string, error: null }
}

// ── Schema ────────────────────────────────────────────────────

const blockSchema = z.object({
  barber_id:  z.string().uuid().nullable(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  is_full_day: z.boolean(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  reason:     z.string().max(200).optional().nullable(),
})

// ── Actions ───────────────────────────────────────────────────

export async function createBlockAction(formData: FormData) {
  const { shopId, error } = await getOwnerShopId()
  if (!shopId) return { error }

  const isFullDay = formData.get('is_full_day') === 'true'
  const rawBarberId = formData.get('barber_id') as string | null

  const parsed = blockSchema.safeParse({
    barber_id:   rawBarberId === 'all' || !rawBarberId ? null : rawBarberId,
    date:        formData.get('date'),
    is_full_day: isFullDay,
    start_time:  isFullDay ? null : (formData.get('start_time') as string | null),
    end_time:    isFullDay ? null : (formData.get('end_time') as string | null),
    reason:      formData.get('reason') || null,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const data = parsed.data

  // Validate time logic
  if (!data.is_full_day) {
    if (!data.start_time || !data.end_time) {
      return { error: 'Debes especificar hora de inicio y fin.' }
    }
    if (data.start_time >= data.end_time) {
      return { error: 'La hora de fin debe ser posterior a la de inicio.' }
    }
  }

  const admin = createAdminClient()
  const { error: dbError } = await admin.from('barber_blocks').insert({
    shop_id:    shopId,
    barber_id:  data.barber_id,
    date:       data.date,
    is_full_day: data.is_full_day,
    start_time: data.start_time,
    end_time:   data.end_time,
    reason:     data.reason,
  })

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/appointments')
  return { error: null }
}

export async function deleteBlockAction(blockId: string) {
  const { shopId, error } = await getOwnerShopId()
  if (!shopId) return { error }

  const admin = createAdminClient()
  const { error: dbError } = await admin
    .from('barber_blocks')
    .delete()
    .eq('id', blockId)
    .eq('shop_id', shopId)

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/appointments')
  return { error: null }
}
