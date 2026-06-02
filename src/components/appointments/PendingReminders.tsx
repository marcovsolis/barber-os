'use client'

import { useState, useTransition } from 'react'
import { Bell, MessageCircle, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { markReminderSentAction } from '@/app/actions/reminders'

export interface PendingReminder {
  id:          string
  type:        '24h' | '30min'
  clientName:  string
  clientPhone: string
  serviceName: string
  barberName:  string | null
  startsAt:    string
  waLink:      string
}

interface PendingRemindersProps {
  reminders: PendingReminder[]
}

const TYPE_LABEL: Record<string, string> = {
  '24h':   'Recordatorio 24h',
  '30min': 'Recordatorio 30 min',
}

export function PendingReminders({ reminders: initial }: PendingRemindersProps) {
  const [reminders, setReminders] = useState(initial)
  const [open, setOpen]           = useState(true)
  const [isPending, startTrans]   = useTransition()

  if (reminders.length === 0) return null

  const handleSend = (r: PendingReminder) => {
    window.open(r.waLink, '_blank')
    // Mark as sent
    startTrans(async () => {
      await markReminderSentAction(r.id)
      setReminders(prev => prev.filter(x => x.id !== r.id))
    })
  }

  const handleSendAll = () => {
    reminders.forEach((r, i) => {
      // Stagger opens slightly so browser doesn't block them
      setTimeout(() => {
        window.open(r.waLink, '_blank')
        startTrans(async () => {
          await markReminderSentAction(r.id)
        })
      }, i * 400)
    })
    setTimeout(() => setReminders([]), reminders.length * 400 + 200)
  }

  return (
    <section className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" />
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Recordatorios pendientes ({reminders.length})
          </h2>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <>
          <div className="space-y-2 mb-2">
            {reminders.map(r => {
              const time = new Date(r.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
              const date = new Date(r.startsAt).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
                        {TYPE_LABEL[r.type]}
                      </span>
                      <span className="text-sm font-medium text-brand-900 truncate">{r.clientName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.serviceName} · {date} {time}{r.barberName ? ` · ${r.barberName}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSend(r)}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enviar
                  </button>
                </div>
              )
            })}
          </div>

          {reminders.length > 1 && (
            <button
              onClick={handleSendAll}
              disabled={isPending}
              className="flex items-center gap-2 text-xs text-amber-700 font-medium hover:underline"
            >
              <Check className="h-3.5 w-3.5" />
              Enviar todos ({reminders.length})
            </button>
          )}
        </>
      )}
    </section>
  )
}
