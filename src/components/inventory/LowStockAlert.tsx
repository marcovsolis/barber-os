'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LowStockAlert as LowStockAlertType } from '@/types'

interface LowStockAlertProps {
  alerts: LowStockAlertType[]
}

export function LowStockAlert({ alerts }: LowStockAlertProps) {
  if (alerts.length === 0) return null

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Stock bajo ({alerts.length} producto{alerts.length !== 1 ? 's' : ''})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {alerts.map(({ item, shortage }) => (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <span className="font-medium text-yellow-900">{item.name}</span>
              <span className="text-yellow-700">
                {item.stock} {item.unit} — mínimo {item.minStock}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
