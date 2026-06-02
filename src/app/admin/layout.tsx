import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">BarberOS</span>
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold">SUPER ADMIN</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              Barbierías
            </Link>
            <Link href="/admin/design" className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              Design System
            </Link>
          </nav>
        </div>
        <span className="text-sm text-gray-400">{user.email}</span>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
