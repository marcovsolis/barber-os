import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch shop currency + user role for sidebar
  let currency = 'MXN'
  let role     = 'owner'
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('shop_id, role')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? 'owner'
    if (profile?.shop_id) {
      const { data: shop } = await admin
        .from('shops')
        .select('currency, is_active')
        .eq('id', profile.shop_id)
        .single()

      // Suspended shops → redirect to a suspended notice
      if (shop && !shop.is_active) redirect('/suspended')

      currency = shop?.currency ?? 'MXN'
    }
  } catch { /* keep default */ }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currency={currency} role={role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
