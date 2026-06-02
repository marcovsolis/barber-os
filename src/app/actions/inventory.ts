'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

async function getShopId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { shopId: null, supabase, error: 'No autenticado.' }
  const { data: p } = await supabase.from('profiles').select('shop_id').eq('id', user.id).single()
  return { shopId: p?.shop_id as string | null, supabase, error: null }
}

const itemSchema = z.object({
  name:         z.string().min(2),
  brand:        z.string().optional(),
  unit:         z.string().min(1),
  stock:        z.coerce.number().min(0),
  minStock:     z.coerce.number().min(0),
  costPerUnit:  z.coerce.number().min(0).optional(),
  supplier:     z.string().optional(),
})

export type InventoryState = { error?: string; success?: boolean }

export async function upsertInventoryItemAction(
  _prev: InventoryState,
  formData: FormData
): Promise<InventoryState> {
  const { shopId, supabase, error } = await getShopId()
  if (error || !shopId) return { error: error! }

  const id = formData.get('id') as string | null

  const parsed = itemSchema.safeParse({
    name:        formData.get('name'),
    brand:       formData.get('brand') || undefined,
    unit:        formData.get('unit'),
    stock:       formData.get('stock'),
    minStock:    formData.get('minStock'),
    costPerUnit: formData.get('costPerUnit') || undefined,
    supplier:    formData.get('supplier') || undefined,
  })

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: first ?? 'Datos inválidos.' }
  }

  const payload = {
    shop_id:       shopId,
    name:          parsed.data.name,
    brand:         parsed.data.brand ?? null,
    unit:          parsed.data.unit,
    stock:         parsed.data.stock,
    min_stock:     parsed.data.minStock,
    cost_per_unit: parsed.data.costPerUnit ?? null,
    supplier:      parsed.data.supplier ?? null,
  }

  if (id) {
    const { error: err } = await supabase.from('inventory_items').update(payload).eq('id', id).eq('shop_id', shopId)
    if (err) return { error: 'No se pudo actualizar.' }
  } else {
    const { error: err } = await supabase.from('inventory_items').insert(payload)
    if (err) return { error: 'No se pudo crear el producto.' }
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

const movementSchema = z.object({
  itemId:    z.string().uuid(),
  quantity:  z.coerce.number().refine(n => n !== 0, 'La cantidad no puede ser 0'),
  reason:    z.string().min(1),
  totalCost: z.coerce.number().min(0).optional(),
  notes:     z.string().optional(),
})

export async function addInventoryMovementAction(
  _prev: InventoryState,
  formData: FormData
): Promise<InventoryState> {
  const { shopId, supabase, error } = await getShopId()
  if (error || !shopId) return { error: error! }

  const { data: { user } } = await supabase.auth.getUser()

  // Apply sign based on movement type ('in' = positive, 'out' = negative)
  const movType = formData.get('_movType') as string | null
  const rawQty  = parseFloat(formData.get('quantity') as string ?? '0')
  const signedQty = movType === 'out' ? -Math.abs(rawQty) : Math.abs(rawQty)

  const parsed = movementSchema.safeParse({
    itemId:    formData.get('itemId'),
    quantity:  signedQty,
    reason:    formData.get('reason'),
    totalCost: formData.get('totalCost') || undefined,
    notes:     formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: first ?? 'Datos inválidos.' }
  }

  const { itemId, quantity, reason, totalCost, notes } = parsed.data

  // Verify item belongs to this shop
  const { data: item } = await supabase
    .from('inventory_items')
    .select('id, stock')
    .eq('id', itemId)
    .eq('shop_id', shopId)
    .single()

  if (!item) return { error: 'Producto no encontrado.' }

  if (item.stock + quantity < 0) {
    return { error: `Stock insuficiente. Disponible: ${item.stock}` }
  }

  const { error: movErr } = await supabase.from('inventory_movements').insert({
    shop_id:    shopId,
    item_id:    itemId,
    quantity,
    reason,
    total_cost: totalCost ?? null,
    notes:      notes ?? null,
    created_by: user!.id,
  })

  if (movErr) return { error: 'No se pudo registrar el movimiento.' }

  // Update stock atomically via DB function
  const { error: stockErr } = await supabase.rpc('update_inventory_stock', {
    p_item_id:  itemId,
    p_quantity: quantity,
  })

  if (stockErr) return { error: 'No se pudo actualizar el stock.' }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}
