import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Design System — BarberOS' }

// ── Helpers ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-800 pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 items-start">
      <span className="text-xs text-gray-400">{label}</span>
      <code className="text-xs bg-gray-800 text-gray-300 rounded px-2 py-0.5">{value}</code>
    </div>
  )
}

// ── Color palette ──────────────────────────────────────────────

const brandColors = [
  { name: 'brand-50',  hex: '#f0f4ff', tw: 'bg-[#f0f4ff]', text: 'text-gray-800' },
  { name: 'brand-100', hex: '#dde7ff', tw: 'bg-[#dde7ff]', text: 'text-gray-800' },
  { name: 'brand-200', hex: '#c3d3ff', tw: 'bg-[#c3d3ff]', text: 'text-gray-800' },
  { name: 'brand-300', hex: '#9db4ff', tw: 'bg-[#9db4ff]', text: 'text-gray-800' },
  { name: 'brand-400', hex: '#7490ff', tw: 'bg-[#7490ff]', text: 'text-white'    },
  { name: 'brand-500', hex: '#4f6ef7', tw: 'bg-[#4f6ef7]', text: 'text-white'    },
  { name: 'brand-600', hex: '#3a51ed', tw: 'bg-[#3a51ed]', text: 'text-white'    },
  { name: 'brand-700', hex: '#2f3fd9', tw: 'bg-[#2f3fd9]', text: 'text-white'    },
  { name: 'brand-800', hex: '#2b35b0', tw: 'bg-[#2b35b0]', text: 'text-white'    },
  { name: 'brand-900', hex: '#1a1a2e', tw: 'bg-[#1a1a2e]', text: 'text-white'    },
  { name: 'brand-950', hex: '#0d0d1a', tw: 'bg-[#0d0d1a]', text: 'text-white'    },
]

const accentColors = [
  { name: 'accent',       hex: '#e94560', tw: 'bg-[#e94560]', text: 'text-white' },
  { name: 'accent-light', hex: '#ff6b82', tw: 'bg-[#ff6b82]', text: 'text-white' },
  { name: 'accent-dark',  hex: '#c02040', tw: 'bg-[#c02040]', text: 'text-white' },
]

const uiColors = [
  { name: 'gray-50',  hex: '#f9fafb', tw: 'bg-gray-50',  text: 'text-gray-800' },
  { name: 'gray-100', hex: '#f3f4f6', tw: 'bg-gray-100', text: 'text-gray-800' },
  { name: 'gray-200', hex: '#e5e7eb', tw: 'bg-gray-200', text: 'text-gray-800' },
  { name: 'gray-400', hex: '#9ca3af', tw: 'bg-gray-400', text: 'text-white'    },
  { name: 'gray-500', hex: '#6b7280', tw: 'bg-gray-500', text: 'text-white'    },
  { name: 'gray-700', hex: '#374151', tw: 'bg-gray-700', text: 'text-white'    },
  { name: 'gray-800', hex: '#1f2937', tw: 'bg-gray-800', text: 'text-white'    },
  { name: 'gray-900', hex: '#111827', tw: 'bg-gray-900', text: 'text-white'    },
]

const statusColors = [
  { name: 'green-500',  hex: '#22c55e', tw: 'bg-green-500',  text: 'text-white', label: 'Éxito / Activo'  },
  { name: 'yellow-400', hex: '#facc15', tw: 'bg-yellow-400', text: 'text-gray-900', label: 'Advertencia' },
  { name: 'red-500',    hex: '#ef4444', tw: 'bg-red-500',    text: 'text-white', label: 'Error / Peligro' },
  { name: 'blue-500',   hex: '#3b82f6', tw: 'bg-blue-500',   text: 'text-white', label: 'Información'    },
  { name: 'orange-500', hex: '#f97316', tw: 'bg-orange-500', text: 'text-white', label: 'Alerta stock'   },
]

// ── Page ───────────────────────────────────────────────────────

export default function DesignPage() {
  return (
    <div className="space-y-12 pb-16">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Design System</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Colores, tipografía, componentes y tokens de diseño usados en BarberOS.
        </p>
      </div>

      {/* ── Colors ── */}
      <Section title="Colores — Brand (Azul índigo)">
        <div className="grid grid-cols-3 sm:grid-cols-6 xl:grid-cols-11 gap-2">
          {brandColors.map(c => (
            <div key={c.name} className="flex flex-col gap-1">
              <div className={`${c.tw} ${c.text} h-16 rounded-xl flex items-end p-2`}>
                <span className="text-[10px] font-mono leading-tight opacity-80">{c.hex}</span>
              </div>
              <span className="text-[11px] text-gray-300">{c.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Colores — Accent (Rojo coral)">
        <div className="flex gap-3">
          {accentColors.map(c => (
            <div key={c.name} className="flex flex-col gap-1">
              <div className={`${c.tw} ${c.text} h-16 w-28 rounded-xl flex items-end p-2`}>
                <span className="text-[10px] font-mono leading-tight opacity-80">{c.hex}</span>
              </div>
              <span className="text-[11px] text-gray-300">{c.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Colores — Grises UI">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {uiColors.map(c => (
            <div key={c.name} className="flex flex-col gap-1">
              <div className={`${c.tw} ${c.text} h-14 rounded-xl flex items-end p-2`}>
                <span className="text-[10px] font-mono leading-tight opacity-80">{c.hex}</span>
              </div>
              <span className="text-[11px] text-gray-300">{c.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Colores — Estados">
        <div className="flex flex-wrap gap-3">
          {statusColors.map(c => (
            <div key={c.name} className="flex flex-col gap-1">
              <div className={`${c.tw} ${c.text} h-14 w-32 rounded-xl flex flex-col items-start justify-end p-2`}>
                <span className="text-[10px] font-mono leading-tight opacity-80">{c.hex}</span>
              </div>
              <span className="text-[11px] text-gray-300">{c.name}</span>
              <span className="text-[10px] text-gray-500">{c.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Typography ── */}
      <Section title="Tipografía">
        <div className="bg-gray-900 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Font family</p>
            <p className="text-white font-sans text-lg">Inter, system-ui, sans-serif</p>
            <code className="text-xs text-gray-400 font-mono">font-sans (Tailwind default override)</code>
          </div>

          <div className="space-y-4 border-t border-gray-800 pt-4">
            {[
              { label: 'text-2xl font-bold — Títulos de página', cls: 'text-2xl font-bold text-white' },
              { label: 'text-xl font-semibold — Subtítulos', cls: 'text-xl font-semibold text-white' },
              { label: 'text-lg font-medium — Sección', cls: 'text-lg font-medium text-white' },
              { label: 'text-base — Cuerpo normal', cls: 'text-base text-gray-200' },
              { label: 'text-sm — Texto secundario', cls: 'text-sm text-gray-400' },
              { label: 'text-xs — Labels y metadatos', cls: 'text-xs text-gray-500' },
              { label: 'text-xs uppercase tracking-widest — Headers de tabla', cls: 'text-xs uppercase tracking-widest font-bold text-gray-400' },
            ].map((t, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4 border-b border-gray-800 pb-3 last:border-0">
                <p className={t.cls}>BarberOS — Texto de ejemplo</p>
                <code className="text-[10px] text-gray-600 shrink-0 font-mono">{t.label.split(' — ')[0]}</code>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Spacing & Radius ── */}
      <Section title="Espaciado y Bordes">
        <div className="bg-gray-900 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Chip label="Border radius base" value="rounded-lg (8px)" />
          <Chip label="Border radius card" value="rounded-2xl (16px)" />
          <Chip label="Border radius full" value="rounded-full" />
          <Chip label="Border radius 4xl" value="rounded-4xl (32px)" />
          <Chip label="Padding página" value="p-6 (24px)" />
          <Chip label="Gap de grillas" value="gap-4 / gap-6" />
          <Chip label="Stack vertical" value="space-y-4 / space-y-6" />
          <Chip label="Scrollbar" value="6px, thumb gray-300" />
        </div>
      </Section>

      {/* ── Buttons ── */}
      <Section title="Botones">
        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-900 text-white px-4 h-9 text-sm font-medium hover:bg-brand-800 transition-colors">
              default
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#e94560] text-white px-4 h-9 text-sm font-medium hover:bg-[#c02040] transition-colors">
              accent
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-brand-900 text-brand-900 bg-transparent px-4 h-9 text-sm font-medium hover:bg-brand-50 transition-colors">
              outline
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg text-brand-900 px-4 h-9 text-sm font-medium hover:bg-brand-50 transition-colors">
              ghost
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 h-9 text-sm font-medium hover:bg-red-700 transition-colors">
              danger
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-50 text-brand-900 px-4 h-9 text-sm font-medium hover:bg-brand-100 transition-colors">
              secondary
            </button>
          </div>
          <div className="flex flex-wrap gap-3 items-center border-t border-gray-800 pt-4">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-900 text-white px-3 h-8 text-xs font-medium">sm</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-900 text-white px-4 h-9 text-sm font-medium">md (default)</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-900 text-white px-6 h-11 text-base font-medium">lg</button>
            <button className="inline-flex items-center justify-center rounded-lg bg-brand-900 text-white h-9 w-9 text-sm font-medium">ic</button>
          </div>
          <div className="pt-2 border-t border-gray-800">
            <code className="text-xs text-gray-500 font-mono">import {'{ Button }'} from '@/components/ui/button'</code>
          </div>
        </div>
      </Section>

      {/* ── Badges ── */}
      <Section title="Badges">
        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="default">default</Badge>
            <Badge variant="success">success</Badge>
            <Badge variant="warning">warning</Badge>
            <Badge variant="danger">danger</Badge>
            <Badge variant="info">info</Badge>
            <Badge variant="outline">outline</Badge>
          </div>
          <div className="pt-2 border-t border-gray-800 space-y-1">
            <p className="text-xs text-gray-500">Usos en la app:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Completada</Badge>
              <Badge variant="info">Confirmada</Badge>
              <Badge variant="warning">En progreso</Badge>
              <Badge variant="danger">Cancelada</Badge>
              <Badge variant="outline">No asistió</Badge>
              <Badge variant="danger">Stock bajo</Badge>
              <Badge variant="success">Pagado</Badge>
            </div>
          </div>
          <code className="text-xs text-gray-500 font-mono block">import {'{ Badge }'} from '@/components/ui/badge'</code>
        </div>
      </Section>

      {/* ── Cards ── */}
      <Section title="Cards">
        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Basic card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Card básica</p>
              <p className="text-2xl font-bold text-brand-900">$12,500</p>
              <p className="text-sm text-gray-500 mt-1">Ingresos del mes</p>
            </div>
            {/* Highlighted card */}
            <div className="bg-brand-900 rounded-2xl p-4 text-white">
              <p className="text-xs text-brand-300 uppercase tracking-widest mb-1">Card destacada</p>
              <p className="text-2xl font-bold">48</p>
              <p className="text-sm text-brand-300 mt-1">Citas este mes</p>
            </div>
          </div>
          <code className="text-xs text-gray-500 font-mono block">import {'{ Card, CardContent, CardHeader, CardTitle }'} from '@/components/ui/card'</code>
        </div>
      </Section>

      {/* ── Form elements ── */}
      <Section title="Formularios">
        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Input normal</label>
              <input
                type="text"
                placeholder="Escribe aquí..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Select</label>
              <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option>Opción 1</option>
                <option>Opción 2</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Input con error</label>
              <input
                type="text"
                defaultValue="Texto inválido"
                className="w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <p className="text-xs text-red-500">Este campo es requerido</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Textarea</label>
              <textarea
                rows={3}
                placeholder="Notas..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>
          <code className="text-xs text-gray-500 font-mono block">import {'{ FormField, FormError }'} from '@/components/ui/form-field'</code>
        </div>
      </Section>

      {/* ── Shadows & Tokens ── */}
      <Section title="Sombras y tokens">
        <div className="bg-gray-900 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Chip label="Shadow card" value="shadow-sm" />
          <Chip label="Shadow modal" value="shadow-xl" />
          <Chip label="Sidebar width" value="w-64 (256px)" />
          <Chip label="Z-index modal" value="z-50" />
          <Chip label="Z-index tooltip" value="z-50" />
          <Chip label="Transición" value="transition-colors" />
          <Chip label="Focus ring" value="ring-brand-500 / ring-2" />
          <Chip label="Animación spin" value="animate-spin" />
        </div>
      </Section>

    </div>
  )
}
