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
