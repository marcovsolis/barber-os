import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware runs on every request before the page renders.
 *
 * Rules:
 *  - /dashboard/* → must be logged in + onboarding complete
 *  - /onboarding  → must be logged in (shop not yet created)
 *  - /login, /register → redirect to /dashboard if already logged in
 *  - everything else → public
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: never remove this call
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Auth-gated routes ────────────────────────────────────
  const isDashboard   = pathname.startsWith('/dashboard')
  const isOnboarding  = pathname.startsWith('/onboarding')
  const isAuthPage    = pathname === '/login' || pathname === '/register'

  // Not logged in → send to login
  if ((isDashboard || isOnboarding) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Logged in + trying to access auth pages → send to dashboard
  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Read shop_id from JWT user_metadata (set during onboarding) — no extra DB query.
  // Falls back to a DB query for existing users who onboarded before this change.
  const shopIdFromMeta = user?.user_metadata?.shop_id as string | undefined

  const getShopId = async (): Promise<string | null> => {
    if (shopIdFromMeta) return shopIdFromMeta
    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user!.id)
      .single()
    return profile?.shop_id ?? null
  }

  // Logged in + accessing dashboard → check onboarding is complete
  if (isDashboard && user) {
    const shopId = await getShopId()
    if (!shopId) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  // Logged in + onboarding complete + visiting /onboarding → send to dashboard
  if (isOnboarding && user) {
    const shopId = await getShopId()
    if (shopId) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - Public booking pages (/book/*)
     * - API routes (/api/*)
     */
    '/((?!_next/static|_next/image|favicon.ico|book|api).*)',
  ],
}
