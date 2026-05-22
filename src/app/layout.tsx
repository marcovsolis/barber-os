import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'BarberOS',
    template: '%s | BarberOS',
  },
  description: 'Plataforma de gestión para barberías — citas, pagos e inventario',
  keywords: ['barbería', 'agenda', 'citas', 'inventario', 'saas'],
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'BarberOS',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', fontFamily: 'Inter, sans-serif' },
          }}
        />
      </body>
    </html>
  )
}
