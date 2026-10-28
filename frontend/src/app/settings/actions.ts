'use server'

import type { FormError } from '#/lib/auth-errors'
import { formError } from '#/lib/auth-errors'
import { createClient } from '#/lib/supabase/server'

export type PasswordState = {
  error?: { field?: FormError['field'] | 'confirm'; message: string }
  saved?: boolean
}

/**
 * Settings → Password: set or change the signed-in person's password, so
 * someone who has only used email links can also sign in with a password.
 */
export async function setPassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!password) {
    return { error: { field: 'password', message: 'Enter a password.' } }
  }
  if (password !== confirm) {
    return {
      error: { field: 'confirm', message: 'The passwords don’t match.' },
    }
  }

  const supabase = await createClient()
  // Check here too, not just in proxy.ts: Server Actions can be called directly.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return { error: { message: 'Sign in first.' } }
  if (claims.is_anonymous) {
    return { error: { message: 'Guest accounts can’t have a password.' } }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: formError(error) }
  return { saved: true }
}
