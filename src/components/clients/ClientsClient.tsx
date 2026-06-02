'use client'

import { useState, useMemo } from 'react'
import { Search, Users, Phone, Calendar, TrendingUp } from 'lucide-react'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { formatCurrency } from '@/lib/utils'
import { ClientProfile } from './ClientProfile'
import type { ClientWithStats } from '@/app/(dashboard)/dashboard/clients/page'

interface ClientsClientProps {
  clients:  ClientWithStats[]
  currency: string
}

export function ClientsClient({ clients, currency }: ClientsClientProps) {
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<ClientWithStats | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    )
  }, [clients, search])

  // Summary stats
  const totalClients = clients.length
  const totalVisits  = clients.reduce((s, c) => s + c.visitCount,  0)
  const totalSpent   = clients.reduce((s, c) => s + c.totalSpent,  0)

  return (
    <div className="flex gap-6 h-[calc(100vh-96px)]">

      {/* ── Left panel: list ────────────────────────────────── */}
      <div className="flex flex-col w-full max-w-sm shrink-0">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            Clientes
            <HelpTooltip text="Registro de todos tus clientes. Puedes ver su historial de visitas, cuánto han gastado y sus datos de contacto. Los clientes se crean automáticamente al agendar citas." />
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalClients} registrados</p>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-blue-50 p-3 text-center">
            <p className="text-lg font-bold text-blue-700">{totalClients}</p>
            <p className="text-xs text-blue-500">Clientes</p>
          </div>
          <div className="rounded-xl bg-green-50 p-3 text-center">
            <p className="text-lg font-bold text-green-700">{totalVisits}</p>
            <p className="text-xs text-green-500">Visitas</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3 text-center">
            <p className="text-xs font-bold text-purple-700 leading-tight mt-1">
              {formatCurrency(totalSpent, currency)}
            </p>
            <p className="text-xs text-purple-500">Cobrado</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              {search ? 'Sin resultados.' : 'Aún no hay clientes registrados.'}
            </div>
          )}
          {filtered.map(c => (
            <ClientRow
              key={c.id}
              client={c}
              currency={currency}
              isSelected={selected?.id === c.id}
              onClick={() => setSelected(c)}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: profile ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <ClientProfile
            key={selected.id}
            client={selected}
            currency={currency}
            onUpdated={(updated) => setSelected(updated)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
            <Users className="h-12 w-12" />
            <p className="text-sm">Selecciona un cliente para ver su perfil</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Client row ────────────────────────────────────────────────

function ClientRow({
  client, currency, isSelected, onClick,
}: {
  client:     ClientWithStats
  currency:   string
  isSelected: boolean
  onClick:    () => void
}) {
  const initials = client.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const lastVisit = client.lastVisitAt
    ? new Date(client.lastVisitAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    : null

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        isSelected
          ? 'bg-accent text-white'
          : 'bg-white border border-gray-100 hover:border-accent/30 hover:bg-gray-50'
      }`}
    >
      {/* Avatar — teal palette to distinguish from barbers */}
      <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
        isSelected ? 'bg-white/20 text-white' : 'bg-teal-500 text-white'
      }`}>
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${isSelected ? 'text-white' : 'text-brand-900'}`}>
          {client.fullName}
        </p>
        <p className={`text-xs truncate ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
          {client.phone}
        </p>
      </div>

      {/* Stats */}
      <div className="text-right shrink-0">
        <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-brand-900'}`}>
          {client.visitCount} visita{client.visitCount !== 1 ? 's' : ''}
        </p>
        {lastVisit && (
          <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
            {lastVisit}
          </p>
        )}
      </div>
    </button>
  )
}
