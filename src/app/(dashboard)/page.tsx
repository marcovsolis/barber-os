import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, DollarSign, Users, AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Inicio' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const today    = new Date()
  const dateStr  = today.toISOString().split('T')[0]
  const from     = `${dateStr}T00:00:00.000Z`
  const to       = `${dateStr}T23:59:59.999Z`

  // Fetch today's stats in parallel
  const [{ data: appointments }, { data: payments }, { data: lowStock }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, status')
      .gte('starts_at', from)
      .lte('starts_at', to),
    supabase
      .from('payments')
      .select('amount, method')
      .eq('status', 'paid')
      .gte('created_at', from)
      .lte('created_at', to),
    supabase
      .from('inventory_items')
      .select('id, name, stock, min_stock')
      .filter('stock', 'lte', 'min_stock'),
  ])

  const totalRevenue = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const completed    = (appointments ?? []).filter(a => a.status === 'completed').length
  const totalAppts   = (appointments ?? []).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Inicio</h1>
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
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          label="Ingresos del día"
          value={formatCurrency(totalRevenue)}
          sub={`${(payments ?? []).length} cobros registrados`}
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
          label="Alertas de stock"
          value={String((lowStock ?? []).length)}
          sub="productos por debajo del mínimo"
          bg="bg-yellow-50"
        />
      </div>

      {/* Quick links */}
      <p className="text-sm text-gray-400">
        Ve a <strong>Citas</strong> para gestionar la agenda del día o a <strong>Inventario</strong> para revisar el stock.
      </p>
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
