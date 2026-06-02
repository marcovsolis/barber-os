import { Scissors } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent group-hover:bg-accent-dark transition">
          <Scissors className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">BarberOS</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md">
        {children}
      </div>

      <p className="mt-8 text-xs text-brand-500">
        Open source · MIT License ·{' '}
        <a
          href="https://github.com/marcovsolis/barber-os"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-300"
        >
          GitHub
        </a>
      </p>
    </div>
  )
}
