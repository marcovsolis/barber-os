import {
  Calendar, Users, CreditCard, Package,
  Settings, Bell, BookOpen, ChevronRight,
  CheckCircle2, Scissors, BarChart2, Lock,
} from 'lucide-react'

export const metadata = { title: 'Ayuda — BarberOS' }

// ── Types ─────────────────────────────────────────────────────

interface HelpItem {
  icon:  React.ReactNode
  title: string
  desc:  string
}

interface Section {
  id:    string
  icon:  React.ReactNode
  color: string
  title: string
  desc:  string
  items: HelpItem[]
  tips?: string[]
}

// ── Content ────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id:    'appointments',
    icon:  <Calendar className="h-6 w-6" />,
    color: 'bg-brand-500',
    title: 'Citas',
    desc:  'El corazón de tu barbería. Aquí gestionas todo el flujo de trabajo diario.',
    items: [
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Nueva cita', desc: 'Haz clic en "+ Nueva cita" para agendar. Selecciona el barbero, servicio, fecha/hora y datos del cliente.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Navegar fechas', desc: 'Usa las flechas ← → para moverte día a día, o haz clic en "Hoy" para volver a la fecha actual.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Estados de cita', desc: 'Cada cita puede estar: Confirmada → En progreso → Completada. También puedes marcarla como Cancelada o No asistió.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Cobrar cita', desc: 'Al completar una cita aparece el botón de cobro. Ahí registras el monto, método de pago y descuentos.' },
      { icon: <Lock className="h-4 w-4 text-orange-500" />, title: 'Bloquear horario', desc: 'Usa "Bloquear" para reservar un horario (vacaciones, descanso, etc.) y que no aparezca como disponible en la página de reservas.' },
    ],
    tips: [
      'Los clientes nuevos se crean automáticamente al agendar su primera cita.',
      'Puedes editar cualquier cita antes de que se complete.',
      'Los recordatorios de WhatsApp se envían automáticamente 24h y 30min antes.',
    ],
  },
  {
    id:    'clients',
    icon:  <Users className="h-6 w-6" />,
    color: 'bg-purple-500',
    title: 'Clientes',
    desc:  'Base de datos de todos tus clientes con su historial completo.',
    items: [
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Registro automático', desc: 'Los clientes se agregan solos cuando agendas una cita. No necesitas crearlos manualmente.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Perfil del cliente', desc: 'Haz clic en un cliente para ver su historial completo: visitas, gasto total, servicios favoritos y notas privadas.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Notas privadas', desc: 'Agrega notas internas sobre preferencias del cliente (ej: "le gusta el corte bajo en los lados"). Solo tú las ves.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Búsqueda', desc: 'Busca clientes por nombre o teléfono usando la barra de búsqueda.' },
    ],
    tips: [
      'Los clientes se identifican por teléfono + nombre.',
      'El gasto total incluye todos los cobros registrados en el sistema.',
    ],
  },
  {
    id:    'payments',
    icon:  <CreditCard className="h-6 w-6" />,
    color: 'bg-green-500',
    title: 'Pagos',
    desc:  'Historial financiero y herramientas de cobro para tu barbería.',
    items: [
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Registrar cobro', desc: 'Los cobros se registran desde la pantalla de Citas al marcar una cita como completada.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Métodos de pago', desc: 'Puedes registrar pagos en efectivo, tarjeta, transferencia u otros métodos.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Filtros de periodo', desc: 'Filtra por Hoy, Esta semana o Este mes para ver tus ingresos en diferentes períodos.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Exportar a Excel', desc: 'Usa el botón "Exportar" para descargar un archivo Excel con todos los cobros y el cálculo de comisiones por barbero.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Deudas', desc: 'Si un cliente no pagó en el momento, puedes marcarlo como "Deuda" para cobrarlo después.' },
    ],
    tips: [
      'El Excel incluye dos hojas: Cobros detallados y Comisiones por barbero.',
      'Las comisiones se calculan automáticamente según el porcentaje configurado en cada barbero.',
    ],
  },
  {
    id:    'inventory',
    icon:  <Package className="h-6 w-6" />,
    color: 'bg-orange-500',
    title: 'Inventario',
    desc:  'Control de stock de todos los productos que usa tu barbería.',
    items: [
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Agregar producto', desc: 'Registra los productos que usas: ceras, shampoos, navajas, etc. Define la unidad de medida (ml, g, unidad).' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Stock mínimo', desc: 'Configura un mínimo para cada producto. Cuando el stock baje de ese número, recibirás una alerta en el dashboard.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Movimientos', desc: 'Registra entradas (compras) y salidas (uso) para mantener el stock actualizado.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Alertas de stock bajo', desc: 'En el Inicio verás una alerta con todos los productos que necesitan reabastecimiento.' },
    ],
    tips: [
      'Actualiza el stock regularmente para que las alertas sean precisas.',
      'Puedes registrar el costo por unidad para calcular tu margen de ganancia.',
    ],
  },
  {
    id:    'settings',
    icon:  <Settings className="h-6 w-6" />,
    color: 'bg-gray-600',
    title: 'Ajustes',
    desc:  'Configura tu barbería, barberos, servicios y horarios.',
    items: [
      { icon: <Scissors className="h-4 w-4 text-brand-500" />, title: 'Mi barbería', desc: 'Edita el nombre, slug (URL de tu página de reservas), teléfono, dirección y zona horaria.' },
      { icon: <Scissors className="h-4 w-4 text-brand-500" />, title: 'Barberos', desc: 'Agrega o edita barberos. Cada barbero tiene su color en el calendario, horario y comisión configurada.' },
      { icon: <Scissors className="h-4 w-4 text-brand-500" />, title: 'Horarios', desc: 'Define qué días trabaja cada barbero y en qué horario. Los slots de tu página de reservas se generan en base a esto.' },
      { icon: <Scissors className="h-4 w-4 text-brand-500" />, title: 'Servicios', desc: 'Crea y edita los servicios que ofreces: nombre, precio, duración y tiempo de descanso entre citas.' },
      { icon: <Scissors className="h-4 w-4 text-brand-500" />, title: 'WhatsApp', desc: 'Conecta tu API de WhatsApp para enviar confirmaciones y recordatorios automáticos a los clientes.' },
    ],
    tips: [
      'El slug define tu URL pública: barberos.app/book/tu-slug',
      'El "break after" en servicios agrega tiempo extra al final para que el barbero descanse entre citas.',
      'La comisión del barbero se usa en el cálculo del reporte de pagos.',
    ],
  },
  {
    id:    'reminders',
    icon:  <Bell className="h-6 w-6" />,
    color: 'bg-yellow-500',
    title: 'Recordatorios',
    desc:  'Sistema automático de recordatorios por WhatsApp para reducir los no-shows.',
    items: [
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Recordatorio 24h', desc: 'Se envía automáticamente el día anterior a la cita para que el cliente no se olvide.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Recordatorio 30min', desc: 'Se envía 30 minutos antes para confirmar que el cliente está en camino.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Envío manual', desc: 'Si no tienes API configurada, los recordatorios pendientes aparecen en la pantalla de Citas con un botón de WhatsApp para enviarlos con un clic.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Confirmación de cita', desc: 'Al crear una cita desde el dashboard, se envía automáticamente una confirmación al cliente.' },
    ],
    tips: [
      'Los recordatorios automáticos requieren configurar una API key de 360dialog en Ajustes.',
      'Sin API, puedes enviarlos manualmente desde la pantalla de Citas con un solo clic.',
    ],
  },
  {
    id:    'booking',
    icon:  <BookOpen className="h-6 w-6" />,
    color: 'bg-teal-500',
    title: 'Página de reservas',
    desc:  'Tu página pública donde los clientes pueden agendar citas por su cuenta.',
    items: [
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'URL pública', desc: 'Tu página de reservas está en: /book/tu-slug. Compártela en WhatsApp, Instagram o donde quieras.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Sin registro', desc: 'Los clientes no necesitan crear cuenta. Solo eligen barbero, servicio, fecha y dejan su nombre y teléfono.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Slots en tiempo real', desc: 'Los horarios disponibles se calculan automáticamente según el horario del barbero y las citas ya agendadas.' },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, title: 'Confirmación', desc: 'Al reservar, el cliente recibe un mensaje de WhatsApp de confirmación (si la API está configurada).' },
    ],
    tips: [
      'Configura bien los horarios y servicios en Ajustes para que la página muestre la info correcta.',
      'Las citas creadas desde la página de reservas aparecen en el dashboard marcadas como "booking_page".',
    ],
  },
]

// ── Component ──────────────────────────────────────────────────

function SectionCard({ section }: { section: Section }) {
  return (
    <div id={section.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`${section.color} px-6 py-4 flex items-center gap-3`}>
        <div className="text-white">{section.icon}</div>
        <div>
          <h2 className="text-lg font-bold text-white">{section.title}</h2>
          <p className="text-sm text-white/80">{section.desc}</p>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100">
        {section.items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 px-6 py-4">
            <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {section.tips && section.tips.length > 0 && (
        <div className="bg-brand-50 px-6 py-4 border-t border-gray-200">
          <p className="text-xs font-bold text-brand-700 uppercase tracking-wide mb-2">💡 Tips</p>
          <ul className="space-y-1">
            {section.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-brand-800">
                <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5 text-brand-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-brand-500" />
          Centro de ayuda
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Guía completa de todas las funciones de BarberOS.
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2">
        {sections.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-brand-400 hover:text-brand-700 transition-colors shadow-sm"
          >
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${s.color} text-white`}>
              <BarChart2 className="h-2.5 w-2.5" />
            </span>
            {s.title}
          </a>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map(s => (
          <SectionCard key={s.id} section={s} />
        ))}
      </div>
    </div>
  )
}
