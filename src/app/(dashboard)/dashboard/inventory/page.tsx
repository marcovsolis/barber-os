import { createClient } from '@/lib/supabase/server'
import { LowStockAlert } from '@/components/inventory/LowStockAlert'
import { InventoryClient } from '@/components/inventory/InventoryClient'
import type { InventoryItem, InventoryMovement, LowStockAlert as LowStockAlertType } from '@/types'

export const metadata = { title: 'Inventario' }

export default async function InventoryPage() {
  const supabase = await createClient()

  const [{ data: itemsRaw }, { data: movementsRaw }] = await Promise.all([
    supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true }),
    supabase
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const items      = (itemsRaw      ?? []) as unknown as InventoryItem[]
  const movements  = (movementsRaw  ?? []) as unknown as InventoryMovement[]
  const alerts: LowStockAlertType[] = items
    .filter(i => i.stock <= i.minStock)
    .map(i => ({ item: i, shortage: i.minStock - i.stock }))

  return (
    <div>
      {alerts.length > 0 && (
        <div className="px-6 pt-6">
          <LowStockAlert alerts={alerts} />
        </div>
      )}
      <InventoryClient items={items} movements={movements} />
    </div>
  )
}
