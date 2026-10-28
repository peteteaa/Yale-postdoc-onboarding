import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { SUPABASE_KEY, SUPABASE_URL } from '#/lib/supabase/config'

/** The sign-in pages: /login and /login/email-link. */
function isLogin(pathname: string) {
  return pathname === '/login' || pathname.startsWith('/login/')
}

/** Pages you can see without signing in. */
function isPublic(pathname: string) {
  return isLogin(pathname) || pathname.startsWith('/auth/')
}

/**
 * Runs before every page. Refreshes the Supabase session (pages can't set
 * cookies, so this is the only place it can happen) and sends signed-out
 * visitors to /login.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        // Update the request too, so the page sees the refreshed session.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
        // Keeps CDNs from caching a response that carries someone's session.
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        )
      },
    },
  })

  // Don't put code between creating the client and this call: it's what
  // refreshes an expired session.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)
  const { pathname, search } = request.nextUrl

  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url)
    // Carry over any refreshed session cookies and their cache headers.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    response.headers.forEach((value, key) => {
      if (key !== 'set-cookie' && !key.startsWith('x-middleware-'))
        redirect.headers.set(key, value)
    })
    return redirect
  }

  if (!signedIn && !isPublic(pathname)) {
    const url = new URL('/login', request.url)
    if (pathname !== '/') url.searchParams.set('next', pathname + search)
    return redirectTo(url)
  }
  if (signedIn && isLogin(pathname)) {
    return redirectTo(new URL('/', request.url))
  }

  return response
}

export const config = {
  // Everything except Next's build files and images.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
