import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Returns the authenticated user's shop data.
 * Uses the admin client to bypass RLS — auth is verified first via createClient().
 */
export async function getShop() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('shops(id, name, currency, timezone, slug)')
    .eq('id', user.id)
    .single()

  return (data?.shops as any) ?? null
}
