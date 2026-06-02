import { createAdminClient } from '@/lib/supabase/admin'
import { AdminShopsClient } from './AdminShopsClient'

export const metadata = { title: 'Super Admin — BarberOS' }

export default async function AdminPage() {
  const admin = createAdminClient()

  const { data: shops } = await admin
    .from('shops')
    .select(`
      id, name, slug, country, currency, is_active,
      suspended_reason, suspended_at, created_at,
      profiles(id, full_name, role)
    `)
    .order('created_at', { ascending: false })

  // Appointment + revenue stats per shop
  const { data: apptStats } = await admin
    .from('appointments')
    .select('shop_id, status')

  const { data: payStats } = await admin
    .from('payments')
    .select('shop_id, amount, status')

  const statsByShop = (shops ?? []).map((s: any) => {
    const appts    = (apptStats ?? []).filter((a: any) => a.shop_id === s.id)
    const payments = (payStats  ?? []).filter((p: any) => p.shop_id === s.id && p.status === 'paid')
    const owner    = Array.isArray(s.profiles)
      ? s.profiles.find((p: any) => p.role === 'owner')
      : null

    return {
      id:              s.id,
      name:            s.name,
      slug:            s.slug,
      country:         s.country,
      currency:        s.currency,
      isActive:        s.is_active,
      suspendedReason: s.suspended_reason,
      suspendedAt:     s.suspended_at,
      createdAt:       s.created_at,
      ownerName:       owner?.full_name ?? '—',
      totalAppts:      appts.length,
      totalRevenue:    payments.reduce((s: number, p: any) => s + Number(p.amount), 0),
    }
  })

  return <AdminShopsClient shops={statsByShop} />
}
