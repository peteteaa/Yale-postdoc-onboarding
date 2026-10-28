'use server'

import type { AuthError } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { safeNextPath } from '#/lib/paths'
import { createClient } from '#/lib/supabase/server'

export type LoginState = {
  /** What they typed, so it's still there after the form resets. */
  email: string
  error?: { field?: 'email' | 'password'; message: string }
  /** Set once we've emailed them a link: a sign-in link or a confirm-your-account link. */
  sent?: 'magic-link' | 'confirm'
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

type FormError = NonNullable<LoginState['error']>

/** Supabase error codes in plain words, and the field each is about. */
const ERRORS: Record<string, FormError> = {
  invalid_credentials: {
    field: 'password',
    message: "That email and password don't match an account.",
  },
  email_address_invalid: {
    field: 'email',
    message: 'That email address can’t be used. Check it for typos.',
  },
  email_not_confirmed: {
    message:
      'Confirm your email first. We sent you a link when you created your account.',
  },
  user_already_exists: {
    message: 'There’s already an account with that email. Sign in instead.',
  },
  over_email_send_rate_limit: {
    message: 'Too many emails sent. Wait a few minutes, then try again.',
  },
  over_request_rate_limit: {
    message: 'Too many tries. Wait a few minutes, then try again.',
  },
  anonymous_provider_disabled: {
    message:
      'Guest mode is turned off. Turn on anonymous sign-ins in Supabase.',
  },
  signup_disabled: { message: 'New accounts are turned off. Contact OPA.' },
}

function formError(error: AuthError): FormError {
  if (error.code && error.code in ERRORS) return ERRORS[error.code]
  // e.g. weak_password, whose message lists Supabase's password rules
  return {
    field: error.code === 'weak_password' ? 'password' : undefined,
    message: error.message || 'Something went wrong. Try again.',
  }
}
