import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { SUPABASE_KEY, SUPABASE_URL } from '#/lib/supabase/config'

/**
 * A Supabase client for Server Components, Server Actions and Route Handlers,
 * signed in as whoever's session cookies came with the request. Make a new one
 * for each request.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Components can't set cookies. That's fine: proxy.ts
          // refreshes the session before the page renders.
        }
      },
    },
  })
}
