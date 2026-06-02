'use client'

import { useState, useTransition } from 'react'
import { X, Lock, AlertCircle } from 'lucide-react'
import { createBlockAction } from '@/app/actions/blocks'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────

interface Barber {
  id:   string
  name: string
}

interface BlockModalProps {
  isOpen:   boolean
  onClose:  () => void
  barbers:  Barber[]
  /** Pre-fill date (YYYY-MM-DD) */
  defaultDate?: string
}

// ── Time options ─────────────────────────────────────────────

function buildTimeOptions(): { label: string; value: string }[] {
  const opts: { label: string; value: string }[] = []
  for (let h = 7; h <= 21; h++) {
    for (const m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      opts.push({ label: `${hh}:${mm}`, value: `${hh}:${mm}` })
    }
  }
  return opts
}

const TIME_OPTIONS = buildTimeOptions()

// ── Component ────────────────────────────────────────────────

export function BlockModal({ isOpen, onClose, barbers, defaultDate }: BlockModalProps) {
  const today = new Date().toISOString().split('T')[0]

  const [barberId,   setBarberId]   = useState<string>('all')
  const [date,       setDate]       = useState(defaultDate ?? today)
  const [isFullDay,  setIsFullDay]  = useState(true)
  const [startTime,  setStartTime]  = useState('09:00')
  const [endTime,    setEndTime]    = useState('18:00')
  const [reason,     setReason]     = useState('')
  const [error,      setError]      = useState<string | null>(null)
  const [isPending,  startTransition] = useTransition()

  if (!isOpen) return null

  function handleClose() {
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!date) { setError('Selecciona una fecha.'); return }
    if (!isFullDay && startTime >= endTime) {
      setError('La hora de fin debe ser posterior a la de inicio.')
      return
    }

    const fd = new FormData()
    fd.set('barber_id',   barberId)
    fd.set('date',        date)
    fd.set('is_full_day', String(isFullDay))
    fd.set('start_time',  isFullDay ? '' : startTime)
    fd.set('end_time',    isFullDay ? '' : endTime)
    fd.set('reason',      reason)

    startTransition(async () => {
      const result = await createBlockAction(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        handleClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <Lock className="h-4 w-4 text-accent" />
            </div>
            <h2 className="font-semibold text-brand-900">Bloquear horario</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Barber */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Barbero
            </label>
            <select
              value={barberId}
              onChange={e => setBarberId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="all">Todos los barberos</option>
              {barbers.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Full day toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Tipo de bloqueo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsFullDay(true)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  isFullDay
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                Día completo
              </button>
              <button
                type="button"
                onClick={() => setIsFullDay(false)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  !isFullDay
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                Rango de horas
              </button>
            </div>
          </div>

          {/* Time range (only if not full day) */}
          {!isFullDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Hora inicio
                </label>
                <select
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {TIME_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Hora fin
                </label>
                <select
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {TIME_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Motivo <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Feriado, vacaciones, reunión…"
              maxLength={200}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent/90 text-white"
              disabled={isPending}
            >
              {isPending ? 'Guardando…' : 'Bloquear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
