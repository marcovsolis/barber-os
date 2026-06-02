'use client'

import { useState, useTransition } from 'react'
import { Plus, Lock, Trash2, Clock, ChevronLeft, ChevronRight, CalendarDays, Search, X as XIcon } from 'lucide-react'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { NewAppointmentModal } from './NewAppointmentModal'
import { EditAppointmentModal } from './EditAppointmentModal'
import { AppointmentCard } from './AppointmentCard'
import { BlockModal } from './BlockModal'
import { PaymentModal } from '@/components/payments/PaymentModal'
import { Button } from '@/components/ui/button'
import { updateAppointmentStatusAction } from '@/app/actions/appointments'
import { deleteBlockAction } from '@/app/actions/blocks'
import type { Appointment, Barber, Service } from '@/types'

// ── Block type (passed from server) ──────────────────────────

export interface BlockEntry {
  id:        string
  barberId:  string | null
  date:      string
  isFullDay: boolean
  startTime: string | null
  endTime:   string | null
  reason:    string | null
}

interface AppointmentsClientProps {
  appointments: Appointment[]
  barbers:      Pick<Barber,  'id' | 'name' | 'color'>[]
  services:     Pick<Service, 'id' | 'name' | 'price' | 'duration'>[]
  dateLabel:    string
  dateStr:      string   // YYYY-MM-DD currently shown
  todayStr:     string   // YYYY-MM-DD of today
  currency?:    string
  shopName?:    string
  blocks?:      BlockEntry[]
}

// helper: offset a YYYY-MM-DD string by N days
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function AppointmentsClient({
  appointments, barbers, services, dateLabel,
  dateStr, todayStr,
  currency = 'MXN', shopName = '', blocks = [],
}: AppointmentsClientProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen]           = useState(false)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [paymentAppt, setPaymentAppt]       = useState<Appointment | null>(null)
  const [editingAppt, setEditingAppt]       = useState<Appointment | null>(null)
  const [isPending, startTransition]        = useTransition()
  const [search, setSearch]                 = useState('')

  const goToDate = (d: string) => router.push(`/dashboard/appointments?date=${d}`)
  const isToday  = dateStr === todayStr

  // ── Client search filter ──────────────────────────────────
  const filterAppts = (list: Appointment[]) => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(a =>
      a.clientName.toLowerCase().includes(q) ||
      a.clientPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    )
  }

  // ── Handlers ─────────────────────────────────────────────

  const handleResendReceipt = (appt: Appointment) => {
    const phone    = appt.clientPhone.replace(/\D/g, '')
    const payment  = appt.payment as any
    const amount   = payment?.amount   ?? appt.servicePrice
    const discount = payment?.discount_amount ?? 0
    const lines = [
      `*Recibo de ${shopName || 'la barbería'}*`,
      '',
      `Servicio: ${appt.serviceName}`,
      ...(discount > 0 ? [`Descuento: -${formatCurrency(discount, currency)}`] : []),
      `Total: *${formatCurrency(amount, currency)}*`,
      '',
      'Gracias por tu visita!',
    ]
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')
  }

  const handleStatusChange = (id: string, status: Appointment['status']) => {
    startTransition(async () => {
      const { error } = await updateAppointmentStatusAction(id, status as any)
      if (error) toast.error('No se pudo actualizar la cita.')
      else {
        const labels: Record<string, string> = {
          in_progress: 'Cita iniciada',
          completed:   'Cita completada ✓',
          cancelled:   'Cita cancelada',
        }
        toast.success(labels[status] ?? 'Estado actualizado')
      }
    })
  }

  const handleRequestReview = (appt: Appointment) => {
    const phone = appt.clientPhone.replace(/\D/g, '')
    const lines = [
      `Hola ${appt.clientName} 👋`,
      '',
      `Gracias por visitarnos en *${shopName || 'nuestra barbería'}* y elegir el servicio de *${appt.serviceName}*.`,
      '',
      'Nos encantaría saber cómo fue tu experiencia. ¿Podrías dejarnos una reseña? Tu opinión nos ayuda a mejorar y a que más clientes nos encuentren. 🙏',
      '',
      '⭐ Si usas Google, búscanos y deja tu reseña aquí.',
    ]
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')
  }

  const handleSendReminder = (appt: Appointment) => {
    const phone = appt.clientPhone.replace(/\D/g, '')
    const date  = new Date(appt.startsAt).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const time  = new Date(appt.startsAt).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit',
    })
    const barberName = appt.barber?.name ?? 'tu barbero'
    const lines = [
      `Hola ${appt.clientName} 👋`,
      '',
      `Te recordamos que tienes una cita el *${date}* a las *${time}* con *${barberName}*.`,
      `Servicio: ${appt.serviceName}`,
      '',
      'Si necesitas cancelar o reprogramar, comunícate con nosotros.',
    ]
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')
  }

  const handleDeleteBlock = (blockId: string) => {
    startTransition(async () => {
      const { error } = await deleteBlockAction(blockId)
      if (error) toast.error('No se pudo eliminar el bloqueo.')
      else toast.success('Bloqueo eliminado')
    })
  }

  // ── Grouping (with search filter applied) ────────────────

  const byStatus = {
    active:    filterAppts(appointments.filter(a => ['pending', 'confirmed', 'in_progress'].includes(a.status))),
    completed: filterAppts(appointments.filter(a => a.status === 'completed')),
    cancelled: filterAppts(appointments.filter(a => ['cancelled', 'no_show'].includes(a.status))),
  }

  // Blocks for the displayed date
  const todayBlocks = blocks.filter(b => b.date === dateStr)

  // Helper: barber name from barbers list
  const barberName = (id: string | null) =>
    id ? (barbers.find(b => b.id === id)?.name ?? 'Barbero') : 'Todos los barberos'

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            Citas
            <HelpTooltip text="Gestiona todas las citas del día. Navega entre fechas, crea nuevas citas, edita o cancela las existentes. También puedes bloquear horarios para que no se reserven." />
          </h1>
          {/* Date navigation */}
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => goToDate(shiftDate(dateStr, -1))}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-900 transition-colors"
              title="Día anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 font-medium px-1 min-w-[140px] text-center">
              {dateLabel}
            </span>
            <button
              onClick={() => goToDate(shiftDate(dateStr, 1))}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-900 transition-colors"
              title="Día siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {!isToday && (
              <button
                onClick={() => goToDate(todayStr)}
                className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-accent border border-accent/30 hover:bg-accent/5 transition-colors"
              >
                <CalendarDays className="h-3 w-3" /> Hoy
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={() => setBlockModalOpen(true)}
          >
            <Lock className="h-4 w-4" /> Bloquear horario
          </Button>
          <Button variant="accent" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva cita
          </Button>
        </div>
      </div>

      {/* Client search filter */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Blocks banner (today) */}
      {todayBlocks.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Horarios bloqueados hoy ({todayBlocks.length})
          </h2>
          <div className="space-y-2">
            {todayBlocks.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Lock className="h-4 w-4 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-900 truncate">
                      {barberName(b.barberId)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      {b.isFullDay ? (
                        'Día completo bloqueado'
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          {b.startTime} – {b.endTime}
                        </>
                      )}
                      {b.reason && ` · ${b.reason}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBlock(b.id)}
                  disabled={isPending}
                  title="Eliminar bloqueo"
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active appointments */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Activas ({byStatus.active.length})
        </h2>
        {byStatus.active.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
            <p className="text-sm text-gray-400">No hay citas activas.</p>
            <button
              className="mt-2 text-xs text-accent underline"
              onClick={() => setModalOpen(true)}
            >
              Agregar la primera
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {byStatus.active.map(a => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                onStatusChange={handleStatusChange}
                onRegisterPayment={setPaymentAppt}
                onSendReminder={handleSendReminder}
                onEdit={setEditingAppt}
                currency={currency}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      {byStatus.completed.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Completadas ({byStatus.completed.length})
          </h2>
          <div className="space-y-3">
            {byStatus.completed.map(a => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                onResendReceipt={handleResendReceipt}
                onRequestReview={handleRequestReview}
                currency={currency}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cancelled */}
      {byStatus.cancelled.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Canceladas / No asistió ({byStatus.cancelled.length})
          </h2>
          <div className="space-y-3">
            {byStatus.cancelled.map(a => (
              <AppointmentCard key={a.id} appointment={a} compact />
            ))}
          </div>
        </section>
      )}

      {/* Payment modal */}
      <PaymentModal
        appointment={paymentAppt}
        onClose={() => setPaymentAppt(null)}
        currency={currency}
      />

      {/* New appointment modal */}
      <NewAppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        barbers={barbers}
        services={services}
        currency={currency}
      />

      {/* Edit appointment modal */}
      <EditAppointmentModal
        appointment={editingAppt}
        onClose={() => setEditingAppt(null)}
        barbers={barbers}
        services={services}
        currency={currency}
      />

      {/* Block modal */}
      <BlockModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        barbers={barbers}
        defaultDate={dateStr}
      />
    </>
  )
}
