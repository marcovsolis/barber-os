'use client'

import { Clock, User, Scissors } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime, formatCurrency, getStatusLabel, getStatusColor } from '@/lib/utils'
import type { Appointment } from '@/types'

interface AppointmentCardProps {
  appointment: Appointment
  onStatusChange?: (id: string, status: Appointment['status']) => void
  onRegisterPayment?: (appointment: Appointment) => void
  compact?: boolean
}

export function AppointmentCard({
  appointment,
  onStatusChange,
  onRegisterPayment,
  compact = false,
}: AppointmentCardProps) {
  const { id, clientName, clientPhone, serviceName, servicePrice, startsAt, endsAt, status, barber } = appointment
  const isCompleted  = status === 'completed'
  const isInProgress = status === 'in_progress'
  const isPending    = status === 'pending' || status === 'confirmed'

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
        <Badge className={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Badge>
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
        {formatCurrency(servicePrice)}
      </div>

      {/* Actions */}
      {!compact && (
        <div className="mt-3 flex gap-2">
          {isPending && onStatusChange && (
            <Button
              size="sm"
              variant="accent"
              onClick={() => onStatusChange(id, 'in_progress')}
            >
              Iniciar
            </Button>
          )}
          {isInProgress && onStatusChange && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onStatusChange(id, 'completed')}
            >
              Completar
            </Button>
          )}
          {isInProgress && onRegisterPayment && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onRegisterPayment(appointment)}
            >
              Registrar pago
            </Button>
          )}
          {isCompleted && !appointment.payment && onRegisterPayment && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onRegisterPayment(appointment)}
            >
              Registrar pago
            </Button>
          )}
          {isPending && onStatusChange && (
            <Button
              size="sm"
              variant="ghost"
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
