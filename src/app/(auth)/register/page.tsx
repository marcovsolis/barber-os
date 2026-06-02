'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction } from '@/app/actions/auth'
import { FormField, FormError } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, {})

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl">
      <h1 className="text-xl font-bold text-brand-900 mb-1">Crear cuenta</h1>
      <p className="text-sm text-gray-500 mb-6">
        Empieza gratis, sin tarjeta de crédito
      </p>

      <form action={action} className="space-y-4">
        <FormError message={state.error} />

        <FormField
          label="Nombre completo"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Marco Solís"
          error={state.fieldErrors?.fullName?.[0]}
          required
        />

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
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={state.fieldErrors?.password?.[0]}
          required
        />

        <FormField
          label="Confirmar contraseña"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          error={state.fieldErrors?.confirm?.[0]}
          required
        />

        <Button type="submit" variant="accent" className="w-full" loading={pending}>
          Crear cuenta
        </Button>

        <p className="text-xs text-center text-gray-400">
          Al registrarte aceptas los{' '}
          <Link href="/terms" className="underline hover:text-gray-600">
            términos de uso
          </Link>
        </p>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
