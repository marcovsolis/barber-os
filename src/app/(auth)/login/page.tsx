'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'
import { FormField, FormError } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, {})

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl">
      <h1 className="text-xl font-bold text-brand-900 mb-1">Iniciar sesión</h1>
      <p className="text-sm text-gray-500 mb-6">Bienvenido de vuelta</p>

      <form action={action} className="space-y-4">
        <FormError message={state.error} />

        <FormField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          error={state.fieldErrors?.email?.[0]}
          required
        />

        <FormField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={state.fieldErrors?.password?.[0]}
          required
        />

        <Button type="submit" className="w-full" loading={pending}>
          Entrar
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="font-semibold text-accent hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  )
}
