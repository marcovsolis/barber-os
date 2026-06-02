'use client'

import { useActionState, useState, useEffect, Fragment } from 'react'
import { useFormStatus } from 'react-dom'
import toast from 'react-hot-toast'
import { Plus, Pencil, X, PackagePlus, ArrowUpDown, AlertTriangle } from 'lucide-react'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField, FormError } from '@/components/ui/form-field'
import {
  upsertInventoryItemAction,
  addInventoryMovementAction,
  type InventoryState,
} from '@/app/actions/inventory'
import { formatCurrency } from '@/lib/utils'
import type { InventoryItem, InventoryMovement } from '@/types'

// ── Submit helpers ────────────────────────────────────────────

function SubmitBtn({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="accent" size="sm" disabled={pending} loading={pending}>
      {pending ? loadingLabel : label}
    </Button>
  )
}

// ── Item Form ─────────────────────────────────────────────────

interface ItemFormProps {
  item?: InventoryItem
  onCancel: () => void
  onSuccess: () => void
}

function ItemForm({ item, onCancel, onSuccess }: ItemFormProps) {
  const [state, action] = useActionState<InventoryState, FormData>(
    upsertInventoryItemAction,
    {}
  )

  useEffect(() => {
    if (state.success) {
      toast.success(item ? 'Producto actualizado.' : 'Producto creado.')
      onSuccess()
    }
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={action} className="border border-gray-200 rounded-xl bg-gray-50 p-4 space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Nombre del producto *"
          name="name"
          defaultValue={item?.name}
          placeholder="Ej. Shampoo profesional"
          required
        />
        <FormField
          label="Marca"
          name="brand"
          defaultValue={item?.brand}
          placeholder="Ej. Wella"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          label="Unidad *"
          name="unit"
          defaultValue={item?.unit ?? 'piezas'}
          placeholder="piezas, ml, kg…"
          required
        />
        <FormField
          label="Stock inicial *"
          name="stock"
          type="number"
          defaultValue={item?.stock?.toString() ?? '0'}
          min="0"
          step="0.01"
          required
        />
        <FormField
          label="Stock mínimo *"
          name="minStock"
          type="number"
          defaultValue={item?.minStock?.toString() ?? '0'}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Costo por unidad"
          name="costPerUnit"
          type="number"
          defaultValue={item?.costPerUnit?.toString()}
          min="0"
          step="0.01"
          placeholder="0.00"
        />
        <FormField
          label="Proveedor"
          name="supplier"
          defaultValue={item?.supplier}
          placeholder="Nombre del proveedor"
        />
      </div>

      {state.error && <FormError message={state.error} />}

      <div className="flex gap-2 pt-1">
        <SubmitBtn
          label={item ? 'Guardar cambios' : 'Agregar producto'}
          loadingLabel="Guardando…"
        />
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

// ── Movement Modal ────────────────────────────────────────────

const MOVEMENT_REASONS = [
  { value: 'purchase', label: 'Compra / Reposición' },
  { value: 'usage',    label: 'Uso en servicio' },
  { value: 'loss',     label: 'Pérdida / Merma' },
  { value: 'return',   label: 'Devolución a proveedor' },
  { value: 'adjust',   label: 'Ajuste de inventario' },
]

interface MovementModalProps {
  items: InventoryItem[]
  defaultItemId?: string
  onClose: () => void
}

function MovementModal({ items, defaultItemId, onClose }: MovementModalProps) {
  const [state, action] = useActionState<InventoryState, FormData>(
    addInventoryMovementAction,
    {}
  )
  const [movType, setMovType] = useState<'in' | 'out'>('in')

  useEffect(() => {
    if (state.success) {
      toast.success('Movimiento registrado.')
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-brand-900 flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-accent" />
            Registrar movimiento
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={action} className="p-5 space-y-4">
          {/* Item selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto *
            </label>
            <select
              name="itemId"
              defaultValue={defaultItemId ?? ''}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="" disabled>Selecciona un producto…</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} {i.brand ? `(${i.brand})` : ''} — {i.stock} {i.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de movimiento *
            </label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setMovType('in')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  movType === 'in'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                + Entrada
              </button>
              <button
                type="button"
                onClick={() => setMovType('out')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  movType === 'out'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                − Salida
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo *
            </label>
            <select
              name="reason"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {MOVEMENT_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad *
            </label>
            {/* Hidden field that submits positive/negative based on type */}
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${
                movType === 'in' ? 'text-green-600' : 'text-red-500'
              }`}>
                {movType === 'in' ? '+' : '−'}
              </span>
              <input
                type="number"
                name="quantity"
                min="0.01"
                step="0.01"
                required
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                onChange={e => {
                  // Ensure sign matches type
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val)) {
                    e.target.value = Math.abs(val).toString()
                  }
                }}
                // We'll handle sign via a hidden input on submit
              />
            </div>
            {/* This hidden input will receive the signed value via form manipulation */}
            <input type="hidden" name="_movType" value={movType} />
          </div>

          {movType === 'in' && (
            <FormField
              label="Costo total de compra"
              name="totalCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          )}

          <FormField
            label="Notas"
            name="notes"
            placeholder="Observaciones adicionales…"
          />

          {state.error && <FormError message={state.error} />}

          <div className="flex gap-2 pt-1">
            <SubmitBtn label="Registrar" loadingLabel="Registrando…" />
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Movement History Row ──────────────────────────────────────

function MovementRow({ mov, items }: { mov: InventoryMovement; items: InventoryItem[] }) {
  const item = items.find(i => i.id === mov.itemId)
  const isPositive = mov.quantity > 0
  const reasonLabels: Record<string, string> = {
    purchase: 'Compra',
    usage:    'Uso',
    loss:     'Pérdida',
    return:   'Devolución',
    adjust:   'Ajuste',
  }
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-brand-900 text-sm">{item?.name ?? '—'}</p>
        {item?.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{mov.quantity} {item?.unit ?? ''}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {reasonLabels[mov.reason] ?? mov.reason}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {mov.totalCost ? formatCurrency(mov.totalCost) : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {new Date(mov.createdAt).toLocaleDateString('es-MX', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        })}
      </td>
    </tr>
  )
}

// ── Main InventoryClient ──────────────────────────────────────

interface InventoryClientProps {
  items: InventoryItem[]
  movements: InventoryMovement[]
}

type Tab = 'products' | 'movements'

export function InventoryClient({ items, movements }: InventoryClientProps) {
  const [tab, setTab] = useState<Tab>('products')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showMovement, setShowMovement] = useState(false)
  const [movementItemId, setMovementItemId] = useState<string | undefined>()

  const lowStockCount = items.filter(i => i.stock <= i.minStock).length

  function openMovement(itemId?: string) {
    setMovementItemId(itemId)
    setShowMovement(true)
  }

  function handleItemSuccess() {
    setShowForm(false)
    setEditingItem(null)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'products',  label: `Productos (${items.length})` },
    { key: 'movements', label: `Movimientos (${movements.length})` },
  ]

  return (
    <>
      {/* Movement modal */}
      {showMovement && (
        <MovementModal
          items={items}
          defaultItemId={movementItemId}
          onClose={() => setShowMovement(false)}
        />
      )}

      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
              Inventario
              <HelpTooltip text="Controla el stock de productos de tu barbería (shampoos, ceras, navajas, etc.). Recibe alertas cuando el stock baje del mínimo que configures." />
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {items.length} productos · {movements.length} movimientos
              {lowStockCount > 0 && (
                <span className="ml-2 text-yellow-700 font-medium">
                  <AlertTriangle className="inline h-3.5 w-3.5 mr-0.5" />
                  {lowStockCount} con stock bajo
                </span>
              )}
            </p>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={() => openMovement()}
          >
            <ArrowUpDown className="h-4 w-4 mr-1.5" />
            Movimiento
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Products tab ── */}
        {tab === 'products' && (
          <div className="space-y-4">
            {/* Add / Edit form toggle */}
            {!editingItem && !showForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Agregar producto
              </Button>
            )}

            {/* New item form */}
            {showForm && !editingItem && (
              <ItemForm
                onCancel={() => setShowForm(false)}
                onSuccess={handleItemSuccess}
              />
            )}

            {/* Products table */}
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Producto', 'Stock', 'Mínimo', 'Costo/u', 'Proveedor', ''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left font-semibold text-gray-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                        <PackagePlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No hay productos. Agrega tu primer insumo.
                      </td>
                    </tr>
                  )}

                  {items.map(item => (
                    <Fragment key={item.id}>
                      {/* Edit form inline */}
                      {editingItem?.id === item.id ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-3">
                            <ItemForm
                              item={item}
                              onCancel={() => setEditingItem(null)}
                              onSuccess={handleItemSuccess}
                            />
                          </td>
                        </tr>
                      ) : (
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-brand-900">{item.name}</p>
                            {item.brand && (
                              <p className="text-xs text-gray-400">{item.brand}</p>
                            )}
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

                          <td className="px-4 py-3 text-gray-500">
                            {item.minStock} {item.unit}
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {item.costPerUnit ? formatCurrency(item.costPerUnit) : '—'}
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {item.supplier ?? '—'}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => openMovement(item.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                title="Registrar movimiento"
                              >
                                <ArrowUpDown className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItem(item)
                                  setShowForm(false)
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/10 transition-colors"
                                title="Editar producto"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Movements tab ── */}
        {tab === 'movements' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => openMovement()}>
                <Plus className="h-4 w-4 mr-1.5" />
                Nuevo movimiento
              </Button>
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Producto', 'Cantidad', 'Motivo', 'Costo total', 'Fecha'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                        Sin movimientos registrados.
                      </td>
                    </tr>
                  )}
                  {movements.map(mov => (
                    <MovementRow key={mov.id} mov={mov} items={items} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
