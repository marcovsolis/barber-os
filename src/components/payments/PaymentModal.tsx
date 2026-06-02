'use client'

import { useActionState, useEffect, useState } from 'react'
import { X, DollarSign, CreditCard, Banknote, ArrowLeftRight, MessageCircle, CheckCircle } from 'lucide-react'
import { registerPaymentAction } from '@/app/actions/payments'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/form-field'
import { formatCurrency } from '@/lib/utils'
import type { Appointment } from '@/types'

const METHODS = [
  { value: 'cash',     label: 'Efectivo',       icon: Banknote },
  { value: 'card',     label: 'Tarjeta',         icon: CreditCard },
  { value: 'transfer', label: 'Transferencia',   icon: ArrowLeftRight },
  { value: 'other',    label: 'Otro',            icon: DollarSign },
] as const

interface PaymentModalProps {
  appointment: Appointment | null
  onClose: () => void
  currency?: string
}

export function PaymentModal({ appointment, onClose, currency = 'MXN' }: PaymentModalProps) {
  const [state, formAction, pending] = useActionState(registerPaymentAction, {})
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (state.success) setShowSuccess(true)
  }, [state.success])

  useEffect(() => {
    if (appointment) {
      setShowSuccess(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [appointment])

  if (!appointment) return null

  const suggestedAmount = appointment.servicePrice

  // ── Success screen with optional WhatsApp link ────────────
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <div>
            <p className="text-lg font-bold text-brand-900">¡Pago registrado!</p>
            <p className="text-sm text-gray-500 mt-1">
              La cita de <strong>{appointment.clientName}</strong> fue marcada como completada.
            </p>
          </div>

          {/* WhatsApp receipt button — opens wa.me if sendReceipt was checked */}
          {state.waLink && (
            <a
              href={state.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] text-white font-semibold py-3 text-sm hover:bg-[#1ebe5d] transition"
            >
              <MessageCircle className="h-5 w-5" />
              Enviar recibo por WhatsApp
            </a>
          )}

          <Button variant="default" className="w-full" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    )
  }

  // ── Payment form ──────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-brand-900">Registrar pago</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Client summary */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-sm font-semibold text-brand-900">{appointment.clientName}</p>
          <p className="text-xs text-gray-500">{appointment.serviceName} · {formatCurrency(appointment.servicePrice, currency)}</p>
        </div>

        <form action={formAction} className="px-5 py-5 space-y-5">
          <input type="hidden" name="appointmentId" value={appointment.id} />

          <FormError message={state.error} />

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Monto cobrado</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.50"
                defaultValue={suggestedAmount}
                required
                className="w-full rounded-xl border-2 border-gray-200 pl-8 pr-3 py-2.5 text-sm font-semibold focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Descuento <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
              <input
                name="discountAmount"
                type="number"
                min="0"
                step="0.50"
                defaultValue="0"
                className="w-full rounded-xl border-2 border-gray-200 pl-8 pr-3 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Método de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(({ value, label, icon: Icon }) => (
                <label key={value} className="cursor-pointer">
                  <input type="radio" name="method" value={value}
                    defaultChecked={value === 'cash'} className="sr-only peer" />
                  <div className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 transition peer-checked:border-accent peer-checked:bg-red-50 peer-checked:text-accent hover:border-gray-300">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notas <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              name="notes"
              type="text"
              placeholder="Ej: Pagó con billete de 500"
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>

          {/* Send receipt via WhatsApp toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" name="sendReceipt" value="true" className="sr-only peer" />
              <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-[#25D366] transition" />
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
            </div>
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Enviar recibo por WhatsApp
            </span>
          </label>

          <Button type="submit" variant="accent" className="w-full" loading={pending}>
            Registrar cobro ✓
          </Button>
        </form>
      </div>
    </div>
  )
}
