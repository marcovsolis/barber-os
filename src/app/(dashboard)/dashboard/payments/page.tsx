import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency, getPaymentMethodLabel } from '@/lib/utils'
import { getShop } from '@/lib/shop'
import {
  CreditCard, Smartphone, Banknote,
  TrendingUp, Receipt, Scissors,
} from 'lucide-react'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CurrencyIcon } from '@/components/ui/currency-icon'
import Link from 'next/link'
import { ExportButton } from '@/components/payments/ExportButton'

export const metadata = { title: 'Pagos' }

type Period = 'today' | 'week' | 'month'

function getPeriodDates(period: Period): { from: string; to: string } {
  const now   = new Date()
  const today = now.toISOString().slice(0, 10)

  if (period === 'today') {
    return { from: `${today}T00:00:00Z`, to: `${today}T23:59:59Z` }
  }
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(now.getDate() - now.getDay())
    return { from: `${d.toISOString().slice(0, 10)}T00:00:00Z`, to: `${today}T23:59:59Z` }
  }
  // month
  return { from: `${today.slice(0, 7)}-01T00:00:00Z`, to: `${today}T23:59:59Z` }
}

// Supabase returns snake_case — keep types consistent with actual response
interface RawPayment {
  id:              string
  amount:          number
  method:          string
  status:          string
  discount_amount: number
  paid_at:         string | null
  notes:           string | null
  appointments: {
    client_name:  string
    service_name: string
    starts_at:    string
    barbers:      { name: string } | null
  } | null
}

interface Props {
  searchParams: Promise<{ period?: string }>
}

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Hoy'    },
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mes'    },
]

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoy',
  week:  'Esta semana',
  month: 'Este mes',
}

const METHOD_BADGE: Record<string, 'success' | 'accent' | 'default' | 'secondary'> = {
  cash:     'success',
  card:     'accent',
  transfer: 'default',
  other:    'secondary',
}

export default async function PaymentsPage({ searchParams }: Props) {
  const { period: rawPeriod } = await searchParams
  const period: Period = (['today', 'week', 'month'].includes(rawPeriod ?? '') ? rawPeriod : 'today') as Period
  const { from, to } = getPeriodDates(period)

  const [supabase, shop] = await Promise.all([createClient(), getShop()])
  const currency = shop?.currency ?? 'MXN'
  const admin    = createAdminClient()

  const { data } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      method,
      status,
      discount_amount,
      paid_at,
      notes,
      appointments (
        client_name,
        service_name,
        starts_at,
        barbers ( name )
      )
    `)
    .gte('paid_at', from)
    .lte('paid_at', to)
    .order('paid_at', { ascending: false })

  const payments = (data ?? []) as unknown as RawPayment[]

  // ── Commissions: fetch barbers + appointments with payments ──
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await admin
    .from('profiles').select('shop_id').eq('id', user!.id).single()
  const shopId = profile?.shop_id as string | undefined

  // Barbers with commission rates
  const { data: barbersData } = shopId
    ? await admin
        .from('barbers')
        .select('id, name, commission_pct')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('name')
    : { data: [] }

  // Paid appointments (joined to payments) for the selected period
  const { data: apptData } = shopId
    ? await admin
        .from('appointments')
        .select('barber_id, payments(amount, status)')
        .eq('shop_id', shopId)
        .gte('starts_at', from)
        .lte('starts_at', to)
    : { data: [] }

  // Build per-barber commission map
  interface BarberCommRow { id: string; name: string; commissionPct: number; revenue: number; count: number; commission: number }

  const barberMap: Record<string, BarberCommRow> = {}
  for (const b of (barbersData ?? []) as any[]) {
    barberMap[b.id] = { id: b.id, name: b.name, commissionPct: b.commission_pct ?? 50, revenue: 0, count: 0, commission: 0 }
  }
  for (const appt of (apptData ?? []) as any[]) {
    const bid = appt.barber_id as string
    if (!bid || !barberMap[bid]) continue
    const pmts = Array.isArray(appt.payments) ? appt.payments : (appt.payments ? [appt.payments] : [])
    for (const p of pmts) {
      if (p.status === 'paid') {
        barberMap[bid].revenue += Number(p.amount)
        barberMap[bid].count   += 1
      }
    }
  }
  // Calculate commission per barber
  const barberComms = Object.values(barberMap).map(b => ({
    ...b,
    commission: Math.round(b.revenue * (b.commissionPct / 100) * 100) / 100,
  })).filter(b => b.count > 0 || true) // show all active barbers

  // ── KPI aggregations ──────────────────────────────────────
  const total    = payments.reduce((s, p) => s + p.amount, 0)
  const cash     = payments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0)
  const card     = payments.filter(p => p.method === 'card').reduce((s, p) => s + p.amount, 0)
  const transfer = payments.filter(p => p.method === 'transfer').reduce((s, p) => s + p.amount, 0)
  const other    = payments.filter(p => p.method === 'other').reduce((s, p) => s + p.amount, 0)
  const debts    = payments.filter(p => p.status === 'debt').length

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            Pagos
            <HelpTooltip text="Historial de todos los cobros registrados. Filtra por día, semana o mes. Puedes exportar a Excel para llevar contabilidad o calcular comisiones de barberos." position="bottom" />
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {payments.length} cobros · {PERIOD_LABELS[period]}
          </p>
        </div>

        {/* Export + Period tabs */}
        <div className="flex items-center gap-2 flex-wrap">
        <ExportButton period={period} />
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {PERIOD_TABS.map(t => (
            <Link
              key={t.key}
              href={`/dashboard/payments?period=${t.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === t.key
                  ? 'bg-brand-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <Card className="col-span-2 lg:col-span-1 border-0 shadow-sm bg-brand-900 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-brand-200">Total cobrado</p>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(total, currency)}</p>
            <p className="text-xs text-brand-300 mt-1">{payments.length} transacciones</p>
          </CardContent>
        </Card>

        {/* Efectivo */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Efectivo</p>
              <Banknote className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-brand-900">{formatCurrency(cash, currency)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {payments.filter(p => p.method === 'cash').length} pagos
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Tarjeta</p>
              <CreditCard className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-brand-900">{formatCurrency(card, currency)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {payments.filter(p => p.method === 'card').length} pagos
            </p>
          </CardContent>
        </Card>

        {/* Transferencia */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Transferencia</p>
              <Smartphone className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-brand-900">{formatCurrency(transfer, currency)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {payments.filter(p => p.method === 'transfer').length} pagos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debt warning */}
      {debts > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-center gap-3 text-sm text-yellow-800">
          <Receipt className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{debts} cita{debts > 1 ? 's' : ''}</span>{' '}
            registrada{debts > 1 ? 's' : ''} como deuda pendiente.
          </span>
        </div>
      )}

      {/* Payments table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <CurrencyIcon currency={currency} className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-brand-900 text-sm">Historial de cobros</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Hora', 'Cliente', 'Servicio', 'Barbero', 'Método', 'Monto'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  <CurrencyIcon currency={currency} className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Sin cobros registrados en este período.
                </td>
              </tr>
            )}

            {payments.map(p => {
              const appt   = p.appointments
              const paidAt = p.paid_at
                ? new Date(p.paid_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                : '—'
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{paidAt}</td>

                  <td className="px-4 py-3 font-medium text-brand-900">
                    {appt?.client_name ?? '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {appt?.service_name ?? '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {appt?.barbers?.name ?? '—'}
                  </td>

                  <td className="px-4 py-3">
                    <Badge variant={METHOD_BADGE[p.method] ?? 'secondary'}>
                      {getPaymentMethodLabel(p.method)}
                    </Badge>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-900">{formatCurrency(p.amount, currency)}</p>
                    {p.discount_amount > 0 && (
                      <p className="text-xs text-gray-400">
                        Desc. {formatCurrency(p.discount_amount, currency)}
                      </p>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals footer */}
        {payments.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap gap-4 items-center justify-between text-sm">
            <div className="flex flex-wrap gap-4 text-gray-600">
              {cash     > 0 && <span>Efectivo: <span className="font-semibold text-green-700">{formatCurrency(cash, currency)}</span></span>}
              {card     > 0 && <span>Tarjeta: <span className="font-semibold text-accent">{formatCurrency(card, currency)}</span></span>}
              {transfer > 0 && <span>Transferencia: <span className="font-semibold text-blue-700">{formatCurrency(transfer, currency)}</span></span>}
              {other    > 0 && <span>Otro: <span className="font-semibold text-gray-700">{formatCurrency(other, currency)}</span></span>}
            </div>
            <p className="font-bold text-brand-900">Total: {formatCurrency(total, currency)}</p>
          </div>
        )}
      </div>

      {/* ── Commissions section ─────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Scissors className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-brand-900 text-sm">Comisiones por barbero</h2>
          <span className="ml-1 text-xs text-gray-400">— {PERIOD_LABELS[period]}</span>
        </div>

        {barberComms.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            No hay barberos activos registrados.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Barbero', 'Servicios cobrados', 'Venta total', 'Comisión %', 'Comisión a pagar'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {barberComms.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-900">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-center">{b.count}</td>
                  <td className="px-4 py-3 font-semibold text-brand-900">
                    {formatCurrency(b.revenue, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                      {b.commissionPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-accent">
                    {formatCurrency(b.commission, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            {barberComms.length > 0 && (
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td className="px-4 py-3 font-bold text-brand-900">Total</td>
                  <td className="px-4 py-3 text-center font-semibold text-brand-900">
                    {barberComms.reduce((s, b) => s + b.count, 0)}
                  </td>
                  <td className="px-4 py-3 font-bold text-brand-900">
                    {formatCurrency(barberComms.reduce((s, b) => s + b.revenue, 0), currency)}
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 font-bold text-accent">
                    {formatCurrency(barberComms.reduce((s, b) => s + b.commission, 0), currency)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  )
}
