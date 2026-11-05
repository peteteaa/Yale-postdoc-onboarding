import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '#/lib/supabase/server'

export type CurrentUser = {
  /** The name to show: their full name if we have it, otherwise their email. */
  name: string
  /** null for guests. */
  email: string | null
  /** Signed in with "Continue as guest" (a Supabase anonymous user). */
  isGuest: boolean
}

/** Who's signed in, or null if nobody is. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return null

  const isGuest = claims.is_anonymous === true
  const fullName = claims.user_metadata?.full_name
  return {
    name: isGuest
      ? 'Guest'
      : typeof fullName === 'string' && fullName
        ? fullName
        : (claims.email ?? 'Signed in'),
    email: claims.email ?? null,
    isGuest,
  }
}

/**
 * Whether whoever's signed in is OPA staff: their account's app_metadata.role
 * is "admin". Asks the database (public.is_admin()), the same check its
 * row-level security uses, so anyone who can open the staff pages can also
 * save changes on them. Only the Supabase dashboard can set the role.
 */
export async function isAdmin(supabase?: SupabaseClient): Promise<boolean> {
  const client = supabase ?? (await createClient())
  const { data, error } = await client.rpc('is_admin')
  if (error) console.error('Checking for admin failed:', error)
  return data === true
}
