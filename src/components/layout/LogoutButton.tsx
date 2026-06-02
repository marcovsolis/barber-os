'use client'

import { LogOut } from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-400 hover:bg-brand-800 hover:text-white transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Cerrar sesión
      </button>
    </form>
  )
}
