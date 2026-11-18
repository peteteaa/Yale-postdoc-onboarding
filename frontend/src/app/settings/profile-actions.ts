'use server'

import { revalidatePath } from 'next/cache'

import type { ProfileFormErrors } from '#/lib/profile'
import { cleanProfileForm, validateProfile } from '#/lib/profile'
import { toProfileRow } from '#/lib/supabase/progress'
import { createClient } from '#/lib/supabase/server'

export type ProfileActionResult =
  { ok: true } | { ok: false; message?: string; errors?: ProfileFormErrors }

/** Settings: save the signed-in postdoc's appointment details. */
export async function saveProfile(
  input: unknown,
): Promise<ProfileActionResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  // Row-level security refuses guests too. This gives them a clear message.
  if (!claims) return { ok: false, message: 'Sign in again to save this.' }
  if (claims.is_anonymous === true) {
    return {
      ok: false,
      message:
        'Guest accounts can’t save a profile. Sign out and create an account.',
    }
  }

  const form = cleanProfileForm(input)
  const errors = validateProfile(form)
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: claims.sub, ...toProfileRow(form) })
  if (error) {
    console.error('Couldn’t save the profile:', error.message)
    return { ok: false, message: 'Couldn’t save your details. Try again.' }
  }

  // Home, the Checklist and the admin overview all use it.
  revalidatePath('/', 'layout')
  return { ok: true }
}
