'use client'

import { useState, useActionState, useEffect, useTransition } from 'react'
import { X, ChevronRight, ChevronLeft, Clock, User, Scissors, CalendarDays, Loader2 } from 'lucide-react'
import { createAppointmentAction, getAvailableSlotsAction } from '@/app/actions/appointments'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/form-field'
import { cn, formatCurrency } from '@/lib/utils'
import type { TimeSlot } from '@/lib/slots'
import type { Barber, Service } from '@/types'

// ── Props ────────────────────────────────────────────────────

interface NewAppointmentModalProps {
  isOpen:    boolean
  onClose:   () => void
  barbers:   Pick<Barber,  'id' | 'name' | 'color'>[]
  services:  Pick<Service, 'id' | 'name' | 'price' | 'duration'>[]
  currency?: string
}

// ── Step 1 — Barber + Service + Date ─────────────────────────

interface Step1Data {
  barberId:  string
  serviceId: string
  date:      string
}

function Step1({
  barbers, services, data, onChange, onNext, currency,
}: {
  barbers:   NewAppointmentModalProps['barbers']
  services:  NewAppointmentModalProps['services']
  data:      Step1Data
  onChange:  (d: Partial<Step1Data>) => void
  onNext:    () => void
  currency?: string
}) {
  const today = new Date().toISOString().split('T')[0]
  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!data.barberId)  e.barberId  = 'Selecciona un barbero'
    if (!data.serviceId) e.serviceId = 'Selecciona un servicio'
    if (!data.date)      e.date      = 'Selecciona una fecha'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="space-y-5">
      {/* Barbers */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Barbero</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {barbers.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange({ barberId: b.id })}
              className={cn(
                'flex flex-col items-center rounded-xl border-2 p-3 text-center transition',
                data.barberId === b.id
                  ? 'border-accent bg-red-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div
                className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: b.color }}
              >
                {b.name[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium text-gray-800 leading-tight">{b.name}</span>
            </button>
          ))}
        </div>
        {errors.barberId && <p className="mt-1 text-xs text-red-500">{errors.barberId}</p>}
      </div>

      {/* Services */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Servicio</p>
        <div className="space-y-2">
          {services.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange({ serviceId: s.id })}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border-2 px-4 py-2.5 text-left transition',
                data.serviceId === s.id
                  ? 'border-accent bg-red-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400">{s.duration} min</p>
              </div>
              <span className="text-sm font-bold text-brand-900">
                {formatCurrency(s.price, currency)}
              </span>
            </button>
          ))}
        </div>
        {errors.serviceId && <p className="mt-1 text-xs text-red-500">{errors.serviceId}</p>}
      </div>

      {/* Date */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Fecha</p>
        <input
          type="date"
          min={today}
          value={data.date}
          onChange={e => onChange({ date: e.target.value })}
          className={cn(
            'w-full rounded-xl border-2 px-3 py-2.5 text-sm transition',
            'focus:border-accent focus:outline-none',
            errors.date ? 'border-red-400' : 'border-gray-200'
          )}
        />
        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
      </div>

      <Button className="w-full" onClick={() => validate() && onNext()}>
        Ver horarios disponibles <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ── Step 2 — Time slots ───────────────────────────────────────

function Step2({
  barberId, serviceId, date, barbers, services,
  selectedSlot, onSelect, onNext, onBack,
}: {
  barberId:     string
  serviceId:    string
  date:         string
  barbers:      NewAppointmentModalProps['barbers']
  services:     NewAppointmentModalProps['services']
  selectedSlot: TimeSlot | null
  onSelect:     (slot: TimeSlot) => void
  onNext:       () => void
  onBack:       () => void
}) {
  const [slots, setSlots]   = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [slotError, setSlotError] = useState('')

  const barber  = barbers.find(b => b.id === barberId)
  const service = services.find(s => s.id === serviceId)

  useEffect(() => {
    setLoading(true)
    setSlotError('')
    getAvailableSlotsAction(barberId, serviceId, date).then(({ slots: s, error }) => {
      if (error) setSlotError(error)
      else setSlots(s)
      setLoading(false)
    })
  }, [barberId, serviceId, date])

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
        {barber && (
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> {barber.name}
          </span>
        )}
        {service && (
          <span className="flex items-center gap-1">
            <Scissors className="h-3.5 w-3.5" /> {service.name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(`${date}T12:00:00`).toLocaleDateString('es-MX', {
            weekday: 'long', day: 'numeric', month: 'long'
          })}
        </span>
      </div>

      {/* Slots grid */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Elige un horario</p>

        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Cargando horarios...
          </div>
        )}

        {!loading && slotError && (
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
            {slotError}
          </div>
        )}

        {!loading && !slotError && slots.length === 0 && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            No hay horarios disponibles para este día.
            <br />
            <button type="button" onClick={onBack} className="mt-2 text-accent underline text-xs">
              Cambiar fecha
            </button>
          </div>
        )}

        {!loading && slots.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {slots.map(slot => (
              <button
                key={slot.startsAt}
                type="button"
                onClick={() => onSelect(slot)}
                className={cn(
                  'rounded-lg border-2 py-2 text-sm font-semibold transition',
                  selectedSlot?.startsAt === slot.startsAt
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-200 text-gray-700 hover:border-accent hover:text-accent bg-white'
                )}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Atrás
        </Button>
        <Button
          className="flex-1"
          disabled={!selectedSlot}
          onClick={onNext}
        >
          Continuar <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Step 3 — Client info ──────────────────────────────────────

function Step3({
  slot, service, barber,
  pending, formError, onBack, currency,
}: {
  slot:      TimeSlot
  service:   Pick<Service, 'name' | 'price' | 'duration'> | undefined
  barber:    Pick<Barber,  'name' | 'color'>  | undefined
  pending:   boolean
  formError: string | undefined
  onBack:    () => void
  currency?: string
}) {
  return (
    <div className="space-y-5">
      {/* Appointment summary */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 space-y-1">
        <div className="flex items-center gap-2 text-sm text-brand-800">
          <Clock className="h-4 w-4 text-accent" />
          <span className="font-semibold">{slot.label}</span>
          <span className="text-brand-400">·</span>
          <span>{service?.name}</span>
          {service && (
            <>
              <span className="text-brand-400">·</span>
              <span>{formatCurrency(service.price, currency)}</span>
            </>
          )}
        </div>
        {barber && (
          <div className="flex items-center gap-2 text-xs text-brand-500">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: barber.color }}
            />
            {barber.name}
          </div>
        )}
      </div>

      <FormError message={formError} />

      {/* Client fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre del cliente
          </label>
          <input
            name="clientName"
            type="text"
            required
            autoComplete="off"
            placeholder="Ej: Juan García"
            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            WhatsApp / Teléfono
          </label>
          <input
            name="clientPhone"
            type="tel"
            required
            placeholder="Ej: 5512345678"
            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            Se enviará confirmación por WhatsApp si está configurado.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Notas <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Preferencias del corte, alergias..."
            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={pending}>
          <ChevronLeft className="h-4 w-4" /> Atrás
        </Button>
        <Button type="submit" variant="accent" className="flex-1" loading={pending}>
          Confirmar cita ✓
        </Button>
      </div>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────

function Steps({ current }: { current: number }) {
  const labels = ['Detalles', 'Horario', 'Cliente']
  return (
    <div className="flex items-center gap-1 mb-5">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition',
              i < current  ? 'bg-green-500 text-white' :
              i === current ? 'bg-accent text-white' :
                              'bg-gray-200 text-gray-500'
            )}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={cn(
              'text-xs font-medium',
              i === current ? 'text-gray-800' : 'text-gray-400'
            )}>
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className={cn(
              'mx-1 flex-1 h-px',
              i < current ? 'bg-green-400' : 'bg-gray-200'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────

export function NewAppointmentModal({
  isOpen, onClose, barbers, services, currency = 'MXN',
}: NewAppointmentModalProps) {
  const [step, setStep]         = useState(0)
  const [step1Data, setStep1]   = useState<Step1Data>({
    barberId: '', serviceId: '', date: new Date().toISOString().split('T')[0],
  })
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [state, formAction, pending]    = useActionState(createAppointmentAction, {})

  // Close and reset on success
  useEffect(() => {
    if (state.success) {
      onClose()
      setStep(0)
      setStep1({ barberId: '', serviceId: '', date: new Date().toISOString().split('T')[0] })
      setSelectedSlot(null)
    }
  }, [state.success, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else        document.body.style.overflow = ''
    return ()  => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const selectedBarber  = barbers.find(b => b.id === step1Data.barberId)
  const selectedService = services.find(s => s.id === step1Data.serviceId)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-brand-900">Nueva cita</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Steps current={step} />

          {/* Hidden inputs for the form */}
          <form action={formAction}>
            <input type="hidden" name="barberId"  value={step1Data.barberId} />
            <input type="hidden" name="serviceId" value={step1Data.serviceId} />
            <input type="hidden" name="startsAt"  value={selectedSlot?.startsAt ?? ''} />
            <input type="hidden" name="endsAt"    value={selectedSlot?.endsAt   ?? ''} />

            {step === 0 && (
              <Step1
                barbers={barbers}
                services={services}
                data={step1Data}
                onChange={d => setStep1(prev => ({ ...prev, ...d }))}
                onNext={() => setStep(1)}
                currency={currency}
              />
            )}

            {step === 1 && (
              <Step2
                barberId={step1Data.barberId}
                serviceId={step1Data.serviceId}
                date={step1Data.date}
                barbers={barbers}
                services={services}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
              />
            )}

            {step === 2 && selectedSlot && (
              <Step3
                slot={selectedSlot}
                service={selectedService}
                barber={selectedBarber}
                currency={currency}
                pending={pending}
                formError={state.error}
                onBack={() => setStep(1)}
              />
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
