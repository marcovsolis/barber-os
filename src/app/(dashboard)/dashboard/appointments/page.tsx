import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import { getShop } from '@/lib/shop'
import { AppointmentsClient } from '@/components/appointments/AppointmentsClient'
import { PendingReminders, type PendingReminder } from '@/components/appointments/PendingReminders'
import type { Appointment, Barber, Service } from '@/types'

export const metadata = { title: 'Citas' }

interface Props {
  searchParams: Promise<{ date?: string }>
}

/** Map Supabase snake_case row → camelCase Appointment type */
function mapAppointment(row: any): Appointment {
  return {
    id:           row.id,
    shopId:       row.shop_id,
    barberId:     row.barber_id,
    clientId:     row.client_id,
    serviceId:    row.service_id,
    clientName:   row.client_name,
    clientPhone:  row.client_phone,
    serviceName:  row.service_name,
    servicePrice: row.service_price,
    duration:     row.duration,
    startsAt:     row.starts_at,
    endsAt:       row.ends_at,
    status:       row.status,
    notes:        row.notes,
    createdVia:   row.created_via,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
    barber:       row.barber  ?? undefined,
    payment:      row.payment ?? undefined,
  }
}

export default async function AppointmentsPage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams

  const supabase = await createClient()
  const admin    = createAdminClient()
  const shop     = await getShop()
  const currency = shop?.currency ?? 'MXN'

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user!.id)
    .single()

  if (!profile?.shop_id) redirect('/onboarding')

  const shopId    = profile.shop_id
  const userRole  = profile.role as string  // 'owner' | 'barber'

  // If the logged-in user is a barber, get their barber record to filter appointments
  let barberIdFilter: string | null = null
  if (userRole === 'barber') {
    const { data: barberRecord } = await admin
      .from('barbers')
      .select('id')
      .eq('shop_id', shopId)
      .eq('profile_id', user!.id)
      .single()
    barberIdFilter = barberRecord?.id ?? null
  }

  // Resolve date: use param if valid YYYY-MM-DD, else today
  const todayStr = new Date().toISOString().split('T')[0]
  const dateStr  = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? '') ? dateParam! : todayStr
  const dateObj  = new Date(`${dateStr}T12:00:00`)   // noon to avoid TZ edge cases

  const [
    { data: appointments },
    { data: barbers },
    { data: services },
    { data: blocksRaw },
    { data: remindersRaw },
  ] = await Promise.all([
    (() => {
      let q = admin
        .from('appointments')
        .select(`
          *,
          barber:barbers(id, name, avatar_url, color),
          payment:payments(id, amount, discount_amount)
        `)
        .eq('shop_id', shopId)
        .gte('starts_at', `${dateStr}T00:00:00.000Z`)
        .lte('starts_at', `${dateStr}T23:59:59.999Z`)
        .order('starts_at', { ascending: true })
      if (barberIdFilter) q = q.eq('barber_id', barberIdFilter)
      return q
    })(),

    admin
      .from('barbers')
      .select('id, name, color')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('name'),

    admin
      .from('services')
      .select('id, name, price, duration')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('price'),

    admin
      .from('barber_blocks')
      .select('id, barber_id, date, is_full_day, start_time, end_time, reason')
      .eq('shop_id', shopId)
      .eq('date', dateStr)
      .order('date', { ascending: true }),

    // Pending reminders (status=pending, for appointments in the next 24h)
    admin
      .from('appointment_reminders')
      .select(`
        id, type, wa_link, scheduled_for,
        appointments(client_name, client_phone, service_name, starts_at, barbers(name))
      `)
      .eq('shop_id', shopId)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true }),
  ])

  const blocks = (blocksRaw ?? []).map((b: any) => ({
    id:        b.id        as string,
    barberId:  b.barber_id as string | null,
    date:      b.date      as string,
    isFullDay: b.is_full_day as boolean,
    startTime: b.start_time ? (b.start_time as string).slice(0, 5) : null,
    endTime:   b.end_time   ? (b.end_time   as string).slice(0, 5) : null,
    reason:    b.reason     as string | null,
  }))

  const pendingReminders: PendingReminder[] = (remindersRaw ?? []).map((r: any) => {
    const appt   = Array.isArray(r.appointments) ? r.appointments[0] : r.appointments
    const barber = Array.isArray(appt?.barbers)  ? appt.barbers[0]  : appt?.barbers
    return {
      id:          r.id,
      type:        r.type as '24h' | '30min',
      clientName:  appt?.client_name  ?? '—',
      clientPhone: appt?.client_phone ?? '',
      serviceName: appt?.service_name ?? '—',
      barberName:  barber?.name ?? null,
      startsAt:    appt?.starts_at    ?? '',
      waLink:      r.wa_link          ?? '',
    }
  })

  return (
    <div className="p-6">
      {pendingReminders.length > 0 && (
        <PendingReminders reminders={pendingReminders} />
      )}
      <AppointmentsClient
        appointments={(appointments ?? []).map(mapAppointment)}
        barbers={(barbers ?? []) as Pick<Barber, 'id' | 'name' | 'color'>[]}
        services={(services ?? []) as Pick<Service, 'id' | 'name' | 'price' | 'duration'>[]}
        dateLabel={formatDate(dateObj)}
        dateStr={dateStr}
        todayStr={todayStr}
        currency={currency}
        shopName={shop?.name ?? ''}
        blocks={blocks}
      />
    </div>
  )
}
