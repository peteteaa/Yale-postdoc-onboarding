'use client'

import { useActionState } from 'react'

import { setPassword } from '#/app/settings/actions'
import { BUSY, Field, INPUT, PRIMARY_BUTTON } from '#/components/Form'

/** Settings → Password. */
export function SetPasswordForm({ email }: { email: string }) {
  const [state, action, saving] = useActionState(setPassword, {})
  const fieldError = (field: 'password' | 'confirm') =>
    state.error?.field === field ? state.error.message : undefined

  return (
    <form action={action} noValidate>
      {/* Lets password managers save the new password under the right account */}
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        hidden
      />
      {state.saved && (
        <p role="status" className="mb-4.5 rounded bg-tint px-3.5 py-3">
          Password saved. You can now sign in with {email} and this password.
        </p>
      )}
      {state.error && !state.error.field && (
        <p role="alert" className="mb-4.5 font-semibold text-late">
          {state.error.message}
        </p>
      )}
      <Field id="password" label="New password" error={fieldError('password')}>
        {(props) => (
          <input
            {...props}
            name="password"
            type="password"
            autoComplete="new-password"
            className={INPUT}
          />
        )}
      </Field>
      <Field id="confirm" label="Type it again" error={fieldError('confirm')}>
        {(props) => (
          <input
            {...props}
            name="confirm"
            type="password"
            autoComplete="new-password"
            className={INPUT}
          />
        )}
      </Field>
      <button
        type="submit"
        disabled={saving}
        className={`${PRIMARY_BUTTON} ${BUSY}`}
      >
        Save password
      </button>
    </form>
  )
}
