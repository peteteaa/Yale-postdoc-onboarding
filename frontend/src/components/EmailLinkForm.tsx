'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import { sendSignInLink } from '#/app/login/actions'
import type { LoginState } from '#/app/login/actions'
import { CheckEmail } from '#/components/CheckEmail'
import { BUSY, Field, INPUT, PRIMARY_BUTTON } from '#/components/Form'
import { withNext } from '#/lib/paths'

/** /login/email-link: get an emailed link that signs you in, no password. */
export function EmailLinkForm({
  next,
  linkFailed,
}: {
  /** Where to go after signing in. */
  next: string
  /** They came back from an expired or already-used email link. */
  linkFailed: boolean
}) {
  const [state, sendAction, sending] = useActionState(sendSignInLink, {
    email: '',
  })
  // "Use a different email" hides the sent message for that one result.
  const [dismissed, setDismissed] = useState<LoginState | null>(null)

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
      <h1 className="mb-2.5 text-signin-title text-yale-blue">
        Sign in with an email link
      </h1>
      <p className="mb-5 text-ink-2">
        We’ll email you a link that signs you in. No password needed.
      </p>

      {state.error && !state.error.field ? (
        <p role="alert" className="mb-4.5 font-semibold text-late">
          {state.error.message}
        </p>
      ) : (
        linkFailed && (
          <p role="alert" className="mb-4.5 rounded bg-wash px-3.5 py-3">
            That link has expired or was already used. Ask for a new one below.
          </p>
        )
      )}

      <form action={sendAction} noValidate>
        <input type="hidden" name="next" value={next} />
        <Field
          id="email"
          label="Email address"
          hint="If you don’t have an account yet, this creates one."
          error={
            state.error?.field === 'email' ? state.error.message : undefined
          }
        >
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
        <button
          type="submit"
          disabled={sending}
          className={`${PRIMARY_BUTTON} ${BUSY} w-full`}
        >
          Email me a sign-in link
        </button>
      </form>

      <p className="mt-5 font-semibold">
        <Link href={withNext('/login', next)}>
          <span aria-hidden="true">← </span>
          Use your password instead
        </Link>
      </p>
    </>
  )
}
