'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar, DollarSign, Package, BarChart2, Settings, Scissors
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',           label: 'Inicio',      icon: BarChart2   },
  { href: '/dashboard/appointments', label: 'Citas',    icon: Calendar    },
  { href: '/dashboard/payments',  label: 'Pagos',       icon: DollarSign  },
  { href: '/dashboard/inventory', label: 'Inventario',  icon: Package     },
  { href: '/dashboard/settings',  label: 'Ajustes',     icon: Settings    },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-brand-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-brand-800">
        <Scissors className="h-6 w-6 text-accent" />
        <span className="text-xl font-bold tracking-tight">BarberOS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
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
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-brand-800 px-4 py-3 text-xs text-brand-400">
        BarberOS v0.1.0 — open source
      </div>
    </aside>
  )
}
