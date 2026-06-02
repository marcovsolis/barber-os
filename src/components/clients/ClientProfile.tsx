'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Phone, Mail, Calendar, StickyNote, Edit2, Check, X,
  Clock, Scissors, TrendingUp, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { updateClientAction } from '@/app/actions/clients'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ClientWithStats } from '@/app/(dashboard)/dashboard/clients/page'

// ── Types ─────────────────────────────────────────────────────

interface VisitRecord {
  id:          string
  startsAt:    string
  serviceName: string
  barberName:  string | null
  status:      string
  amount:      number | null
}

interface ClientProfileProps {
  client:    ClientWithStats
  currency:  string
  onUpdated: (updated: ClientWithStats) => void
}

// ── Helpers ───────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function ageFromBirthday(birthday: string): number {
  const today = new Date()
  const bd    = new Date(birthday)
  let age     = today.getFullYear() - bd.getFullYear()
  const m     = today.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--
  return age
}

function nextBirthday(birthday: string): string {
  const today = new Date()
  const bd    = new Date(birthday)
  const next  = new Date(today.getFullYear(), bd.getMonth(), bd.getDate())
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '🎂 ¡Hoy!'
  if (diff <= 7)  return `🎂 En ${diff} día${diff > 1 ? 's' : ''}`
  return next.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
}

const STATUS_LABEL: Record<string, string> = {
  completed:   'Completada',
  confirmed:   'Confirmada',
  pending:     'Pendiente',
  in_progress: 'En curso',
  cancelled:   'Cancelada',
  no_show:     'No asistió',
}

const STATUS_COLOR: Record<string, string> = {
  completed:   'bg-green-100 text-green-700',
  confirmed:   'bg-blue-100 text-blue-700',
  pending:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-purple-100 text-purple-700',
  cancelled:   'bg-gray-100 text-gray-500',
  no_show:     'bg-red-100 text-red-600',
}

// ── Main component ─────────────────────────────────────────────

export function ClientProfile({ client, currency, onUpdated }: ClientProfileProps) {
  // ── Visit history state ──────────────────────────────────
  const [visits,      setVisits]      = useState<VisitRecord[]>([])
  const [loadingVisits, setLoadingVisits] = useState(true)
  const [showAllVisits, setShowAllVisits] = useState(false)

  // ── Edit mode state ──────────────────────────────────────
  const [editing,     setEditing]     = useState(false)
  const [editNotes,   setEditNotes]   = useState(client.notes ?? '')
  const [editEmail,   setEditEmail]   = useState(client.email ?? '')
  const [editBirthday, setEditBirthday] = useState(client.birthday ?? '')
  const [editError,   setEditError]   = useState<string | null>(null)
  const [isPending,   startTransition] = useTransition()

  // ── Fetch visit history from Supabase browser client ────
  useEffect(() => {
    setLoadingVisits(true)
    const supabase = createBrowserClient()
    supabase
      .from('appointments')
      .select(`
        id, starts_at, service_name, status,
        barber:barbers(name),
        payment:payments(amount, status)
      `)
      .eq('client_id', client.id)
      .order('starts_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setVisits(
          (data ?? []).map((a: any) => {
            // barber: many-to-one FK → Supabase returns object, but be defensive with arrays
            const barber = Array.isArray(a.barber) ? a.barber[0] : a.barber

            // payment: one-to-many → Supabase returns array; take first paid payment
            const payments: any[] = Array.isArray(a.payment)
              ? a.payment
              : a.payment ? [a.payment] : []
            const paidPayment = payments.find(p => p.status === 'paid') ?? null

            return {
              id:          a.id,
              startsAt:    a.starts_at,
              serviceName: a.service_name,
              barberName:  barber?.name ?? null,
              status:      a.status,
              amount:      paidPayment ? Number(paidPayment.amount) : null,
            }
          })
        )
        setLoadingVisits(false)
      })
  }, [client.id])

  // ── Save edits ───────────────────────────────────────────
  const handleSave = () => {
    setEditError(null)
    const fd = new FormData()
    fd.set('full_name', client.fullName)
    fd.set('phone',     client.phone)
    fd.set('email',     editEmail)
    fd.set('birthday',  editBirthday)
    fd.set('notes',     editNotes)

    startTransition(async () => {
      const { error } = await updateClientAction(client.id, fd)
      if (error) {
        setEditError(error)
      } else {
        setEditing(false)
        onUpdated({
          ...client,
          email:    editEmail    || null,
          birthday: editBirthday || null,
          notes:    editNotes    || null,
        })
      }
    })
  }

  const handleCancel = () => {
    setEditing(false)
    setEditNotes(client.notes ?? '')
    setEditEmail(client.email ?? '')
    setEditBirthday(client.birthday ?? '')
    setEditError(null)
  }

  // ── Computed ──────────────────────────────────────────────
  const initials = client.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const visibleVisits = showAllVisits ? visits : visits.slice(0, 5)

  const totalSpent = visits
    .filter(v => v.amount !== null)
    .reduce((s, v) => s + (v.amount ?? 0), 0)

  const whatsappLink = `https://wa.me/${client.phone.replace(/\D/g, '')}`

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">

      {/* ── Profile header ──────────────────────────────── */}
      <div className="bg-brand-900 px-6 py-5">
        <div className="flex items-start gap-4">
          {/* Avatar — uses blue-teal palette, distinct from barber dark */}
          <div className="h-14 w-14 shrink-0 rounded-full bg-teal-500 flex items-center justify-center text-xl font-bold text-white">
            {initials}
          </div>

          {/* Name + actions */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{client.fullName}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-brand-200 hover:text-white transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {client.phone}
              </a>
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-1.5 text-xs text-brand-200 hover:text-white transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </a>
              )}
            </div>
          </div>

          {/* Edit toggle */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-lg p-2 text-brand-300 hover:bg-brand-800 hover:text-white transition-colors"
              title="Editar perfil"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl bg-brand-800 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{client.visitCount}</p>
            <p className="text-xs text-brand-300">Visitas</p>
          </div>
          <div className="rounded-xl bg-brand-800 px-3 py-2 text-center">
            <p className="text-sm font-bold text-accent leading-tight mt-0.5">
              {formatCurrency(totalSpent || client.totalSpent, currency)}
            </p>
            <p className="text-xs text-brand-300">Gastado</p>
          </div>
          <div className="rounded-xl bg-brand-800 px-3 py-2 text-center">
            <p className="text-sm font-bold text-white leading-tight mt-0.5">
              {client.lastVisitAt
                ? new Date(client.lastVisitAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                : '—'}
            </p>
            <p className="text-xs text-brand-300">Última visita</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Editable info ─────────────────────────────── */}
        {editing ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Editar perfil
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Cumpleaños
                </label>
                <input
                  type="date"
                  value={editBirthday}
                  onChange={e => setEditBirthday(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notas del barbero
              </label>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Alergias, preferencias, corte habitual…"
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {editError && (
              <p className="text-sm text-red-600">{editError}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-sm"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="h-3.5 w-3.5" /> Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 text-sm bg-accent hover:bg-accent/90 text-white"
                onClick={handleSave}
                disabled={isPending}
              >
                <Check className="h-3.5 w-3.5" /> {isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          /* Read-only info chips */
          <div className="flex flex-wrap gap-2">
            {client.birthday && (
              <InfoChip
                icon={<Calendar className="h-3.5 w-3.5" />}
                label={`${ageFromBirthday(client.birthday)} años · ${nextBirthday(client.birthday)}`}
              />
            )}
            {client.notes && (
              <InfoChip
                icon={<StickyNote className="h-3.5 w-3.5" />}
                label={client.notes}
                fullWidth
              />
            )}
            <InfoChip
              icon={<Clock className="h-3.5 w-3.5" />}
              label={`Cliente desde ${formatDate(client.createdAt)}`}
            />
          </div>
        )}

        {/* ── Visit history ─────────────────────────────── */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Historial de visitas
          </h3>

          {loadingVisits ? (
            <div className="py-6 text-center text-sm text-gray-400">Cargando…</div>
          ) : visits.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">
              Sin visitas registradas.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleVisits.map(v => (
                <VisitRow key={v.id} visit={v} currency={currency} />
              ))}

              {visits.length > 5 && (
                <button
                  onClick={() => setShowAllVisits(s => !s)}
                  className="flex items-center gap-1 text-xs text-accent hover:underline mt-1"
                >
                  {showAllVisits
                    ? <><ChevronUp className="h-3.5 w-3.5" /> Ver menos</>
                    : <><ChevronDown className="h-3.5 w-3.5" /> Ver todas ({visits.length})</>
                  }
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function InfoChip({ icon, label, fullWidth }: { icon: React.ReactNode; label: string; fullWidth?: boolean }) {
  return (
    <div className={`flex items-start gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 ${fullWidth ? 'w-full' : ''}`}>
      <span className="shrink-0 mt-0.5 text-gray-400">{icon}</span>
      <span className="leading-snug">{label}</span>
    </div>
  )
}

function VisitRow({ visit, currency }: { visit: VisitRecord; currency: string }) {
  const date = new Date(visit.startsAt)
  const dateLabel = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeLabel = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
      {/* Date column */}
      <div className="shrink-0 text-center w-12">
        <p className="text-xs font-bold text-brand-900">
          {date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
        </p>
        <p className="text-xs text-gray-400">{timeLabel}</p>
      </div>

      <div className="w-px h-8 bg-gray-200 shrink-0" />

      {/* Service + barber */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-900 truncate">{visit.serviceName}</p>
        {visit.barberName && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Scissors className="h-3 w-3" /> {visit.barberName}
          </p>
        )}
      </div>

      {/* Status + amount */}
      <div className="shrink-0 text-right">
        {visit.amount !== null ? (
          <p className="text-sm font-semibold text-green-700">
            {formatCurrency(visit.amount, currency)}
          </p>
        ) : (
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[visit.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABEL[visit.status] ?? visit.status}
          </span>
        )}
      </div>
    </div>
  )
}
