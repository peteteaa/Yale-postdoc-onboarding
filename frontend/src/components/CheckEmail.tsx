import { LINK_BUTTON } from '#/components/Form'

/** What we emailed them, for each kind of link. */
const SENT: Record<CheckEmailKind, string> = {
  'magic-link': 'a sign-in link',
  confirm: 'a link to confirm your account',
  'set-password': 'a link to set your password',
}

type CheckEmailKind = 'magic-link' | 'confirm' | 'set-password'

/** Shown after we email someone a link: to sign in, confirm a new account, or set a password. */
export function CheckEmail({
  email,
  kind,
  onDifferentEmail,
}: {
  email: string
  kind: CheckEmailKind
  onDifferentEmail: () => void
}) {
  return (
    <>
      <h1 className="mb-2.5 text-signin-title text-yale-blue">
        Check your email
      </h1>
      {kind === 'set-password' && (
        <p className="mb-3">That email already has an account.</p>
      )}
      <p role="status">
        We sent {SENT[kind]} to <strong>{email}</strong>. Open it in this
        browser
        {kind === 'set-password'
          ? ', then choose your password.'
          : ' to sign in.'}
      </p>
      <button
        type="button"
        onClick={onDifferentEmail}
        className={`${LINK_BUTTON} mt-4 text-link`}
      >
        Use a different email
      </button>
    </>
  )
}
