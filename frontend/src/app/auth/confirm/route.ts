import type { EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { safeNextPath } from '#/lib/paths'
import { createClient } from '#/lib/supabase/server'

/**
 * Where the links in sign-in and confirm-your-account emails land. Finishes
 * signing in, then goes on to `next`.
 *
 * Supabase's default email templates send `?code=`, which only works in the
 * browser that asked for the link. Templates changed to
 * `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` send
 * `?token_hash=`, which works on any device.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const next = safeNextPath(params.get('next'))
  const code = params.get('code')
  const tokenHash = params.get('token_hash')
  const type = params.get('type') as EmailOtpType | null

  const supabase = await createClient()
  let failure: string | null
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    failure = error && `${error.code ?? error.name}: ${error.message}`
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    failure = error && `${error.code ?? error.name}: ${error.message}`
  } else {
    // An expired or used link: Supabase sends us here with ?error=
    failure = params.get('error_description') ?? 'no code or token in the link'
  }

  if (failure) {
    console.error(`Email link sign-in failed (${failure})`)
    redirect('/login/email-link?error=link')
  }
  redirect(next)
}
