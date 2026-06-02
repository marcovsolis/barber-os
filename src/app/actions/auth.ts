'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ── Schemas ──────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const registerSchema = z.object({
  fullName: z.string().min(2, 'Ingresa tu nombre completo'),
  email:    z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
})

// ── Types ────────────────────────────────────────────────────

export type AuthState = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

// ── Login ────────────────────────────────────────────────────

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email:    formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  // Check if onboarding is complete
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single()

    revalidatePath('/', 'layout')
    redirect(profile?.shop_id ? '/dashboard' : '/onboarding')
  }

  redirect('/dashboard')
}

// ── Register ─────────────────────────────────────────────────

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    fullName: formData.get('fullName') as string,
    email:    formData.get('email')    as string,
    password: formData.get('password') as string,
    confirm:  formData.get('confirm')  as string,
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options:  {
      data: { full_name: parsed.data.fullName },
      // Disable email confirmation for development
      // emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este correo ya está registrado. Inicia sesión.' }
    }
    return { error: 'No se pudo crear la cuenta. Intenta de nuevo.' }
  }

  // The DB trigger creates the profile automatically.
  // Send the user to onboarding to set up their shop.
  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

// ── Logout ───────────────────────────────────────────────────

export async function logoutAction(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
