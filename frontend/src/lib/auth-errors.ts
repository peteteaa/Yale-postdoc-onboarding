import type { AuthError } from '@supabase/supabase-js'

/** An error to show on a form, and the field it's about if there is one. */
export type FormError = { field?: 'email' | 'password'; message: string }

/** Supabase error codes in plain words, and the field each is about. */
const ERRORS: Record<string, FormError> = {
  invalid_credentials: {
    field: 'password',
    message:
      "That email and password don't match an account. If you've only used email links, choose Create account to set a password.",
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
  same_password: {
    field: 'password',
    message: 'That’s already your password. Choose a different one.',
  },
  reauthentication_needed: {
    message:
      'For your security, sign out and sign in again, then set your password.',
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

export function formError(error: AuthError): FormError {
  if (error.code && error.code in ERRORS) return ERRORS[error.code]
  // e.g. weak_password, whose message lists Supabase's password rules
  return {
    field: error.code === 'weak_password' ? 'password' : undefined,
    message: error.message || 'Something went wrong. Try again.',
  }
}
