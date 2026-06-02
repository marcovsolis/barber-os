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

  if (!profile?.shop_id) return { shopId: null, error: 'Barbería no configurada.' }

  return { shopId: profile.shop_id as string, error: null }
}

// ── Schema ────────────────────────────────────────────────────

const clientSchema = z.object({
  full_name: z.string().min(2, 'Nombre muy corto').max(100),
  phone:     z.string().min(7,  'Teléfono inválido').max(20),
  email:     z.string().email('Email inválido').optional().nullable(),
  birthday:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes:     z.string().max(500).optional().nullable(),
})

// ── Update client ─────────────────────────────────────────────

export async function updateClientAction(
  clientId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const { shopId, error } = await getOwnerShopId()
  if (!shopId) return { error }

  const raw = {
    full_name: formData.get('full_name'),
    phone:     formData.get('phone'),
    email:     formData.get('email')    || null,
    birthday:  formData.get('birthday') || null,
    notes:     formData.get('notes')    || null,
  }

  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const admin = createAdminClient()

  // Verify client belongs to this shop
  const { data: existing } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('shop_id', shopId)
    .single()

  if (!existing) return { error: 'Cliente no encontrado.' }

  const { error: dbError } = await admin
    .from('clients')
    .update({
      full_name: parsed.data.full_name,
      phone:     parsed.data.phone,
      email:     parsed.data.email,
      birthday:  parsed.data.birthday,
      notes:     parsed.data.notes,
    })
    .eq('id', clientId)

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/clients')
  return { error: null }
}
