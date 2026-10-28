'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import { continueAsGuest, signIn } from '#/app/login/actions'
import type { LoginState } from '#/app/login/actions'
import { CheckEmail } from '#/components/CheckEmail'
import {
  BUSY,
  Field,
  GHOST_BUTTON,
  INPUT,
  PRIMARY_BUTTON,
} from '#/components/Form'
import { withNext } from '#/lib/paths'

/**
 * /login: sign in with a password, create an account, or continue as a guest.
 * Emailed sign-in links are on their own page, /login/email-link.
 */
export function LoginForm({
  next,
}: {
  /** Where to go after signing in. */
  next: string
}) {
  const [state, signInAction, signingIn] = useActionState(signIn, {
    email: '',
  })
  const [guest, guestAction, joiningAsGuest] = useActionState(
    continueAsGuest,
    {},
  )
  // "Use a different email" hides the sent message for that one result.
  const [dismissed, setDismissed] = useState<LoginState | null>(null)
  const busy = signingIn || joiningAsGuest
  const fieldError = (field: 'email' | 'password') =>
    state.error?.field === field ? state.error.message : undefined

  if (state.sent && dismissed !== state) {
    return (
      <CheckEmail
        email={state.email}
        kind={state.sent}
        onDifferentEmail={() => setDismissed(state)}
      />
    )
  }

  return (
    <>
      <h1 className="mb-2.5 text-signin-title text-yale-blue">Sign in</h1>
      <p className="mb-5 text-ink-2">
        Sign in with your email and password, or create an account.
      </p>

      {state.error && !state.error.field && (
        <p role="alert" className="mb-4.5 font-semibold text-late">
          {state.error.message}
        </p>
      )}

      <form action={signInAction} noValidate>
        <input type="hidden" name="next" value={next} />
        <Field id="email" label="Email address" error={fieldError('email')}>
          {(props) => (
            <input
              {...props}
              name="email"
              type="email"
              autoComplete="email"
              // Put back what they typed after the form resets
              defaultValue={state.email}
              className={INPUT}
            />
          )}
        </Field>
        <Field id="password" label="Password" error={fieldError('password')}>
          {(props) => (
            <input
              {...props}
              name="password"
              type="password"
              autoComplete="current-password"
              className={INPUT}
            />
          )}
        </Field>
        <div className="flex flex-wrap gap-2.5">
          {/* First, so pressing Enter signs in */}
          <button
            type="submit"
            name="intent"
            value="sign-in"
            disabled={busy}
            className={`${PRIMARY_BUTTON} ${BUSY}`}
          >
            Sign in
          </button>
          <button
            type="submit"
            name="intent"
            value="sign-up"
            disabled={busy}
            className={`${GHOST_BUTTON} ${BUSY}`}
          >
            Create account
          </button>
        </div>
      </form>

      <p className="mt-5 font-semibold">
        <Link href={withNext('/login/email-link', next)}>
          No password? Use an email link instead
          <span aria-hidden="true"> →</span>
        </Link>
      </p>

      <form action={guestAction} className="mt-6 border-t border-line pt-5">
        <input type="hidden" name="next" value={next} />
        <p className="mb-2.5 text-small text-ink-2">
          Just trying it out? Guest accounts are for testing. You can’t get back
          into one after you sign out.
        </p>
        {guest.error && (
          <p role="alert" className="mb-2.5 text-small font-semibold text-late">
            {guest.error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className={`${GHOST_BUTTON} ${BUSY}`}
        >
          Continue as guest
        </button>
      </form>
    </>
  )
}
