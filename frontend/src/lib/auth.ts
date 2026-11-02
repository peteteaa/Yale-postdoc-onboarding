import { createClient } from '#/lib/supabase/server'

export type CurrentUser = {
  /** The name to show: their full name if we have it, otherwise their email. */
  name: string
  /**
   * For greetings: the first word of their full name, else the start of their
   * email ("priya.raman@yale.edu" → "Priya"), else "Guest".
   */
  firstName: string
  /** null for guests. */
  email: string | null
  /** Signed in with "Continue as guest" (a Supabase anonymous user). */
  isGuest: boolean
}

/** "Priya Raman" → "Priya", or from the email: "priya.raman@yale.edu" → "Priya". */
function firstNameOf(fullName: string | null, email: string | undefined) {
  if (fullName) return fullName.split(/\s+/)[0]
  // The part of the address before the @ and any . _ - +
  const fromEmail = email?.split('@')[0].split(/[._+-]/)[0]
  return fromEmail ? fromEmail[0].toUpperCase() + fromEmail.slice(1) : 'Guest'
}

/** Who's signed in, or null if nobody is. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return null

  const isGuest = claims.is_anonymous === true
  const metaName = claims.user_metadata?.full_name
  const fullName =
    typeof metaName === 'string' && metaName.trim() ? metaName.trim() : null
  return {
    name: isGuest ? 'Guest' : (fullName ?? claims.email ?? 'Signed in'),
    firstName: isGuest ? 'Guest' : firstNameOf(fullName, claims.email),
    email: claims.email ?? null,
    isGuest,
  }
}
