'use client'

import { useState, useEffect, useActionState, useTransition } from 'react'
import {
  Plus, Pencil, ToggleLeft, ToggleRight, Check, X,
  Store, Scissors, Users, Trash2, Loader2, Link2, Copy, CopyPlus, Mail,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  upsertBarberAction, toggleBarberAction, deleteBarberAction,
  upsertServiceAction, toggleServiceAction, duplicateServiceAction,
  updateShopAction, upsertAllSchedulesAction, inviteBarberAction,
} from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/form-field'
import { cn, formatCurrency } from '@/lib/utils'
import { COUNTRIES } from '@/lib/countries'

const DAYS = [
  { short: 'Dom', full: 'Domingo' },
  { short: 'Lun', full: 'Lunes' },
  { short: 'Mar', full: 'Martes' },
  { short: 'Mié', full: 'Miércoles' },
  { short: 'Jue', full: 'Jueves' },
  { short: 'Vie', full: 'Viernes' },
  { short: 'Sáb', full: 'Sábado' },
]
const COLORS = ['#4f6ef7','#e94560','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899']

// ── Tab navigation ────────────────────────────────────────────

type Tab = 'shop' | 'barbers' | 'services'

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'shop',     label: 'Barbería', icon: <Store className="h-4 w-4" /> },
    { key: 'barbers',  label: 'Barberos', icon: <Users className="h-4 w-4" /> },
    { key: 'services', label: 'Servicios', icon: <Scissors className="h-4 w-4" /> },
  ]
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition',
            active === t.key ? 'bg-white shadow text-brand-900' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Booking link banner ───────────────────────────────────────

function BookingLinkBanner({ slug }: { slug?: string }) {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState(`/book/${slug}`)

  useEffect(() => {
    setUrl(`${window.location.origin}/book/${slug}`)
  }, [slug])

  if (!slug) return null

  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-6 rounded-xl border-2 border-accent/20 bg-red-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-brand-900">Link de reserva para clientes</p>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Comparte este enlace para que tus clientes puedan hacer citas en línea.
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs text-gray-600 truncate">
          {url}
        </div>
        <button
          onClick={copy}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
            copied
              ? 'bg-green-500 text-white'
              : 'bg-accent text-white hover:bg-accent/90'
          )}
        >
          {copied ? <><Check className="h-3.5 w-3.5" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
        </button>
      </div>
    </div>
  )
}

// ── Country selector (reusable inside ShopForm) ───────────────

function CountrySelector({ shop }: { shop: any }) {
  const current = COUNTRIES.find(c => c.currency === shop?.currency) ?? COUNTRIES[0]
  const [selected, setSelected] = useState(current)

  const handleChange = (code: string) => {
    const c = COUNTRIES.find(x => x.code === code)
    if (c) setSelected(c)
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-gray-100 p-4 bg-gray-50">
      <p className="text-sm font-medium text-gray-700">País, moneda y zona horaria</p>

      <div>
        <label className="block text-xs text-gray-500 mb-1">País</label>
        <select
          name="country"
          value={selected.code}
          onChange={e => handleChange(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Hidden fields auto-populated by country selection */}
      <input type="hidden" name="currency" value={selected.currency} />
      <input type="hidden" name="timezone" value={selected.timezone} />

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
        <div className="rounded-lg bg-white border border-gray-200 px-3 py-2">
          <p className="text-gray-400 mb-0.5">Moneda</p>
          <p className="font-semibold text-brand-900">{selected.currencyLabel}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 px-3 py-2">
          <p className="text-gray-400 mb-0.5">Zona horaria</p>
          <p className="font-semibold text-brand-900 text-xs leading-tight">{selected.timezone}</p>
        </div>
      </div>
    </div>
  )
}

// ── Shop info form ────────────────────────────────────────────

function ShopForm({ shop }: { shop: any }) {
  const [state, action, pending] = useActionState(updateShopAction, {})

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-green-600 font-medium">✓ Cambios guardados</p>}

      {[
        { name: 'name',     label: 'Nombre',               defaultValue: shop?.name,     required: true },
        { name: 'phone',    label: 'Teléfono',             defaultValue: shop?.phone },
        { name: 'address',  label: 'Link de Google Maps',  defaultValue: shop?.address,
          placeholder: 'https://maps.google.com/...' },
        { name: 'city',     label: 'Ciudad (texto visible)', defaultValue: shop?.city,
          placeholder: 'Ej. CDMX, Monterrey...' },
        { name: 'logo_url', label: 'Logo URL',             defaultValue: shop?.logo_url,
          placeholder: 'https://...' },
      ].map(f => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          <input
            name={f.name}
            defaultValue={(f as any).defaultValue ?? ''}
            required={(f as any).required}
            placeholder={(f as any).placeholder ?? ''}
            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={shop?.description ?? ''}
          className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none resize-none"
        />
      </div>

      {/* Country / currency / timezone */}
      <CountrySelector shop={shop} />

      {/* WhatsApp API (optional) */}
      <div className="space-y-3 rounded-xl border-2 border-gray-100 p-4 bg-gray-50">
        <div>
          <p className="text-sm font-medium text-gray-700">WhatsApp Business API <span className="text-xs text-gray-400 font-normal">(opcional)</span></p>
          <p className="text-xs text-gray-400 mt-0.5">Si tienes tu propia cuenta de WhatsApp Business (360dialog), configúrala aquí para enviar notificaciones con tu número.</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">API Key (D360-API-KEY)</label>
          <input
            name="whatsapp_api_key"
            type="password"
            defaultValue={shop?.whatsapp_api_key ?? ''}
            placeholder="••••••••••••••••"
            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Phone Number ID</label>
          <input
            name="whatsapp_phone_id"
            defaultValue={shop?.whatsapp_phone_id ?? ''}
            placeholder="Ej. 1234567890"
            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Brand color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color del portal de reserva
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          {['#e94560','#4f6ef7','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#1a1a2e','#374151'].map(c => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="brand_color"
                value={c}
                defaultChecked={(shop?.brand_color ?? '#e94560') === c}
                className="sr-only peer"
              />
              <span
                className="block h-8 w-8 rounded-full border-2 border-transparent peer-checked:border-gray-800 peer-checked:scale-110 transition"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
          {/* Custom color picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="brand_color_custom"
              defaultValue={shop?.brand_color ?? '#e94560'}
              className="h-8 w-8 rounded-full cursor-pointer border border-gray-200"
              onChange={e => {
                const radios = document.querySelectorAll<HTMLInputElement>('input[name="brand_color"]')
                radios.forEach(r => r.checked = false)
              }}
            />
            <span className="text-xs text-gray-500">Personalizado</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Aplica al botón principal y acentos de la página de reservas de tus clientes.
        </p>
      </div>

      <Button type="submit" loading={pending}>Guardar cambios</Button>
    </form>
  )
}

// ── Barber form (inline) ──────────────────────────────────────

function BarberForm({ barber, onDone }: { barber?: any; onDone: () => void }) {
  const [state, action, pending] = useActionState(upsertBarberAction, {})
  const [color, setColor] = useState(barber?.color ?? '#4f6ef7')

  useEffect(() => { if (state.success) onDone() }, [state.success])

  return (
    <form action={action} className="rounded-xl border-2 border-accent/30 bg-red-50 p-4 space-y-3">
      {barber && <input type="hidden" name="id" value={barber.id} />}
      <FormError message={state.error} />

      <input
        name="name"
        defaultValue={barber?.name ?? ''}
        placeholder="Nombre del barbero"
        required
        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <input
        name="bio"
        defaultValue={barber?.bio ?? ''}
        placeholder="Especialidad (opcional)"
        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <input
        name="avatar_url"
        defaultValue={barber?.avatar_url ?? ''}
        placeholder="Avatar URL (opcional, https://...)"
        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />

      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          Comisión <span className="font-normal text-gray-400">(% del precio del servicio)</span>
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="commission_pct"
            min={0}
            max={100}
            defaultValue={barber?.commission_pct ?? 50}
            className="w-24 rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <span className="text-sm text-gray-500">%</span>
          <span className="text-xs text-gray-400">
            (ej: 50% = el barbero recibe la mitad del cobro)
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">Color en el calendario</p>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c} type="button"
              onClick={() => setColor(c)}
              className={cn('h-7 w-7 rounded-full border-2 transition', color === c ? 'border-gray-800 scale-110' : 'border-transparent')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <input type="hidden" name="color" value={color} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          <Check className="h-4 w-4" /> {barber ? 'Guardar' : 'Crear'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          <X className="h-4 w-4" /> Cancelar
        </Button>
      </div>
    </form>
  )
}

// ── Schedule editor ───────────────────────────────────────────

type DayState = { active: boolean; start: string; end: string }

function ScheduleEditor({ barber }: { barber: any }) {
  const [open, setOpen] = useState(false)
  const [saving, startSave] = useTransition()
  const [saved, setSaved] = useState(false)

  // Build initial state from DB schedules
  const [days, setDays] = useState<DayState[]>(() => {
    const map: Record<number, any> = {}
    ;(barber.barber_schedules ?? []).forEach((s: any) => { map[s.day_of_week] = s })
    return DAYS.map((_, i) => ({
      active: map[i]?.is_active ?? (i >= 1 && i <= 6), // Mon-Sat active by default
      start:  (map[i]?.start_time ?? '09:00').slice(0, 5),
      end:    (map[i]?.end_time   ?? '18:00').slice(0, 5),
    }))
  })

  const toggle = (i: number) =>
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, active: !d.active } : d))

  const update = (i: number, key: 'start' | 'end', val: string) =>
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, [key]: val } : d))

  const handleSave = () => {
    setSaved(false)
    startSave(async () => {
      const result = await upsertAllSchedulesAction(
        barber.id,
        days.map((d, i) => ({ day: i, start: d.start, end: d.end, active: d.active }))
      )
      if (result?.error) toast.error(result.error)
      else { toast.success('Horario guardado ✓'); setSaved(true) }
    })
  }

  // Count active days for summary
  const activeDays = days.filter(d => d.active)

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-xs text-brand-600 font-semibold hover:text-accent transition flex items-center gap-1"
      >
        {open ? '▲ Ocultar horario' : '▼ Editar horario'}
        <span className="font-normal text-gray-400 ml-1">
          ({activeDays.length} días activos)
        </span>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
          {DAYS.map((day, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* Day toggle */}
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex-shrink-0"
                title={days[i].active ? 'Desactivar día' : 'Activar día'}
              >
                {days[i].active
                  ? <ToggleRight className="h-5 w-5 text-green-500" />
                  : <ToggleLeft  className="h-5 w-5 text-gray-300" />
                }
              </button>

              {/* Day label */}
              <span className={cn(
                'w-8 text-sm font-semibold',
                days[i].active ? 'text-brand-900' : 'text-gray-400'
              )}>
                {day.short}
              </span>

              {/* Time inputs */}
              {days[i].active ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={days[i].start}
                    onChange={e => update(i, 'start', e.target.value)}
                    className="rounded-lg border-2 border-gray-200 px-2 py-1 text-xs focus:border-accent focus:outline-none"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="time"
                    value={days[i].end}
                    onChange={e => update(i, 'end', e.target.value)}
                    className="rounded-lg border-2 border-gray-200 px-2 py-1 text-xs focus:border-accent focus:outline-none"
                  />
                </div>
              ) : (
                <span className="flex-1 text-xs text-gray-400 italic">No trabaja</span>
              )}
            </div>
          ))}

          <div className="pt-2 border-t border-gray-200">
            <Button
              type="button"
              size="sm"
              variant={saved ? 'default' : 'accent'}
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
                : saved
                  ? <><Check className="h-4 w-4" /> Guardado</>
                  : 'Guardar horario'
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Service form ──────────────────────────────────────────────

function ServiceForm({ service, onDone }: { service?: any; onDone: () => void }) {
  const [state, action, pending] = useActionState(upsertServiceAction, {})

  useEffect(() => { if (state.success) onDone() }, [state.success])

  return (
    <form action={action} className="rounded-xl border-2 border-accent/30 bg-red-50 p-4 space-y-3">
      {service && <input type="hidden" name="id" value={service.id} />}
      <FormError message={state.error} />

      <input
        name="name"
        defaultValue={service?.name ?? ''}
        placeholder="Nombre del servicio"
        required
        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <input
        name="description"
        defaultValue={service?.description ?? ''}
        placeholder="Descripción (opcional)"
        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Precio</label>
          <input name="price" type="number" min="0" step="0.5" defaultValue={service?.price ?? ''}
            required className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Duración (min)</label>
          <select name="duration" defaultValue={service?.duration ?? '30'}
            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none">
            {[15,20,30,45,60,90].map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Descanso después del servicio
        </label>
        <select name="break_after" defaultValue={service?.break_after ?? '0'}
          className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none">
          {[
            { value: 0, label: 'Sin descanso' },
            { value: 5, label: '5 min' },
            { value: 10, label: '10 min' },
            { value: 15, label: '15 min' },
            { value: 20, label: '20 min' },
            { value: 30, label: '30 min' },
          ].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Tiempo bloqueado después del servicio para limpieza o preparación.
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          <Check className="h-4 w-4" /> {service ? 'Guardar' : 'Crear'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          <X className="h-4 w-4" /> Cancelar
        </Button>
      </div>
    </form>
  )
}

// ── Delete barber confirmation ────────────────────────────────

// ── Invite barber button ──────────────────────────────────────

function InviteBarberButton({ barberId, barberName, hasAccount }: {
  barberId:   string
  barberName: string
  hasAccount: boolean
}) {
  const [open,    setOpen]    = useState(false)
  const [email,   setEmail]   = useState('')
  const [pending, startTrans] = useTransition()
  const [sent,    setSent]    = useState(hasAccount)

  const handleInvite = () => {
    if (!email) return
    startTrans(async () => {
      const result = await inviteBarberAction(barberId, email)
      if (result?.error) toast.error(result.error)
      else {
        toast.success(`Invitación enviada a ${email}`)
        setSent(true)
        setOpen(false)
      }
    })
  }

  if (sent) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 font-medium px-2">
        <Check className="h-3.5 w-3.5" /> Cuenta activa
      </span>
    )
  }

  if (open) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@barbero.com"
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs w-40 focus:outline-none focus:border-accent"
          onKeyDown={e => e.key === 'Enter' && handleInvite()}
          autoFocus
        />
        <button
          onClick={handleInvite}
          disabled={pending || !email}
          className="rounded-lg px-2 py-1 text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Invitar'}
        </button>
        <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition"
      title={`Invitar a ${barberName} a crear su cuenta`}
    >
      <Mail className="h-4 w-4" />
    </button>
  )
}

function DeleteBarberButton({ barberId, barberName }: { barberId: string; barberName: string }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, startDelete] = useTransition()

  const handleDelete = () => {
    startDelete(async () => {
      const result = await deleteBarberAction(barberId)
      if (result?.error) toast.error(result.error)
      else toast.success(`${barberName} eliminado`)
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-red-600 font-medium mr-1">¿Eliminar?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg px-2 py-1 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sí'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="rounded-lg px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
      title="Eliminar barbero"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}

// ── Main component ────────────────────────────────────────────

export function SettingsClient({ shop, barbers, services }: {
  shop:     any
  barbers:  any[]
  services: any[]
}) {
  const [tab, setTab]                   = useState<Tab>('shop')
  const [addingBarber, setAddingBarber] = useState(false)
  const [editingBarber, setEditingBarber] = useState<string | null>(null)
  const [addingService, setAddingService]   = useState(false)
  const [editingService, setEditingService] = useState<string | null>(null)

  return (
    <div>
      <TabBar active={tab} onChange={setTab} />

      {/* ── Shop tab ─────────────────────────────── */}
      {tab === 'shop' && (
        <>
          <BookingLinkBanner slug={shop?.slug} />
          <ShopForm shop={shop} />
        </>
      )}

      {/* ── Barbers tab ──────────────────────────── */}
      {tab === 'barbers' && (
        <div className="space-y-4">
          {barbers.map(b => (
            <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-4">
              {editingBarber === b.id ? (
                <BarberForm barber={b} onDone={() => setEditingBarber(null)} />
              ) : (
                <>
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: b.color }}
                      >
                        {b.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-brand-900">{b.name}</p>
                        {b.bio && <p className="text-xs text-gray-400">{b.bio}</p>}
                        <span className={cn(
                          'text-xs font-medium',
                          b.is_active ? 'text-green-600' : 'text-gray-400'
                        )}>
                          {b.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <button
                        onClick={() => setEditingBarber(b.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Toggle active */}
                      <button
                        onClick={() => toggleBarberAction(b.id, !b.is_active)}
                        className={cn(
                          'p-1.5 rounded-lg transition',
                          b.is_active
                            ? 'text-green-500 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        )}
                        title={b.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {b.is_active
                          ? <ToggleRight className="h-5 w-5" />
                          : <ToggleLeft  className="h-5 w-5" />
                        }
                      </button>

                      {/* Invite to create account */}
                      <InviteBarberButton
                        barberId={b.id}
                        barberName={b.name}
                        hasAccount={!!b.profile_id}
                      />

                      {/* Delete */}
                      <DeleteBarberButton barberId={b.id} barberName={b.name} />
                    </div>
                  </div>

                  {/* Schedule editor */}
                  <ScheduleEditor barber={b} />
                </>
              )}
            </div>
          ))}

          {addingBarber
            ? <BarberForm onDone={() => setAddingBarber(false)} />
            : (
              <button
                onClick={() => setAddingBarber(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-accent hover:text-accent transition"
              >
                <Plus className="h-4 w-4" /> Agregar barbero
              </button>
            )
          }
        </div>
      )}

      {/* ── Services tab ─────────────────────────── */}
      {tab === 'services' && (
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4">
              {editingService === s.id ? (
                <ServiceForm service={s} onDone={() => setEditingService(null)} />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-brand-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.duration} min · {formatCurrency(s.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingService(s.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        const r = await duplicateServiceAction(s.id)
                        if (r?.error) toast.error(r.error)
                        else toast.success('Servicio duplicado')
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition"
                      title="Duplicar"
                    >
                      <CopyPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleServiceAction(s.id, !s.is_active)}
                      className={cn(
                        'p-1.5 rounded-lg transition',
                        s.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                      )}
                      title={s.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {s.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addingService
            ? <ServiceForm onDone={() => setAddingService(false)} />
            : (
              <button
                onClick={() => setAddingService(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-accent hover:text-accent transition"
              >
                <Plus className="h-4 w-4" /> Agregar servicio
              </button>
            )
          }
        </div>
      )}
    </div>
  )
}
