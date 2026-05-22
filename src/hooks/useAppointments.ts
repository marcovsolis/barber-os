'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, CreateAppointmentInput } from '@/types'

const supabase = createClient()

/** Fetch appointments for a given date range */
export function useAppointments(shopId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['appointments', shopId, from, to],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          barber:barbers(id, name, avatar_url, color),
          service:services(id, name, price, duration)
        `)
        .eq('shop_id', shopId)
        .gte('starts_at', from)
        .lte('starts_at', to)
        .order('starts_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as unknown as Appointment[]
    },
    enabled: !!shopId,
  })
}

/** Fetch today's appointments */
export function useTodayAppointments(shopId: string) {
  const today = new Date()
  const from  = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const to    = new Date(today.setHours(23, 59, 59, 999)).toISOString()
  return useAppointments(shopId, from, to)
}

/** Create a new appointment */
export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput & { shopId: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          shop_id:       input.shopId,
          barber_id:     input.barberId,
          service_id:    input.serviceId,
          client_name:   input.clientName,
          client_phone:  input.clientPhone,
          starts_at:     input.startsAt,
          notes:         input.notes,
          // ends_at and service details are derived in a trigger or set here
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

/** Update appointment status */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Appointment['status'] }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}
