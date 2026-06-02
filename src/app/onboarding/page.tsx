'use client'

import { useState, useActionState, useCallback } from 'react'
import { Scissors, Plus, Trash2, Check, ChevronRight, Store, Package } from 'lucide-react'
import { completeOnboardingAction, checkSlugAvailability } from './actions'
import { FormField, FormError } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { slugify } from '@/lib/utils'
import { COUNTRIES } from '@/lib/countries'

// ── Types ────────────────────────────────────────────────────

interface ServiceInput {
  id: string
  name: string
  price: string
  duration: string
}

// ── Default services to pre-fill step 2 ─────────────────────

const DEFAULT_SERVICES: ServiceInput[] = [
  { id: '1', name: 'Corte de cabello', price: '150', duration: '30' },
  { id: '2', name: 'Corte + barba',   price: '220', duration: '45' },
  { id: '3', name: 'Arreglo de barba', price: '100', duration: '20' },
]

// ── Step indicator ───────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
              i < current
                ? 'bg-green-500 text-white'
                : i === current
                ? 'bg-accent text-white ring-4 ring-accent/20'
                : 'bg-brand-800 text-brand-400'
            }`}
          >
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 ${i < current ? 'bg-green-500' : 'bg-brand-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1 — Barbería info ───────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: { shopName: string; shopSlug: string; city: string; timezone: string; country: string; currency: string }
  onChange: (field: string, value: string) => void
  onNext: () => void
}) {
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleNameChange = (value: string) => {
    onChange('shopName', value)
    const slug = slugify(value)
    onChange('shopSlug', slug)
    setSlugStatus('idle')
  }

  const handleSlugChange = (value: string) => {
    onChange('shopSlug', value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSlugStatus('idle')
  }

  const checkSlug = useCallback(async () => {
    if (!data.shopSlug || data.shopSlug.length < 2) return
    setSlugStatus('checking')
    const available = await checkSlugAvailability(data.shopSlug)
    setSlugStatus(available ? 'available' : 'taken')
  }, [data.shopSlug])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!data.shopName || data.shopName.length < 2) e.shopName = 'Mínimo 2 caracteres'
    if (!data.shopSlug || data.shopSlug.length < 2)  e.shopSlug = 'Mínimo 2 caracteres'
    if (slugStatus === 'taken') e.shopSlug = 'Esta URL ya está en uso'
    if (!data.timezone) e.timezone = 'Selecciona tu zona horaria'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Tu barbería</h2>
        <p className="text-sm text-brand-300 mt-1">
          Cuéntanos el nombre de tu negocio para empezar
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-200 mb-1">
          Nombre de la barbería
        </label>
        <input
          type="text"
          value={data.shopName}
          onChange={e => handleNameChange(e.target.value)}
          placeholder="Ej: Barbería El Clásico"
          className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white placeholder-brand-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {errors.shopName && <p className="mt-1 text-xs text-red-400">{errors.shopName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-200 mb-1">
          URL pública de reserva
        </label>
        <div className="flex items-center gap-0">
          <span className="rounded-l-lg border border-r-0 border-brand-700 bg-brand-900 px-3 py-2.5 text-xs text-brand-400 whitespace-nowrap">
            barberos.app/book/
          </span>
          <input
            type="text"
            value={data.shopSlug}
            onChange={e => handleSlugChange(e.target.value)}
            onBlur={checkSlug}
            placeholder="mi-barberia"
            className="flex-1 rounded-r-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white placeholder-brand-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="mt-1 h-4">
          {slugStatus === 'checking'  && <p className="text-xs text-brand-400">Verificando...</p>}
          {slugStatus === 'available' && <p className="text-xs text-green-400">✓ URL disponible</p>}
          {slugStatus === 'taken'     && <p className="text-xs text-red-400">✗ URL no disponible</p>}
          {errors.shopSlug && <p className="text-xs text-red-400">{errors.shopSlug}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-200 mb-1">
          Ciudad <span className="text-brand-500">(opcional)</span>
        </label>
        <input
          type="text"
          value={data.city}
          onChange={e => onChange('city', e.target.value)}
          placeholder="Ciudad de México"
          className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white placeholder-brand-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-200 mb-1">
          País
        </label>
        <select
          value={data.country}
          onChange={e => {
            const country = COUNTRIES.find(c => c.code === e.target.value)
            if (!country) return
            onChange('country',   country.code)
            onChange('timezone',  country.timezone)
            onChange('currency',  country.currency)
          }}
          className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="" disabled>Selecciona tu país</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        {errors.timezone && <p className="mt-1 text-xs text-red-400">{errors.timezone}</p>}
      </div>

      {data.currency && (
        <div className="rounded-lg border border-brand-700 bg-brand-900/50 px-3 py-2.5 flex items-center justify-between text-sm">
          <span className="text-brand-400">Moneda detectada</span>
          <span className="text-white font-medium">
            {COUNTRIES.find(c => c.code === data.country)?.currencyLabel ?? data.currency}
          </span>
        </div>
      )}

      <Button
        className="w-full"
        variant="accent"
        onClick={() => validate() && onNext()}
      >
        Continuar <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ── Step 2 — Services ────────────────────────────────────────

function Step2({
  services,
  onChange,
  onNext,
  onBack,
}: {
  services: ServiceInput[]
  onChange: (services: ServiceInput[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const [error, setError] = useState('')

  const update = (id: string, field: keyof ServiceInput, value: string) => {
    onChange(services.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const add = () => {
    onChange([...services, { id: Date.now().toString(), name: '', price: '', duration: '30' }])
  }

  const remove = (id: string) => {
    if (services.length <= 1) return
    onChange(services.filter(s => s.id !== id))
  }

  const validate = () => {
    const invalid = services.some(s => !s.name || !s.price || !s.duration)
    if (invalid) {
      setError('Completa todos los campos de cada servicio.')
      return false
    }
    setError('')
    return true
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Servicios</h2>
        <p className="text-sm text-brand-300 mt-1">
          Agrega los servicios que ofreces y sus precios. Puedes cambiarlos después.
        </p>
      </div>

      {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>}

      <div className="space-y-3">
        {services.map((service, i) => (
          <div key={service.id} className="rounded-xl border border-brand-700 bg-brand-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">
                Servicio {i + 1}
              </span>
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(service.id)}
                  className="text-brand-500 hover:text-red-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <input
              type="text"
              value={service.name}
              onChange={e => update(service.id, 'name', e.target.value)}
              placeholder="Nombre del servicio"
              className="w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-sm text-white placeholder-brand-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-brand-400 mb-1">Precio ($)</label>
                <input
                  type="number"
                  value={service.price}
                  onChange={e => update(service.id, 'price', e.target.value)}
                  placeholder="150"
                  min="0"
                  className="w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-sm text-white placeholder-brand-500 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-400 mb-1">Duración (min)</label>
                <select
                  value={service.duration}
                  onChange={e => update(service.id, 'duration', e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                >
                  {[15, 20, 30, 45, 60, 90].map(d => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-600 py-3 text-sm text-brand-400 hover:border-accent hover:text-accent transition"
      >
        <Plus className="h-4 w-4" /> Agregar servicio
      </button>

      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1 text-brand-300 hover:bg-brand-800" onClick={onBack}>
          Atrás
        </Button>
        <Button variant="accent" className="flex-1" onClick={() => validate() && onNext()}>
          Continuar <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Step 3 — Confirm & submit ────────────────────────────────

function Step3({
  shopData,
  services,
  onBack,
  pending,
}: {
  shopData: { shopName: string; shopSlug: string; city: string; timezone: string }
  services: ServiceInput[]
  onBack: () => void
  pending: boolean
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">¡Todo listo!</h2>
        <p className="text-sm text-brand-300 mt-1">
          Revisa los datos antes de crear tu barbería
        </p>
      </div>

      {/* Summary cards */}
      <div className="rounded-xl border border-brand-700 bg-brand-800 divide-y divide-brand-700">
        <div className="flex items-center gap-3 p-4">
          <Store className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">{shopData.shopName}</p>
            <p className="text-xs text-brand-400">
              barberos.app/book/{shopData.shopSlug}
              {shopData.city ? ` · ${shopData.city}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4">
          <Package className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">{services.length} servicio{services.length !== 1 ? 's' : ''}</p>
            {services.map(s => (
              <p key={s.id} className="text-xs text-brand-300">
                {s.name} — ${s.price} · {s.duration} min
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1 text-brand-300 hover:bg-brand-800" onClick={onBack} disabled={pending}>
          Atrás
        </Button>
        <Button type="submit" variant="accent" className="flex-1" loading={pending}>
          Crear mi barbería ✂️
        </Button>
      </div>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [shopData, setShopData] = useState({
    shopName: '',
    shopSlug: '',
    city:     '',
    timezone: 'America/Mexico_City',
    country:  'MX',
    currency: 'MXN',
  })
  const [services, setServices] = useState<ServiceInput[]>(DEFAULT_SERVICES)
  const [state, formAction, pending] = useActionState(completeOnboardingAction, {})

  const updateShop = (field: string, value: string) =>
    setShopData(prev => ({ ...prev, [field]: value }))

  return (
    <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
          <Scissors className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">BarberOS</span>
      </div>

      <div className="w-full max-w-lg">
        <StepIndicator current={step} total={3} />

        <div className="rounded-2xl bg-brand-900 border border-brand-700 p-8 shadow-2xl">
          <FormError message={state.error} />

          {/* Hidden form that wraps step 3 submit */}
          <form action={formAction}>
            <input type="hidden" name="shopName"  value={shopData.shopName} />
            <input type="hidden" name="shopSlug"  value={shopData.shopSlug} />
            <input type="hidden" name="city"      value={shopData.city} />
            <input type="hidden" name="timezone"  value={shopData.timezone} />
            <input type="hidden" name="country"   value={shopData.country} />
            <input type="hidden" name="currency"  value={shopData.currency} />
            <input type="hidden" name="services"  value={JSON.stringify(
              services.map(s => ({
                name:     s.name,
                price:    parseFloat(s.price) || 0,
                duration: parseInt(s.duration) || 30,
              }))
            )} />

            {step === 0 && (
              <Step1
                data={shopData}
                onChange={updateShop}
                onNext={() => setStep(1)}
              />
            )}

            {step === 1 && (
              <Step2
                services={services}
                onChange={setServices}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
              />
            )}

            {step === 2 && (
              <Step3
                shopData={shopData}
                services={services}
                onBack={() => setStep(1)}
                pending={pending}
              />
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
