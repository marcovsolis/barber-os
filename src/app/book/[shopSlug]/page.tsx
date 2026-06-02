import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Scissors, MapPin, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { BookingClient } from './BookingClient'

interface Props {
  params: Promise<{ shopSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug } = await params
  const supabase = createAdminClient()
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
  const supabase     = createAdminClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, description, logo_url, city, address, phone, timezone, currency, brand_color')
    .eq('slug', shopSlug)
    .eq('is_active', true)
    .single()

  if (!shop) notFound()

  const [{ data: barbers }, { data: services }] = await Promise.all([
    supabase
      .from('barbers')
      .select('id, name, bio, avatar_url')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('services')
      .select('id, name, duration, price, description')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('price'),
  ])

  const brandColor = (shop as any).brand_color ?? '#e94560'

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ '--booking-accent': brandColor } as React.CSSProperties}
    >
      {/* Header */}
      <header className="text-white py-8 px-4 text-center" style={{ backgroundColor: brandColor }}>
        <div className="flex justify-center mb-3">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="h-16 w-16 rounded-full object-cover shadow-lg border-2 border-white/20"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 shadow-lg">
              <Scissors className="h-7 w-7" />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold">{shop.name}</h1>
        {shop.city && (
          <a
            href={shop.address || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.city)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-300 text-sm mt-1 flex items-center justify-center gap-1 hover:text-white transition underline underline-offset-2"
          >
            <MapPin className="h-3.5 w-3.5" />
            {shop.city}
          </a>
        )}
        {shop.phone && (
          <a
            href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${shop.name}, quisiera información sobre sus servicios.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-300 text-sm mt-0.5 flex items-center justify-center gap-1 hover:text-white transition"
          >
            <Phone className="h-3.5 w-3.5" />
            {shop.phone}
          </a>
        )}
        {shop.description && (
          <p className="text-brand-200 text-sm mt-2 max-w-md mx-auto">{shop.description}</p>
        )}
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-brand-900 mb-6">Reserva tu cita</h2>

        {(barbers?.length ?? 0) === 0 || (services?.length ?? 0) === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Scissors className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Esta barbería aún no tiene horarios disponibles.</p>
            <p className="text-sm mt-1">Intenta más tarde o contáctanos directamente.</p>
          </div>
        ) : (
          <BookingClient
            shopId={shop.id}
            shopName={shop.name}
            barbers={barbers ?? []}
            services={services ?? []}
            currency={shop.currency ?? 'MXN'}
            brandColor={brandColor}
          />
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Powered by <span className="font-semibold text-brand-900">BarberOS</span>
      </footer>
    </div>
  )
}
