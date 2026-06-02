'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

// ── Schema ────────────────────────────────────────────────────

const onboardingSchema = z.object({
  // Step 1 — Shop
  shopName:  z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  shopSlug:  z.string().min(2).regex(/^[a-z0-9-]+$/, 'Solo letras, números y guiones'),
  city:      z.string().optional(),
  timezone:  z.string().min(1, 'Selecciona una zona horaria'),
  country:   z.string().optional(),
  currency:  z.string().min(1).default('MXN'),

  // Step 2 — Services (passed as JSON string from the wizard)
  services:  z.string().min(2),   // JSON array of { name, price, duration }
})

export type OnboardingState = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

// ── Action ────────────────────────────────────────────────────

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  // Verify session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Validate input
  const raw = {
    shopName:  formData.get('shopName')  as string,
    shopSlug:  formData.get('shopSlug')  as string,
    city:      formData.get('city')      as string | undefined,
    timezone:  formData.get('timezone')  as string,
    services:  formData.get('services')  as string,
  }

  const parsed = onboardingSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { shopName, shopSlug, city, timezone, country, currency, services: servicesJson } = parsed.data

  let servicesList: Array<{ name: string; price: number; duration: number }>
  try {
    servicesList = JSON.parse(servicesJson)
    if (!Array.isArray(servicesList) || servicesList.length === 0) throw new Error()
  } catch {
    return { error: 'Agrega al menos un servicio.' }
  }

  // ── 1. Check slug availability ───────────────────────────
  const { data: existing } = await adminSupabase
    .from('shops')
    .select('id')
    .eq('slug', shopSlug)
    .maybeSingle()

  if (existing) {
    return {
      fieldErrors: {
        shopSlug: ['Esta URL ya está en uso. Elige otra.'],
      },
    }
  }

  // ── 2. Create shop ───────────────────────────────────────
  const { data: shop, error: shopError } = await adminSupabase
    .from('shops')
    .insert({ name: shopName, slug: shopSlug, city, timezone, country, currency })
    .select()
    .single()

  if (shopError || !shop) {
    console.error('[onboarding] shop insert:', shopError)
    return { error: 'No se pudo crear la barbería. Intenta de nuevo.' }
  }

  // ── 3. Update profile with shop_id and role='owner' ──────
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ shop_id: shop.id, role: 'owner' })
    .eq('id', user.id)

  if (profileError) {
    console.error('[onboarding] profile update:', profileError)
    // Profile may not exist yet — create it
    await adminSupabase.from('profiles').upsert({
      id:       user.id,
      full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Dueño',
      shop_id:  shop.id,
      role:     'owner',
    })
  }

  // ── 4. Create owner's barber record ─────────────────────
  const { data: newBarber } = await adminSupabase.from('barbers').insert({
    shop_id:    shop.id,
    profile_id: user.id,
    name:       profile?.full_name ?? user.user_metadata?.full_name ?? 'Dueño',
    color:      '#4f6ef7',
  }).select('id').single()

  // ── 4b. Create default schedules (Mon-Sat 09:00-19:00) ──
  if (newBarber?.id) {
    const defaultSchedules = [1,2,3,4,5,6].map(day => ({  // 1=Mon … 6=Sat
      barber_id:   newBarber.id,
      day_of_week: day,
      start_time:  '09:00',
      end_time:    '19:00',
      is_active:   true,
    }))
    await adminSupabase.from('barber_schedules').insert(defaultSchedules)
  }

  // ── 5. Create initial services ───────────────────────────
  await adminSupabase.from('services').insert(
    servicesList.map(s => ({
      shop_id:  shop.id,
      name:     s.name,
      price:    s.price,
      duration: s.duration,
      color:    '#e94560',
    }))
  )

  // ── 6. Save shop_id in user metadata ────────────────────
  // This allows the middleware to skip the DB profile query on every request.
  await supabase.auth.updateUser({ data: { shop_id: shop.id } })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ── Slug availability check (called from client) ─────────────

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('shops')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return !data   // true = available
}
