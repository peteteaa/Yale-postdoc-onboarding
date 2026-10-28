'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import type { FormError } from '#/lib/auth-errors'
import { formError } from '#/lib/auth-errors'
import { safeNextPath } from '#/lib/paths'
import { createClient } from '#/lib/supabase/server'

export type LoginState = {
  /** What they typed, so it's still there after the form resets. */
  email: string
  error?: FormError
  /** Set once we've emailed them a link: to sign in, confirm a new account, or set a password on an existing one. */
  sent?: 'magic-link' | 'confirm' | 'set-password'
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Where a set-your-password link goes: Settings, which then asks for the password. */
const SET_PASSWORD_PAGE = '/settings?set-password=1'

const INVALID_EMAIL: LoginState['error'] = {
  field: 'email',
  message: 'Enter your email address, like name@example.com.',
}

/** Links in emails come back to /auth/confirm, then go on to `next`. */
async function emailRedirectTo(next: string) {
  return `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`
}

/** /login: sign in or create an account. Which button they pressed is in `intent`. */
export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const intent = formData.get('intent')
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNextPath(formData.get('next'))

  if (!EMAIL_PATTERN.test(email)) return { email, error: INVALID_EMAIL }
  if (!password) {
    return {
      email,
      error: { field: 'password', message: 'Enter your password.' },
    }
  }

  const supabase = await createClient()
  if (intent === 'sign-up') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: await emailRedirectTo(next) },
    })
    // The email already has an account, e.g. one made with an email link and
    // no password. Supabase says so with an error when it doesn't make people
    // confirm their email, and with a user with no identities when it does.
    // Email them a link to set a password rather than setting this one: that
    // way only the owner of the email can.
    if (
      error?.code === 'user_already_exists' ||
      (!error && data.user?.identities?.length === 0)
    ) {
      const { error: linkError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: await emailRedirectTo(SET_PASSWORD_PAGE) },
      )
      if (linkError) return { email, error: formError(linkError) }
      return { email, sent: 'set-password' }
    }
    if (error) return { email, error: formError(error) }
    // No session means Supabase wants them to confirm their email first.
    if (!data.session) return { email, sent: 'confirm' }
    redirect(next)
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { email, error: formError(error) }
  redirect(next)
}

/**
 * /login/email-link: email them a link that signs them in. Supabase creates
 * the account first if there isn't one.
 */
export async function sendSignInLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const next = safeNextPath(formData.get('next'))
  if (!EMAIL_PATTERN.test(email)) return { email, error: INVALID_EMAIL }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await emailRedirectTo(next) },
  })
  if (error) return { email, error: formError(error) }
  return { email, sent: 'magic-link' }
}

export type GuestState = { error?: string }

/** "Continue as guest": a Supabase anonymous user, for testing. */
export async function continueAsGuest(
  _prev: GuestState,
  formData: FormData,
): Promise<GuestState> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInAnonymously()
  if (error) return { error: formError(error).message }
  redirect(safeNextPath(formData.get('next')))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/** This site's address, e.g. http://localhost:3000, for links in emails. */
async function siteOrigin() {
  const h = await headers()
  const origin = h.get('origin')
  if (origin) return origin
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}
