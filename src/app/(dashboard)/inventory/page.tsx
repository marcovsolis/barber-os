import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { LowStockAlert } from '@/components/inventory/LowStockAlert'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import type { InventoryItem, LowStockAlert as LowStockAlertType } from '@/types'

export const metadata = { title: 'Inventario' }

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true })

  const typedItems = (items ?? []) as unknown as InventoryItem[]
  const alerts: LowStockAlertType[] = typedItems
    .filter(item => item.stock <= item.minStock)
    .map(item => ({ item, shortage: item.minStock - item.stock }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Inventario</h1>
        <p className="text-sm text-gray-500 mt-0.5">{typedItems.length} productos registrados</p>
      </div>

      {/* Low stock alerts */}
      <LowStockAlert alerts={alerts} />

      {/* Product list */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Producto', 'Stock', 'Mínimo', 'Costo/u', 'Proveedor'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {typedItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No hay productos. Agrega tu primer insumo.
                </td>
              </tr>
            )}
            {typedItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-900">{item.name}</p>
                  {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={
                    item.stock <= item.minStock
                      ? 'font-bold text-yellow-700'
                      : 'text-gray-700'
                  }>
                    {item.stock} {item.unit}
                  </span>
                  {item.stock <= item.minStock && (
                    <AlertTriangle className="inline h-3.5 w-3.5 ml-1 text-yellow-500" />
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{item.minStock} {item.unit}</td>
                <td className="px-4 py-3 text-gray-500">
                  {item.costPerUnit ? formatCurrency(item.costPerUnit) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">{item.supplier ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
