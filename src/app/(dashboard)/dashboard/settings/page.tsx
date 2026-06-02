import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SettingsClient } from '@/components/settings/SettingsClient'

export const metadata = { title: 'Ajustes' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Use admin client to bypass RLS for all settings reads
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id, shops(*)')
    .eq('id', user!.id)
    .single()

  if (!profile?.shop_id) redirect('/onboarding')
  const shopId = profile.shop_id
  const shop   = (profile.shops as any)

  const [{ data: barbers }, { data: services }] = await Promise.all([
    admin
      .from('barbers')
      .select('*, barber_schedules(*)')
      .eq('shop_id', shopId)
      .order('name'),
    admin
      .from('services')
      .select('*')
      .eq('shop_id', shopId)
      .order('price'),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-brand-900 mb-6">Ajustes</h1>
      <SettingsClient
        shop={shop}
        barbers={barbers ?? []}
        services={services ?? []}
      />
    </div>
  )
}
