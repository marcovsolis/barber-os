import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getShop } from '@/lib/shop'
import { ClientsClient } from '@/components/clients/ClientsClient'

export const metadata = { title: 'Clientes' }

export interface ClientWithStats {
  id:          string
  fullName:    string
  phone:       string
  email:       string | null
  birthday:    string | null
  notes:       string | null
  createdAt:   string
  lastVisitAt: string | null
  visitCount:  number
  totalSpent:  number
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const admin    = createAdminClient()
  const shop     = await getShop()
  const currency = shop?.currency ?? 'MXN'

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id')
    .eq('id', user!.id)
    .single()

  if (!profile?.shop_id) redirect('/onboarding')
  const shopId = profile.shop_id

  // Fetch barber names to exclude from client list.
  // We filter ONLY by exact name match — NOT by phone — because multiple
  // real clients can share a phone number used during testing.
  const { data: barbersRaw } = await admin
    .from('barbers')
    .select('name')
    .eq('shop_id', shopId)

  const barberNames = new Set(
    (barbersRaw ?? []).map((b: any) => (b.name as string).toLowerCase().trim())
  )

  // Fetch clients
  const { data: rawClients } = await admin
    .from('clients')
    .select('id, full_name, phone, email, birthday, notes, created_at, last_visit_at')
    .eq('shop_id', shopId)
    .order('full_name', { ascending: true })

  // Fetch aggregated stats per client (visit count + total paid)
  const { data: rawStats } = await admin
    .from('appointments')
    .select('client_id, payments(amount, status)')
    .eq('shop_id', shopId)
    .not('status', 'in', '("cancelled","no_show")')
    .not('client_id', 'is', null)

  // Build stats map
  const statsMap: Record<string, { visits: number; spent: number }> = {}
  for (const appt of rawStats ?? []) {
    const cid = appt.client_id as string
    if (!cid) continue
    if (!statsMap[cid]) statsMap[cid] = { visits: 0, spent: 0 }
    statsMap[cid].visits += 1
    const payments = Array.isArray(appt.payments) ? appt.payments : (appt.payments ? [appt.payments] : [])
    for (const p of payments) {
      if ((p as any).status === 'paid') {
        statsMap[cid].spent += Number((p as any).amount ?? 0)
      }
    }
  }

  const clients: ClientWithStats[] = (rawClients ?? [])
  // Exclude anyone whose phone matches a staff profile (owner/barber)
  // Only exclude clients whose name exactly matches a barber name
  .filter((c: any) => !barberNames.has((c.full_name as string).toLowerCase().trim()))
  .map((c: any) => ({
    id:          c.id,
    fullName:    c.full_name,
    phone:       c.phone,
    email:       c.email    ?? null,
    birthday:    c.birthday ?? null,
    notes:       c.notes    ?? null,
    createdAt:   c.created_at,
    lastVisitAt: c.last_visit_at ?? null,
    visitCount:  statsMap[c.id]?.visits ?? 0,
    totalSpent:  statsMap[c.id]?.spent  ?? 0,
  }))

  return (
    <div className="p-6">
      <ClientsClient clients={clients} currency={currency} />
    </div>
  )
}
