'use client'

import { useActionState, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle, ChevronLeft, Loader2, CalendarDays, Clock, MessageCircle, Download } from 'lucide-react'
import { bookAppointmentAction, getPublicSlotsAction, type BookState } from './actions'
import { formatCurrency } from '@/lib/utils'
import { DialCodePicker } from '@/components/ui/DialCodePicker'
import { COUNTRIES } from '@/lib/countries'
import type { TimeSlot } from '@/lib/slots'

// ── Calendar helpers ──────────────────────────────────────────

/** "2025-05-27T15:00:00.000Z" → "20250527T150000Z" */
function toCalDate(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function buildGCalUrl(title: string, startsAt: string, endsAt: string, description: string): string {
  const params = new URLSearchParams({
    action:  'TEMPLATE',
    text:    title,
    dates:   `${toCalDate(startsAt)}/${toCalDate(endsAt)}`,
    details: description,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

function downloadICS(title: string, startsAt: string, endsAt: string, description: string) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BarberOS//ES',
    'BEGIN:VEVENT',
    `DTSTART:${toCalDate(startsAt)}`,
    `DTEND:${toCalDate(endsAt)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'cita.ics'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Types ─────────────────────────────────────────────────────

interface Service {
  id: string
  name: string
  duration: number
  price: number
  description?: string
}

interface Barber {
  id: string
  name: string
  bio?: string
  avatar_url?: string
}

interface BookingClientProps {
  shopId:      string
  shopName:    string
  barbers:     Barber[]
  services:    Service[]
  currency?:   string
  brandColor?: string
}

// ── Steps ─────────────────────────────────────────────────────
// 1 → choose service
// 2 → choose barber
// 3 → choose date & slot
// 4 → enter name + phone → submit

// ── Submit button ─────────────────────────────────────────────

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
      style={{ backgroundColor: 'var(--booking-accent, #e94560)' }}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Confirmando…
        </>
      ) : (
        'Confirmar cita'
      )}
    </button>
  )
}

// ── Month calendar component ──────────────────────────────────

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function MonthCalendar({
  selectedDate,
  onSelect,
  accentColor,
}: {
  selectedDate: string | null
  onSelect:     (date: string) => void
  accentColor:  string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateStr(today)

  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())  // 0-indexed

  // Max: 3 months ahead
  const maxDate = new Date(today)
  maxDate.setMonth(maxDate.getMonth() + 3)

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth()
  const canGoNext = new Date(viewYear, viewMonth + 1, 1) <= maxDate

  function prevMonth() {
    if (!canGoPrev) return
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (!canGoNext) return
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Build calendar grid
  const firstDay  = new Date(viewYear, viewMonth, 1).getDay()   // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-light"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-brand-900 capitalize">{monthLabel}</p>
        <button
          type="button"
          onClick={nextMonth}
          disabled={!canGoNext}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-light"
        >
          ›
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const cellDate = new Date(`${dateStr}T12:00:00`)
          cellDate.setHours(0, 0, 0, 0)

          const isPast     = cellDate < today
          const isSelected = dateStr === selectedDate
          const isToday    = dateStr === todayStr

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => !isPast && onSelect(dateStr)}
              style={
                isSelected
                  ? { backgroundColor: accentColor, color: '#fff' }
                  : isToday
                    ? { outline: `2px solid ${accentColor}`, outlineOffset: '-2px', color: accentColor, fontWeight: 600 }
                    : {}
              }
              className={`
                mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all
                ${isPast     ? 'text-gray-200 cursor-not-allowed' : 'cursor-pointer'}
                ${!isPast && !isSelected ? 'hover:bg-gray-100 text-brand-900' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function formatDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLong(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Main component ────────────────────────────────────────────

export function BookingClient({ shopId, shopName, barbers, services, currency = 'MXN', brandColor = '#e94560' }: BookingClientProps) {
  const [step, setStep]               = useState(1)
  const [selectedService, setService] = useState<Service | null>(null)
  const [selectedBarber, setBarber]   = useState<Barber | null>(null)
  const [selectedDate, setDate]       = useState<string | null>(null)
  const [selectedSlot, setSlot]       = useState<TimeSlot | null>(null)
  const [slots, setSlots]             = useState<TimeSlot[]>([])
  const [slotsError, setSlotsError]   = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()
  const [dialCode, setDialCode]       = useState(COUNTRIES[0].dialCode)
  const [localPhone, setLocalPhone]   = useState('')

  const [state, formAction] = useActionState<BookState, FormData>(bookAppointmentAction, {})

  function loadSlots(date: string) {
    if (!selectedBarber || !selectedService) return
    setDate(date)
    setSlot(null)
    setSlotsError(null)
    startTransition(async () => {
      const result = await getPublicSlotsAction(shopId, selectedBarber.id, selectedService.id, date)
      if (result.error) setSlotsError(result.error)
      else setSlots(result.slots)
    })
  }

  // ── Success screen ─────────────────────────────────────────
  if (state.success) {
    // Build WhatsApp link for the shop (so client can contact if needed)
    const shopWaLink = state.shopPhone
      ? `https://wa.me/${state.shopPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, acabo de reservar una cita para el ${selectedDate ? formatDateLong(selectedDate) : ''} a las ${selectedSlot ? formatTimeLabel(selectedSlot.startsAt) : ''}.`)}`
      : null

    const calTitle       = `Cita en ${shopName}`
    const calDescription = `${selectedService?.name} con ${selectedBarber?.name}`

    return (
      <div className="text-center py-12 px-4 space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-brand-900">¡Cita confirmada!</h2>

        {/* Summary card */}
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm max-w-sm mx-auto">
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha</span>
            <span className="font-semibold text-brand-900">{selectedDate ? formatDateLong(selectedDate) : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Hora</span>
            <span className="font-semibold text-brand-900">{selectedSlot ? formatTimeLabel(selectedSlot.startsAt) : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Barbero</span>
            <span className="font-semibold text-brand-900">{selectedBarber?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Servicio</span>
            <span className="font-semibold text-brand-900">{selectedService?.name}</span>
          </div>
        </div>

        {/* Add to calendar */}
        {selectedSlot && (
          <div className="w-full max-w-sm mx-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Agregar al calendario
            </p>
            <div className="flex gap-2">
              <a
                href={buildGCalUrl(calTitle, selectedSlot.startsAt, selectedSlot.endsAt, calDescription)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold py-2.5 text-xs hover:border-accent hover:text-accent transition"
              >
                <CalendarDays className="h-4 w-4" />
                Google
              </a>
              <button
                onClick={() => downloadICS(calTitle, selectedSlot.startsAt, selectedSlot.endsAt, calDescription)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold py-2.5 text-xs hover:border-accent hover:text-accent transition"
              >
                <Download className="h-4 w-4" />
                Apple / Outlook
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp contact */}
        {shopWaLink && (
          <a
            href={shopWaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full max-w-sm mx-auto rounded-xl bg-[#25D366] text-white font-semibold py-3 text-sm hover:bg-[#1ebe5d] transition"
          >
            <MessageCircle className="h-5 w-5" />
            Contactar por WhatsApp
          </a>
        )}

        <p className="text-xs text-gray-400 mt-2">Te esperamos puntual. ¡Hasta pronto!</p>
      </div>
    )
  }

  return (
    <div
      className="space-y-6"
      style={{ '--booking-accent': brandColor } as React.CSSProperties}
    >

      {/* ── STEP 1: Service ─────────────────────────────────── */}
      {step === 1 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Paso 1 de 4 — Elige un servicio
          </h3>
          <div className="space-y-2">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setService(s)
                  setStep(2)
                }}
                className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left hover:border-accent hover:shadow-sm transition-all"
              >
                <div>
                  <p className="font-semibold text-brand-900">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    <Clock className="inline h-3 w-3 mr-0.5" />
                    {s.duration} min
                  </p>
                </div>
                <span className="font-bold text-brand-900 text-lg ml-4 shrink-0">
                  {formatCurrency(s.price, currency)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── STEP 2: Barber ──────────────────────────────────── */}
      {step === 2 && (
        <section>
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="h-4 w-4" /> Cambiar servicio
          </button>

          {/* Selected service summary */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-accent font-medium uppercase tracking-wide">Servicio</p>
              <p className="font-semibold text-brand-900">{selectedService?.name}</p>
            </div>
            <span className="font-bold text-brand-900">{formatCurrency(selectedService?.price ?? 0, currency)}</span>
          </div>

          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Paso 2 de 4 — Elige tu barbero
          </h3>
          <div className="grid grid-cols-2 gap-3">

            {/* "Any professional" option */}
            <button
              onClick={() => {
                setBarber({ id: 'any', name: 'Cualquier disponible' })
                setStep(3)
              }}
              className="col-span-2 flex items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 hover:border-accent hover:bg-accent/5 transition-all"
              style={{ borderColor: 'var(--booking-accent, #e94560)10' }}
            >
              <div
                className="h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: 'var(--booking-accent, #e94560)' }}
              >
                ✦
              </div>
              <div className="text-left">
                <p className="font-semibold text-brand-900 text-sm">Cualquier disponible</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Te asignamos el primer profesional libre para tu horario
                </p>
              </div>
            </button>

            {barbers.map(b => (
              <button
                key={b.id}
                onClick={() => {
                  setBarber(b)
                  setStep(3)
                }}
                className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 hover:border-accent hover:shadow-sm transition-all"
              >
                {b.avatar_url ? (
                  <img
                    src={b.avatar_url}
                    alt={b.name}
                    className="h-14 w-14 rounded-full object-cover mb-2 border border-gray-200"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl mb-2">
                    {b.name[0].toUpperCase()}
                  </div>
                )}
                <p className="font-semibold text-brand-900 text-sm">{b.name}</p>
                {b.bio && (
                  <p className="text-xs text-gray-400 text-center mt-1 line-clamp-2">{b.bio}</p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── STEP 3: Date & slot ─────────────────────────────── */}
      {step === 3 && (
        <section>
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="h-4 w-4" /> Cambiar barbero
          </button>

          {/* Summary */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 mb-4 grid grid-cols-2 gap-1 text-sm">
            <div>
              <p className="text-xs text-accent font-medium uppercase tracking-wide">Servicio</p>
              <p className="font-semibold text-brand-900">{selectedService?.name}</p>
            </div>
            <div>
              <p className="text-xs text-accent font-medium uppercase tracking-wide">Barbero</p>
              <p className="font-semibold text-brand-900">
                {selectedBarber?.id === 'any' ? 'Primer disponible ✦' : selectedBarber?.name}
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            <CalendarDays className="inline h-4 w-4 mr-1" />
            Paso 3 de 4 — Elige fecha y hora
          </h3>

          {/* Full month calendar */}
          <MonthCalendar
            selectedDate={selectedDate}
            onSelect={loadSlots}
            accentColor={brandColor}
          />

          {/* Slots */}
          {selectedDate && (
            <div className="mt-4">
              {isPending && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              )}
              {!isPending && slotsError && (
                <p className="text-sm text-red-600 text-center py-4">{slotsError}</p>
              )}
              {!isPending && !slotsError && slots.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Sin horarios disponibles para este día.
                </p>
              )}
              {!isPending && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot.startsAt}
                      onClick={() => {
                        setSlot(slot)
                        setStep(4)
                      }}
                      className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedSlot?.startsAt === slot.startsAt
                          ? 'border-accent bg-accent text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-accent'
                      }`}
                    >
                      {formatTimeLabel(slot.startsAt)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── STEP 4: Contact info + submit ───────────────────── */}
      {step === 4 && (
        <section>
          <button
            onClick={() => setStep(3)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="h-4 w-4" /> Cambiar horario
          </button>

          {/* Full summary */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 mb-5 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Servicio</span>
              <span className="font-semibold text-brand-900">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Barbero</span>
              <span className="font-semibold text-brand-900">{selectedBarber?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha</span>
              <span className="font-semibold text-brand-900">
                {selectedDate ? formatDateLong(selectedDate) : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hora</span>
              <span className="font-semibold text-brand-900">
                {selectedSlot ? formatTimeLabel(selectedSlot.startsAt) : ''}
              </span>
            </div>
            <div className="flex justify-between border-t border-accent/20 pt-1.5">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-accent text-base">
                {formatCurrency(selectedService?.price ?? 0, currency)}
              </span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Paso 4 de 4 — Tus datos de contacto
          </h3>

          <form action={formAction} className="space-y-3">
            {/* Hidden fields */}
            <input type="hidden" name="shopId"    value={shopId} />
            <input type="hidden" name="barberId"  value={selectedBarber?.id ?? ''} />
            <input type="hidden" name="serviceId" value={selectedService?.id ?? ''} />
            <input type="hidden" name="startsAt"  value={selectedSlot?.startsAt ?? ''} />
            <input type="hidden" name="endsAt"    value={selectedSlot?.endsAt ?? ''} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                name="clientName"
                required
                placeholder="Ej. Carlos Ramírez"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              {state.fieldErrors?.clientName && (
                <p className="text-xs text-red-600 mt-1">{state.fieldErrors.clientName[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp / Teléfono *
              </label>
              {/* Hidden field with full phone (dial code + number) */}
              <input
                type="hidden"
                name="clientPhone"
                value={`${dialCode.replace('+', '')}${localPhone.replace(/\D/g, '').replace(/^0+/, '')}`}
              />
              <div className="flex gap-2">
                <DialCodePicker value={dialCode} onChange={setDialCode} />
                <input
                  type="tel"
                  value={localPhone}
                  onChange={e => setLocalPhone(e.target.value)}
                  inputMode="numeric"
                  required
                  placeholder="88888888"
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              {state.fieldErrors?.clientPhone && (
                <p className="text-xs text-red-600 mt-1">{state.fieldErrors.clientPhone[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Ej. Quiero fade bajo con línea…"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              />
            </div>

            {state.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <SubmitBtn />
          </form>
        </section>
      )}
    </div>
  )
}
