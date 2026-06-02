'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    throw new Error('Unauthorized')
  }
  return createAdminClient()
}

export async function suspendShopAction(shopId: string, reason: string) {
  const admin = await assertSuperAdmin()
  await admin
    .from('shops')
    .update({
      is_active:        false,
      suspended_reason: reason || 'Suspendido por administrador',
      suspended_at:     new Date().toISOString(),
    })
    .eq('id', shopId)
  revalidatePath('/admin')
}

export async function reactivateShopAction(shopId: string) {
  const admin = await assertSuperAdmin()
  await admin
    .from('shops')
    .update({ is_active: true, suspended_reason: null, suspended_at: null })
    .eq('id', shopId)
  revalidatePath('/admin')
}
