'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, BarChart2, Settings, Scissors, Users, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'
import { CurrencyIcon } from '@/components/ui/currency-icon'

interface SidebarProps {
  currency?: string
  role?:     string  // 'owner' | 'barber'
}

export function Sidebar({ currency = 'MXN', role = 'owner' }: SidebarProps) {
  const pathname  = usePathname()
  const isOwner   = role === 'owner'

  const navItems = [
    { href: '/dashboard',              label: 'Inicio',    icon: BarChart2, currencyIcon: false, ownerOnly: false },
    { href: '/dashboard/appointments', label: 'Citas',     icon: Calendar,  currencyIcon: false, ownerOnly: false },
    { href: '/dashboard/clients',      label: 'Clientes',  icon: Users,     currencyIcon: false, ownerOnly: true  },
    { href: '/dashboard/payments',     label: 'Pagos',     icon: null,      currencyIcon: true,  ownerOnly: true  },
    { href: '/dashboard/settings',     label: 'Ajustes',   icon: Settings,    currencyIcon: false, ownerOnly: true  },
    { href: '/dashboard/help',         label: 'Ayuda',     icon: HelpCircle,  currencyIcon: false, ownerOnly: false },
  ].filter(item => !item.ownerOnly || isOwner)

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-brand-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-brand-800">
        <Scissors className="h-6 w-6 text-accent" />
        <span className="text-xl font-bold tracking-tight">BarberOS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, currencyIcon }) => {
          // Exact match for root dashboard to avoid highlighting on sub-routes
          const active = href === '/dashboard'
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-white'
                  : 'text-brand-100 hover:bg-brand-800 hover:text-white'
              )}
            >
              {currencyIcon
                ? <CurrencyIcon currency={currency} className="h-4 w-4 shrink-0" />
                : Icon && <Icon className="h-4 w-4 shrink-0" />
              }
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-brand-800 px-3 py-3 space-y-1">
        {!isOwner && (
          <p className="px-3 text-xs text-accent font-medium">Acceso: Barbero</p>
        )}
        <LogoutButton />
        <p className="px-3 text-xs text-brand-600">BarberOS v0.1.0</p>
      </div>
    </aside>
  )
}
