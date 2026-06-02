'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  period: string
}

export function ExportButton({ period }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/export/payments?period=${period}`)
      if (!res.ok) throw new Error('Error al generar el reporte')

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)

      // Get filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match        = disposition.match(/filename="(.+)"/)
      const filename     = match?.[1] ?? 'reporte_pagos.xlsx'

      const a = document.createElement('a')
      a.href     = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el reporte. Verifica que xlsx esté instalado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Download className="h-4 w-4" />
      }
      {loading ? 'Generando…' : 'Exportar Excel'}
    </button>
  )
}
