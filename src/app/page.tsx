import Link from 'next/link'
import { Scissors, Calendar, DollarSign, Package, MessageCircle, ArrowRight, Check, Star, Zap, Shield, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BarberOS — Gestión para barberías',
  description: 'Plataforma open source para gestionar citas, pagos, inventario y WhatsApp en tu barbería.',
}

const features = [
  {
    icon: Calendar,
    title: 'Agenda inteligente',
    desc: 'Calendario visual con slots en tiempo real, reservas online 24/7 y navegación por fecha.',
    color: 'from-blue-500 to-brand-500',
  },
  {
    icon: DollarSign,
    title: 'Control de pagos',
    desc: 'Registra cobros, calcula comisiones de barberos y exporta reportes a Excel.',
    color: 'from-green-500 to-emerald-400',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp integrado',
    desc: 'Confirmaciones automáticas y recordatorios 24h y 30min antes de cada cita.',
    color: 'from-accent to-accent-light',
  },
  {
    icon: Package,
    title: 'Inventario y stock',
    desc: 'Stock en tiempo real, alertas de mínimos y control de productos por proveedor.',
    color: 'from-orange-500 to-yellow-400',
  },
  {
    icon: Users,
    title: 'Base de clientes',
    desc: 'Historial completo por cliente: visitas, gasto total y notas privadas del barbero.',
    color: 'from-purple-500 to-pink-400',
  },
  {
    icon: Shield,
    title: 'Multi-barbero',
    desc: 'Gestiona múltiples barberos con horarios, colores y comisiones individuales.',
    color: 'from-cyan-500 to-teal-400',
  },
]

const stats = [
  { value: '100%', label: 'En la nube' },
  { value: '0$',   label: 'Para empezar' },
  { value: '24/7', label: 'Reservas online' },
  { value: '2min', label: 'Para configurar' },
]

const included = [
  'Agenda de citas con reservas online',
  'Recordatorios automáticos por WhatsApp',
  'Reportes de pagos y comisiones',
  'Control de inventario con alertas',
  'Base de datos de clientes',
  'Página pública de reservas',
  'Gestión de múltiples barberos',
  'Exportación a Excel',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0d0d1a]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Scissors className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">BarberOS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold hover:bg-accent-dark transition-colors"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-4 pt-24 pb-20 text-center overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-brand-500/10 blur-[120px]" />
        </div>
        <div className="pointer-events-none absolute top-20 left-1/4 h-64 w-64 rounded-full bg-accent/5 blur-[80px]" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 mb-8 backdrop-blur-sm">
          <Zap className="h-3 w-3 text-accent" />
          Hecho para barberías modernas
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight max-w-4xl mx-auto">
          El sistema que tu
          <br />
          <span className="bg-gradient-to-r from-accent via-accent-light to-brand-400 bg-clip-text text-transparent">
            barbería necesita
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Citas, pagos, inventario y WhatsApp en una sola plataforma.
          <br className="hidden sm:block" />
          Gratis, sin límites y de código abierto.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3.5 font-semibold hover:bg-accent-dark transition-all text-base shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5"
          >
            Comenzar gratis <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/marcovsolis/barber-os"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-semibold hover:bg-white/10 transition-all text-base backdrop-blur-sm hover:-translate-y-0.5"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Ver en GitHub
          </a>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/5 bg-white/5">
          {stats.map(({ value, label }) => (
            <div key={label} className="bg-[#0d0d1a]/60 backdrop-blur-sm px-6 py-5 text-center">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">Funcionalidades</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Todo en una sola app</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Cada módulo fue diseñado específicamente para el flujo de trabajo de una barbería moderna.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-all hover:-translate-y-1 overflow-hidden"
            >
              {/* Gradient glow on hover */}
              <div className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${color} blur-2xl`} style={{ opacity: 0.04 }} />

              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} mb-4 shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Included ── */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left */}
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">Sin límites</p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                Todo incluido,<br />desde el primer día
              </h2>
              <p className="text-gray-400 mt-4 leading-relaxed">
                BarberOS tiene todo lo que necesita tu barbería desde el inicio. Sin restricciones de citas, barberos ni clientes.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 self-start rounded-xl bg-accent px-6 py-3 font-semibold hover:bg-accent-dark transition-all text-sm shadow-lg shadow-accent/20 hover:-translate-y-0.5"
              >
                Crear mi barbería <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right */}
            <div className="border-t md:border-t-0 md:border-l border-white/5 p-10 md:p-14">
              <p className="text-sm font-semibold text-gray-300 mb-6">Incluye todo esto:</p>
              <ul className="space-y-3">
                {included.map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-6 py-24 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Listo para modernizar tu barbería
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Configúralo en 2 minutos. Sin tarjeta de crédito, sin contratos.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 font-bold hover:bg-accent-dark transition-all text-base shadow-xl shadow-accent/30 hover:shadow-accent/50 hover:-translate-y-0.5"
            >
              Empezar gratis ahora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-600">Sin contratos · Sin tarjeta de crédito · Sin límites</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-accent">
              <Scissors className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold">BarberOS</span>
            <span className="text-xs text-gray-600 ml-2">v0.1.0</span>
          </div>
          <p className="text-xs text-gray-600 text-center">
            Código disponible en{' '}
            <a
              href="https://github.com/marcovsolis/barber-os"
              className="text-gray-400 hover:text-white transition-colors underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            {' '}· Hecho para barberías modernas
          </p>
        </div>
      </footer>

    </div>
  )
}
