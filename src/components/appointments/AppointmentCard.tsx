'use client'

import { Clock, User, Scissors, Pencil, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime, formatCurrency, getStatusLabel, getStatusColor } from '@/lib/utils'
import type { Appointment } from '@/types'

interface AppointmentCardProps {
  appointment:        Appointment
  onStatusChange?:    (id: string, status: Appointment['status']) => void
  onRegisterPayment?: (appointment: Appointment) => void
  onResendReceipt?:   (appointment: Appointment) => void
  onSendReminder?:    (appointment: Appointment) => void
  onRequestReview?:   (appointment: Appointment) => void
  onEdit?:            (appointment: Appointment) => void
  compact?:           boolean
  currency?:          string
}

export function AppointmentCard({
  appointment,
  onStatusChange,
  onRegisterPayment,
  onResendReceipt,
  onSendReminder,
  onRequestReview,
  onEdit,
  compact = false,
  currency = 'MXN',
}: AppointmentCardProps) {
  const { id, clientName, clientPhone, serviceName, servicePrice, startsAt, endsAt, status, barber } = appointment
  const isCompleted = status === 'completed'
  const isActive    = ['pending', 'confirmed', 'in_progress'].includes(status)
  const isCancellable = status === 'pending' || status === 'confirmed'
  const isEditable  = isActive

  return (
    <div
      className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
      style={barber ? { borderLeftColor: barber.color, borderLeftWidth: 4 } : undefined}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-brand-900 truncate">{clientName}</span>
          {!compact && (
            <span className="text-xs text-gray-400 shrink-0">{clientPhone}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Edit button — only for active appointments */}
          {!compact && isEditable && onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              title="Editar cita"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <Badge className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        </div>
      </div>

      {/* Time & service */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(startsAt)} – {formatTime(endsAt)}
        </span>
        <span className="flex items-center gap-1">
          <Scissors className="h-3.5 w-3.5" />
          {serviceName}
        </span>
        {barber && (
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {barber.name}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mt-2 text-sm font-semibold text-brand-900">
        {formatCurrency(servicePrice, currency)}
      </div>

      {/* Actions */}
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Registrar pago — available for all active appointments */}
          {isActive && onRegisterPayment && (
            <Button size="sm" variant="accent" onClick={() => onRegisterPayment(appointment)}>
              💳 Registrar pago
            </Button>
          )}
          {/* Completed with no payment yet */}
          {isCompleted && !appointment.payment && onRegisterPayment && (
            <Button size="sm" variant="secondary" onClick={() => onRegisterPayment(appointment)}>
              Registrar pago
            </Button>
          )}
          {/* Re-send WhatsApp receipt for completed appointments with payment */}
          {isCompleted && appointment.payment && onResendReceipt && (
            <Button
              size="sm"
              className="bg-[#25D366] text-white hover:bg-[#1ebe5d]"
              onClick={() => onResendReceipt(appointment)}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Reenviar recibo
            </Button>
          )}
          {/* Request review — completed appointments */}
          {isCompleted && onRequestReview && (
            <Button
              size="sm"
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={() => onRequestReview(appointment)}
              title="Pedir reseña al cliente"
            >
              ⭐ Pedir reseña
            </Button>
          )}
          {/* WhatsApp reminder — confirmed/pending appointments */}
          {(status === 'confirmed' || status === 'pending') && onSendReminder && (
            <Button
              size="sm"
              className="bg-[#25D366] text-white hover:bg-[#1ebe5d]"
              onClick={() => onSendReminder(appointment)}
              title="Enviar recordatorio por WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Recordatorio
            </Button>
          )}
          {/* Cancel — only for pending/confirmed */}
          {isCancellable && onStatusChange && (
            <Button
              size="sm" variant="ghost"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onStatusChange(id, 'cancelled')}
            >
              Cancelar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
