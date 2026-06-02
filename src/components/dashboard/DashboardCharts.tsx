'use client'

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

// ── Brand colors ──────────────────────────────────────────────
const ACCENT   = '#e94560'
const BRAND    = '#1a1a2e'
const GRAY     = '#e5e7eb'
const BAR_COLORS = ['#e94560', '#4f6ef7', '#10b981', '#f59e0b', '#8b5cf6']

// ── Types ──────────────────────────────────────────────────────
interface RevenueTrendPoint { date: string; amount: number }
interface TopService        { name: string; count: number }
interface PeakHour          { hour: string; citas: number }

interface DashboardChartsProps {
  revenueTrend: RevenueTrendPoint[]
  topServices:  TopService[]
  peakHours:    PeakHour[]
  currency:     string
}

// ── Tooltip formatters ────────────────────────────────────────

function RevenueTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-600 mb-0.5">{label}</p>
      <p className="font-bold text-accent">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  )
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-600 mb-0.5">{label}</p>
      <p className="font-bold text-brand-900">{payload[0].value} citas</p>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
      <h3 className="text-sm font-semibold text-brand-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function DashboardCharts({
  revenueTrend, topServices, peakHours, currency,
}: DashboardChartsProps) {
  const hasRevenue  = revenueTrend.some(d => d.amount > 0)
  const hasServices = topServices.length > 0
  const hasPeak     = peakHours.some(h => h.citas > 0)

  if (!hasRevenue && !hasServices && !hasPeak) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">
        Aún no hay datos suficientes para mostrar analítica.
        <br />Registra citas y cobros para ver los gráficos.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-brand-900">Analítica — últimos 30 días</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue trend — last 7 days */}
        <ChartCard title="Ingresos últimos 7 días">
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRAY} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => formatCurrency(v, currency).replace(/\.00$/, '')} />
                <Tooltip content={<RevenueTooltip currency={currency} />} />
                <Line
                  type="monotone" dataKey="amount" stroke={ACCENT}
                  strokeWidth={2.5} dot={{ fill: ACCENT, r: 3 }} activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Sin ingresos esta semana" />
          )}
        </ChartCard>

        {/* Top services */}
        <ChartCard title="Servicios más solicitados">
          {hasServices ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topServices} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRAY} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100}
                  tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {topServices.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Sin servicios registrados aún" />
          )}
        </ChartCard>

        {/* Peak hours */}
        <ChartCard title="Horas pico de citas">
          {hasPeak ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakHours} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRAY} vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="citas" fill={BRAND} radius={[4, 4, 0, 0]}>
                  {peakHours.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.citas === Math.max(...peakHours.map(h => h.citas)) && entry.citas > 0
                        ? ACCENT : BRAND}
                      opacity={entry.citas === 0 ? 0.15 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Sin datos de horas pico aún" />
          )}
        </ChartCard>

        {/* Summary stats */}
        <ChartCard title="Resumen del período">
          <div className="grid grid-cols-2 gap-3 h-[200px] content-center">
            {[
              {
                label: 'Ingresos 7 días',
                value: formatCurrency(revenueTrend.reduce((s, d) => s + d.amount, 0), currency),
                color: 'text-accent',
              },
              {
                label: 'Servicio top',
                value: topServices[0]?.name ?? '—',
                color: 'text-brand-900',
              },
              {
                label: 'Hora más ocupada',
                value: hasPeak
                  ? peakHours.reduce((a, b) => b.citas > a.citas ? b : a).hour
                  : '—',
                color: 'text-brand-900',
              },
              {
                label: 'Total citas (30d)',
                value: String(peakHours.reduce((s, h) => s + h.citas, 0)),
                color: 'text-brand-900',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`font-bold text-sm leading-tight ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </ChartCard>

      </div>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-gray-300 text-xs">
      {label}
    </div>
  )
}
