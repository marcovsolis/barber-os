import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client using the service_role key.
 * Bypasses Row Level Security — use only in trusted server-side code
 * where auth has already been verified via the regular client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
