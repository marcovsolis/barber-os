import Link from 'next/link'
import { Scissors, Calendar, DollarSign, Package, MessageCircle, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BarberOS — Gestión para barberías',
  description: 'Plataforma open source para gestionar citas, pagos, inventario y WhatsApp en tu barbería.',
}

const features = [
  {
    icon: Calendar,
    title: 'Agenda de citas',
    desc: 'Calendario visual, reservas online y recordatorios automáticos.',
  },
  {
    icon: DollarSign,
    title: 'Control de pagos',
    desc: 'Registra cobros, lleva la caja del día y calcula comisiones.',
  },
  {
    icon: MessageCircle,
    title: 'Integración WhatsApp',
    desc: 'Bot para agendar, confirmaciones y recordatorios automáticos.',
  },
  {
    icon: Package,
    title: 'Inventario y gastos',
    desc: 'Stock en tiempo real, alertas de mínimos y reporte de rentabilidad.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-brand-800">
        <div className="flex items-center gap-2">
          <Scissors className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold">BarberOS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-brand-200 hover:text-white transition">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold hover:bg-accent-dark transition"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-4 py-24">
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
          Gestiona tu barbería<br />
          <span className="text-accent">sin complicaciones</span>
        </h1>
        <p className="mt-6 text-lg text-brand-200 max-w-2xl mx-auto">
          Citas, pagos, inventario y WhatsApp en una sola plataforma. Gratis y de código abierto.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold hover:bg-accent-dark transition text-lg"
          >
            Comenzar ahora <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="https://github.com/marcovsolis/barber-os"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-600 px-6 py-3 font-semibold hover:bg-brand-800 transition text-lg"
          >
            Ver en GitHub
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Todo lo que necesitas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl bg-brand-800 p-6 border border-brand-700">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent mb-4">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-brand-300">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-800 text-center py-8 text-sm text-brand-400">
        BarberOS es open source —{' '}
        <a
          href="https://github.com/marcovsolis/barber-os"
          className="underline hover:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        {' '}· Licencia MIT
      </footer>
    </div>
  )
}
