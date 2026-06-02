import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as currency (MXN by default) */
export function formatCurrency(
  amount: number,
  currency = 'MXN',
  locale = 'es-MX'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Format a date for display in the UI */
export function formatDate(date: string | Date, pattern = "d 'de' MMMM, yyyy"): string {
  return format(new Date(date), pattern, { locale: es })
}

/** Format a time as 12-hour AM/PM (e.g. "9:00 AM", "2:30 PM") */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return format(d, 'h:mm a')
}

/** Relative time (e.g. "hace 5 minutos") */
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

/** Generate a URL-friendly slug from a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/** Get appointment status label in Spanish */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending:     'Pendiente',
    confirmed:   'Confirmada',
    in_progress: 'En progreso',
    completed:   'Completada',
    cancelled:   'Cancelada',
    no_show:     'No asistió',
  }
  return labels[status] ?? status
}

/** Get appointment status color classes */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:     'bg-yellow-100 text-yellow-800',
    confirmed:   'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed:   'bg-green-100 text-green-800',
    cancelled:   'bg-red-100 text-red-800',
    no_show:     'bg-gray-100 text-gray-600',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-600'
}

/** Get payment method label in Spanish */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash:     'Efectivo',
    card:     'Tarjeta',
    transfer: 'Transferencia',
    other:    'Otro',
  }
  return labels[method] ?? method
}

/** Calculate barber commission amount */
export function calculateCommission(amount: number, rate: number): number {
  return (amount * rate) / 100
}
