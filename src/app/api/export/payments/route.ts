import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ExcelJS from 'exceljs'

// ── Date helpers ──────────────────────────────────────────────

type Period = 'today' | 'week' | 'month'

function getPeriodDates(period: Period): { from: string; to: string; label: string } {
  const now   = new Date()
  const today = now.toISOString().slice(0, 10)

  if (period === 'today') {
    return { from: `${today}T00:00:00Z`, to: `${today}T23:59:59Z`, label: 'Hoy' }
  }
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(now.getDate() - now.getDay())
    return { from: `${d.toISOString().slice(0, 10)}T00:00:00Z`, to: `${today}T23:59:59Z`, label: 'Esta semana' }
  }
  return {
    from:  `${today.slice(0, 7)}-01T00:00:00Z`,
    to:    `${today}T23:59:59Z`,
    label: 'Este mes',
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const METHOD_LABELS: Record<string, string> = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  transfer: 'Transferencia',
  other:    'Otro',
}

// ── Route handler ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id, shops(name, currency)')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const shopId   = profile.shop_id as string
  const shopName = (profile.shops as any)?.name ?? 'Barbería'

  const periodParam = (req.nextUrl.searchParams.get('period') ?? 'month') as Period
  const { from, to, label } = getPeriodDates(periodParam)

  // ── Fetch payments ────────────────────────────────────────
  const { data: payments } = await admin
    .from('payments')
    .select(`
      id, amount, method, status, discount_amount, paid_at, notes,
      appointments(client_name, service_name, starts_at, barbers(name))
    `)
    .eq('shop_id' as any, shopId)
    .gte('paid_at', from)
    .lte('paid_at', to)
    .order('paid_at', { ascending: false })

  // ── Fetch barbers + commissions ───────────────────────────
  const { data: barbers } = await admin
    .from('barbers')
    .select('id, name, commission_pct')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('name')

  const { data: appts } = await admin
    .from('appointments')
    .select('barber_id, payments(amount, status)')
    .eq('shop_id', shopId)
    .gte('starts_at', from)
    .lte('starts_at', to)

  // Build commission map
  const commMap: Record<string, { name: string; pct: number; revenue: number; count: number }> = {}
  for (const b of (barbers ?? []) as any[]) {
    commMap[b.id] = { name: b.name, pct: b.commission_pct ?? 50, revenue: 0, count: 0 }
  }
  for (const a of (appts ?? []) as any[]) {
    const bid = a.barber_id as string
    if (!bid || !commMap[bid]) continue
    const pmts = Array.isArray(a.payments) ? a.payments : (a.payments ? [a.payments] : [])
    for (const p of pmts) {
      if (p.status === 'paid') {
        commMap[bid].revenue += Number(p.amount)
        commMap[bid].count   += 1
      }
    }
  }

  // ── Build workbook with ExcelJS ───────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator = shopName

  // ── Sheet 1: Payments ─────────────────────────────────────
  const ws1 = wb.addWorksheet('Cobros')

  const headers1 = ['Fecha','Hora','Cliente','Servicio','Barbero','Método','Monto','Descuento','Estado','Notas']
  const colWidths1 = [12, 8, 22, 22, 18, 14, 12, 12, 10, 30]

  ws1.addRow(headers1)
  const headerRow1 = ws1.getRow(1)
  headerRow1.font = { bold: true }
  headerRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F6EF7' } }
  headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  colWidths1.forEach((w, i) => { ws1.getColumn(i + 1).width = w })

  let totalMonto = 0
  let totalDescuento = 0

  for (const p of (payments ?? []) as any[]) {
    const appt   = p.appointments
    const barber = Array.isArray(appt?.barbers) ? appt.barbers[0] : appt?.barbers
    const monto  = Number(p.amount)
    const desc   = Number(p.discount_amount ?? 0)
    totalMonto     += monto
    totalDescuento += desc
    ws1.addRow([
      fmtDate(p.paid_at),
      fmtTime(p.paid_at),
      appt?.client_name ?? '—',
      appt?.service_name ?? '—',
      barber?.name ?? '—',
      METHOD_LABELS[p.method] ?? p.method,
      monto,
      desc,
      p.status === 'paid' ? 'Pagado' : p.status === 'debt' ? 'Deuda' : p.status,
      p.notes ?? '',
    ])
  }

  // Totals row
  const totalRow1 = ws1.addRow(['TOTAL','','','','','', totalMonto, totalDescuento,'', `${(payments ?? []).length} cobros · ${label}`])
  totalRow1.font = { bold: true }
  totalRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF0FF' } }

  // ── Sheet 2: Commissions ──────────────────────────────────
  const ws2 = wb.addWorksheet('Comisiones')

  const headers2 = ['Barbero','Servicios cobrados','Venta total','Comisión %','Comisión a pagar']
  const colWidths2 = [22, 20, 16, 12, 18]

  ws2.addRow(headers2)
  const headerRow2 = ws2.getRow(1)
  headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F6EF7' } }
  colWidths2.forEach((w, i) => { ws2.getColumn(i + 1).width = w })

  let totalServicios = 0
  let totalVenta = 0
  let totalComision = 0

  for (const b of Object.values(commMap)) {
    const comision = Math.round(b.revenue * (b.pct / 100) * 100) / 100
    totalServicios += b.count
    totalVenta     += b.revenue
    totalComision  += comision
    ws2.addRow([b.name, b.count, b.revenue, b.pct, comision])
  }

  const totalRow2 = ws2.addRow(['TOTAL', totalServicios, totalVenta, '', totalComision])
  totalRow2.font = { bold: true }
  totalRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF0FF' } }

  // ── Stream as download ────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer()

  const today    = new Date().toISOString().slice(0, 10)
  const filename = `${shopName.replace(/\s+/g, '_')}_pagos_${label.replace(/\s+/g, '_')}_${today}.xlsx`

  return new NextResponse(buf as Buffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
