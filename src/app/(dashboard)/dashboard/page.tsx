import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, formatCurrency } from '@/lib/utils'
import { getShop } from '@/lib/shop'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Users, AlertTriangle } from 'lucide-react'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { CurrencyIcon } from '@/components/ui/currency-icon'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'

export const metadata = { title: 'Inicio' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const admin    = createAdminClient()
  const shop     = await getShop()
  const currency = shop?.currency ?? 'MXN'
  const today    = new Date()
  const dateStr  = today.toISOString().split('T')[0]
  const from     = `${dateStr}T00:00:00.000Z`
  const to       = `${dateStr}T23:59:59.999Z`

  // Last 7 days window for trend data
  const d7 = new Date(today); d7.setDate(today.getDate() - 6)
  const from7 = `${d7.toISOString().split('T')[0]}T00:00:00.000Z`

  // Last 30 days window for service + hour analytics
  const d30 = new Date(today); d30.setDate(today.getDate() - 29)
  const from30 = `${d30.toISOString().split('T')[0]}T00:00:00.000Z`

  // Fetch everything in parallel
  const [
    { data: todayAppts },
    { data: todayPayments },
    { data: payments7d },
    { data: appts30d },
  ] = await Promise.all([
    supabase.from('appointments').select('id, status').gte('starts_at', from).lte('starts_at', to),
    supabase.from('payments').select('amount').eq('status', 'paid').gte('created_at', from).lte('created_at', to),
    admin.from('payments').select('amount, paid_at').eq('status', 'paid').gte('paid_at', from7),
    admin.from('appointments').select('service_name, starts_at, status').gte('starts_at', from30),
  ])

  const totalRevenue = (todayPayments ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const completed    = (todayAppts ?? []).filter(a => a.status === 'completed').length
  const totalAppts   = (todayAppts ?? []).length

  // ── Analytics: revenue by day (last 7d) ──────────────────────
  const revenueByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    revenueByDay[d.toISOString().split('T')[0]] = 0
  }
  ;(payments7d ?? []).forEach(p => {
    const day = (p.paid_at ?? '').slice(0, 10)
    if (day in revenueByDay) revenueByDay[day] += Number(p.amount)
  })
  const revenueTrend = Object.entries(revenueByDay).map(([date, amount]) => ({
    date: new Date(`${date}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
    amount,
  }))

  // ── Analytics: top services (last 30d, non-cancelled) ────────
  const serviceCount: Record<string, number> = {}
  ;(appts30d ?? []).filter(a => a.status !== 'cancelled' && a.status !== 'no_show').forEach(a => {
    if (a.service_name) serviceCount[a.service_name] = (serviceCount[a.service_name] ?? 0) + 1
  })
  const topServices = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // ── Analytics: peak hours (last 30d, non-cancelled) ──────────
  const hourCount: Record<number, number> = {}
  ;(appts30d ?? []).filter(a => a.status !== 'cancelled').forEach(a => {
    const h = a.starts_at ? new Date(a.starts_at).getHours() : -1
    if (h >= 0) hourCount[h] = (hourCount[h] ?? 0) + 1
  })
  const peakHours = Array.from({ length: 13 }, (_, i) => i + 8).map(h => ({
    hour: `${h}:00`,
    citas: hourCount[h] ?? 0,
  }))

  // ── Analytics: cancellation rate (last 30d) ──────────────────
  const total30    = (appts30d ?? []).length
  const cancelled30 = (appts30d ?? []).filter(a => a.status === 'cancelled' || a.status === 'no_show').length
  const cancelRate = total30 > 0 ? Math.round((cancelled30 / total30) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          Inicio
          <HelpTooltip text="Resumen general de tu barbería: citas de hoy, ingresos del mes, clientes activos y productos con stock bajo." position="bottom" />
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{formatDate(today)}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={<Calendar className="h-5 w-5 text-blue-600" />}
          label="Citas de hoy"
          value={String(totalAppts)}
          sub={`${completed} completadas`}
          bg="bg-blue-50"
        />
        <KpiCard
          icon={<CurrencyIcon currency={currency} className="h-5 w-5 text-green-600" />}
          label="Ingresos del día"
          value={formatCurrency(totalRevenue, currency)}
          sub={`${(todayPayments ?? []).length} cobros registrados`}
          bg="bg-green-50"
        />
        <KpiCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          label="Ocupación"
          value={totalAppts ? `${Math.round((completed / totalAppts) * 100)}%` : '—'}
          sub="de slots completados"
          bg="bg-purple-50"
        />
        <KpiCard
          icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
          label="Cancelaciones (30d)"
          value={`${cancelRate}%`}
          sub={`${cancelled30} de ${total30} citas`}
          bg="bg-yellow-50"
        />
      </div>

      {/* Analytics charts */}
      <DashboardCharts
        revenueTrend={revenueTrend}
        topServices={topServices}
        peakHours={peakHours}
        currency={currency}
      />
    </div>
  )
}

function KpiCard({
  icon, label, value, sub, bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  bg: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-brand-900 leading-tight">{value}</p>
          <p className="text-xs text-gray-400 truncate">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}
