import {
  DollarSign, Euro, PoundSterling, JapaneseYen, IndianRupee,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Currencies that have a specific Lucide icon
const ICON_MAP: Record<string, LucideIcon> = {
  EUR: Euro,
  GBP: PoundSterling,
  JPY: JapaneseYen,
  INR: IndianRupee,
}

// Currencies rendered as a text badge (no Lucide icon available)
const TEXT_MAP: Record<string, string> = {
  BRL: 'R$',   // Real brasileño
  CRC: '₡',    // Colón costarricense
  PEN: 'S/',   // Sol peruano
  GTQ: 'Q',    // Quetzal guatemalteco
  HNL: 'L',    // Lempira hondureño
  NIO: 'C$',   // Córdoba nicaragüense
  PAB: 'B/.',  // Balboa panameño
  DOP: 'RD$',  // Peso dominicano
}

// Everything else (USD, MXN, ARS, COP, CLP, UYU, …) uses DollarSign

interface CurrencyIconProps {
  currency: string
  className?: string
}

/**
 * Shows the right icon or symbol for a given currency code.
 * Works in both Server and Client components.
 */
export function CurrencyIcon({ currency, className }: CurrencyIconProps) {
  const Icon = ICON_MAP[currency]
  if (Icon) return <Icon className={className} />

  const text = TEXT_MAP[currency]
  if (text) {
    return (
      <span
        className={cn('font-bold leading-none inline-flex items-center justify-center', className)}
        style={{ fontSize: '0.7em' }}
      >
        {text}
      </span>
    )
  }

  return <DollarSign className={className} />
}
