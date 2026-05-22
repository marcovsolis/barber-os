import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Scissors } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ shopSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug } = await params
  const supabase = await createClient()
  const { data: shop } = await supabase
    .from('shops')
    .select('name, description')
    .eq('slug', shopSlug)
    .single()

  if (!shop) return { title: 'Barbería no encontrada' }

  return {
    title: `Agenda tu cita — ${shop.name}`,
    description: shop.description ?? `Reserva tu cita en ${shop.name}`,
  }
}

export default async function BookingPage({ params }: Props) {
  const { shopSlug } = await params
  const supabase     = await createClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, description, logo_url, city')
    .eq('slug', shopSlug)
    .eq('is_active', true)
    .single()

  if (!shop) notFound()

  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, bio, avatar_url')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('name')

  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration, price, description')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('price')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-900 text-white py-8 px-4 text-center">
        <div className="flex justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <Scissors className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">{shop.name}</h1>
        {shop.city && <p className="text-brand-300 text-sm mt-1">{shop.city}</p>}
        {shop.description && (
          <p className="text-brand-200 text-sm mt-2 max-w-md mx-auto">{shop.description}</p>
        )}
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-xl font-bold text-brand-900">Reserva tu cita</h2>

        {/* Services */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Elige un servicio
          </h3>
          <div className="space-y-2">
            {(services ?? []).map(s => (
              <button
                key={s.id}
                className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-brand-500 hover:shadow-sm transition"
              >
                <div>
                  <p className="font-medium text-brand-900">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{s.duration} min</p>
                </div>
                <span className="font-semibold text-brand-900">${s.price}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Barbers */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Elige tu barbero
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(barbers ?? []).map(b => (
              <button
                key={b.id}
                className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-500 hover:shadow-sm transition"
              >
                <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg mb-2">
                  {b.name[0].toUpperCase()}
                </div>
                <p className="font-medium text-brand-900 text-sm">{b.name}</p>
                {b.bio && <p className="text-xs text-gray-400 text-center mt-1 line-clamp-2">{b.bio}</p>}
              </button>
            ))}
          </div>
        </section>

        <p className="text-xs text-gray-400 text-center">
          Después de elegir servicio y barbero, podrás seleccionar fecha y hora disponibles.
        </p>
      </main>
    </div>
  )
}
