import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import type { Appointment } from '@/types'

export const metadata = { title: 'Citas' }

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const today    = new Date()
  const dateStr  = today.toISOString().split('T')[0]

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      barber:barbers(id, name, avatar_url, color),
      service:services(id, name, price, duration)
    `)
    .gte('starts_at', `${dateStr}T00:00:00.000Z`)
    .lte('starts_at', `${dateStr}T23:59:59.999Z`)
    .order('starts_at', { ascending: true })

  const byStatus = {
    active:    (appointments ?? []).filter(a => ['pending','confirmed','in_progress'].includes(a.status)),
    completed: (appointments ?? []).filter(a => a.status === 'completed'),
    cancelled: (appointments ?? []).filter(a => ['cancelled','no_show'].includes(a.status)),
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Citas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(today)}</p>
        </div>
        {/* TODO: Add "Nueva cita" button + modal */}
      </div>

      {/* Active appointments */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Activas ({byStatus.active.length})
        </h2>
        {byStatus.active.length === 0 ? (
          <p className="text-sm text-gray-400">No hay citas activas por ahora.</p>
        ) : (
          <div className="space-y-3">
            {byStatus.active.map(a => (
              <AppointmentCard
                key={a.id}
                appointment={a as unknown as Appointment}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      {byStatus.completed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Completadas ({byStatus.completed.length})
          </h2>
          <div className="space-y-3">
            {byStatus.completed.map(a => (
              <AppointmentCard
                key={a.id}
                appointment={a as unknown as Appointment}
                compact
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
