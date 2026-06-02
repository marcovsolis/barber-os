import { Scissors } from 'lucide-react'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 mb-6">
        <Scissors className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Cuenta suspendida</h1>
      <p className="text-gray-500 max-w-sm text-sm mb-6">
        Tu barbería ha sido temporalmente suspendida por el administrador de la plataforma.
        Para resolver esta situación, contacta soporte.
      </p>
      <a
        href="mailto:soporte@barberos.app"
        className="rounded-xl bg-brand-900 text-white px-6 py-2.5 text-sm font-semibold hover:bg-brand-800 transition-colors"
      >
        Contactar soporte
      </a>
    </div>
  )
}
