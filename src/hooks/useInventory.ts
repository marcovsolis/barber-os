'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem, LowStockAlert, CreateInventoryMovementInput } from '@/types'

const supabase = createClient()

/** Fetch all inventory items for a shop */
export function useInventoryItems(shopId: string) {
  return useQuery({
    queryKey: ['inventory', shopId],
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('shop_id', shopId)
        .order('name', { ascending: true })

      if (error) throw error
      return (data ?? []) as unknown as InventoryItem[]
    },
    enabled: !!shopId,
  })
}

/** Returns items whose stock is at or below min_stock */
export function useLowStockAlerts(shopId: string): { data: LowStockAlert[]; isLoading: boolean } {
  const { data: items = [], isLoading } = useInventoryItems(shopId)

  const alerts: LowStockAlert[] = items
    .filter(item => item.stock <= item.minStock)
    .map(item => ({
      item,
      shortage: item.minStock - item.stock,
    }))
    .sort((a, b) => b.shortage - a.shortage)

  return { data: alerts, isLoading }
}

/** Add a stock movement (purchase, usage, adjustment) */
export function useAddInventoryMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: CreateInventoryMovementInput & { shopId: string }
    ) => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert({
          shop_id:    input.shopId,
          item_id:    input.itemId,
          quantity:   input.quantity,
          reason:     input.reason,
          total_cost: input.totalCost,
          notes:      input.notes,
        })
        .select()
        .single()

      if (error) throw error

      // Update the item's stock
      const { error: stockError } = await supabase.rpc('update_inventory_stock', {
        p_item_id:  input.itemId,
        p_quantity: input.quantity,
      })
      if (stockError) throw stockError

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.shopId] })
    },
  })
}
