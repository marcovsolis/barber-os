'use client'

import { useState, useTransition } from 'react'
import { suspendShopAction, reactivateShopAction } from './actions'
import { formatCurrency } from '@/lib/utils'

interface ShopRow {
  id:              string
  name:            string
  slug:            string
  country:         string | null
  currency:        string
  isActive:        boolean
  suspendedReason: string | null
  suspendedAt:     string | null
  createdAt:       string
  ownerName:       string
  totalAppts:      number
  totalRevenue:    number
}

export function AdminShopsClient({ shops: initial }: { shops: ShopRow[] }) {
  const [shops, setShops]             = useState(initial)
  const [search, setSearch]           = useState('')
  const [suspendTarget, setSuspend]   = useState<ShopRow | null>(null)
  const [suspendReason, setReason]    = useState('')
  const [isPending, startTransition]  = useTransition()

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount    = shops.filter(s => s.isActive).length
  const suspendedCount = shops.filter(s => !s.isActive).length
  const totalRevenue   = shops.reduce((sum, s) => sum + s.totalRevenue, 0)

  const handleSuspend = (shop: ShopRow) => {
    startTransition(async () => {
      await suspendShopAction(shop.id, suspendReason)
      setShops(prev => prev.map(s => s.id === shop.id
        ? { ...s, isActive: false, suspendedReason: suspendReason || 'Suspendido por administrador' }
        : s
      ))
      setSuspend(null)
      setReason('')
    })
  }

  const handleReactivate = (shop: ShopRow) => {
    startTransition(async () => {
      await reactivateShopAction(shop.id)
      setShops(prev => prev.map(s => s.id === shop.id
        ? { ...s, isActive: true, suspendedReason: null }
        : s
      ))
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de administración</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gestiona todas las barberías registradas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total barberías', value: shops.length,    color: 'text-blue-400' },
          { label: 'Activas',         value: activeCount,     color: 'text-green-400' },
          { label: 'Suspendidas',     value: suspendedCount,  color: 'text-red-400' },
          { label: 'Ingresos totales',value: `$${Math.round(totalRevenue).toLocaleString()}`, color: 'text-yellow-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl bg-gray-900 border border-gray-800 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por nombre, slug u owner…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500"
      />

      {/* Table */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              {['Barbería', 'Owner', 'País', 'Citas', 'Ingresos', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-900/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-gray-500">/book/{s.slug}</p>
                </td>
                <td className="px-4 py-3 text-gray-300">{s.ownerName}</td>
                <td className="px-4 py-3 text-gray-400">{s.country ?? '—'}</td>
                <td className="px-4 py-3 text-gray-300">{s.totalAppts}</td>
                <td className="px-4 py-3 text-green-400 font-medium">
                  {formatCurrency(s.totalRevenue, s.currency)}
                </td>
                <td className="px-4 py-3">
                  {s.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-900/40 text-green-400 px-2 py-0.5 text-xs font-medium">
                      ● Activa
                    </span>
                  ) : (
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-900/40 text-red-400 px-2 py-0.5 text-xs font-medium">
                        ● Suspendida
                      </span>
                      {s.suspendedReason && (
                        <p className="text-xs text-gray-500 mt-1 max-w-32 truncate">{s.suspendedReason}</p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {s.isActive ? (
                    <button
                      onClick={() => setSuspend(s)}
                      disabled={isPending}
                      className="rounded-lg bg-red-900/40 text-red-400 border border-red-800 px-3 py-1.5 text-xs font-medium hover:bg-red-800/50 transition-colors disabled:opacity-50"
                    >
                      Suspender
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(s)}
                      disabled={isPending}
                      className="rounded-lg bg-green-900/40 text-green-400 border border-green-800 px-3 py-1.5 text-xs font-medium hover:bg-green-800/50 transition-colors disabled:opacity-50"
                    >
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-10 text-gray-500 text-sm">Sin resultados</p>
        )}
      </div>

      {/* Suspend modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSuspend(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 p-6 shadow-2xl">
            <h3 className="font-bold text-white text-lg mb-1">Suspender barbería</h3>
            <p className="text-gray-400 text-sm mb-4">
              Se desactivará <span className="text-white font-medium">{suspendTarget.name}</span>.
              El dueño no podrá acceder al dashboard ni recibir nuevas reservas.
            </p>
            <textarea
              value={suspendReason}
              onChange={e => setReason(e.target.value)}
              placeholder="Motivo de suspensión (opcional)"
              rows={3}
              className="w-full rounded-xl bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setSuspend(null); setReason('') }}
                className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSuspend(suspendTarget)}
                disabled={isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {isPending ? 'Suspendiendo…' : 'Confirmar suspensión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
