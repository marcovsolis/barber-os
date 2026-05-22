'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Payment, DailySummary, RegisterPaymentInput } from '@/types'

const supabase = createClient()

/** Fetch payments for a specific date */
export function useDailyPayments(shopId: string, date: string) {
  const from = `${date}T00:00:00.000Z`
  const to   = `${date}T23:59:59.999Z`

  return useQuery({
    queryKey: ['payments', shopId, date],
    queryFn: async (): Promise<Payment[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('shop_id', shopId)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as unknown as Payment[]
    },
    enabled: !!shopId,
  })
}

/** Compute a daily summary from a list of payments */
export function computeDailySummary(payments: Payment[], date: string): DailySummary {
  const completed = payments.filter(p => p.status === 'paid')

  return {
    date,
    totalAppointments: payments.length,
    completedAppointments: completed.length,
    totalRevenue:      completed.reduce((s, p) => s + p.amount, 0),
    cashRevenue:       completed.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0),
    cardRevenue:       completed.filter(p => p.method === 'card').reduce((s, p) => s + p.amount, 0),
    transferRevenue:   completed.filter(p => p.method === 'transfer').reduce((s, p) => s + p.amount, 0),
    noShows:           0,
    cancellations:     0,
  }
}

/** Register a payment for an appointment */
export function useRegisterPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: RegisterPaymentInput & { shopId: string; barberId: string }
    ) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          shop_id:         input.shopId,
          appointment_id:  input.appointmentId,
          barber_id:       input.barberId,
          amount:          input.amount,
          method:          input.method,
          status:          'paid',
          discount_amount: input.discountAmount ?? 0,
          notes:           input.notes,
          paid_at:         new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.shopId] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}
